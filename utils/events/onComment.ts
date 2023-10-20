import { IssueCommentEvent, PullRequestEvent } from "@octokit/webhooks-types"
import getConnection from "@utils/getConnection"
import { Connection } from "@prisma/client"
import { createComment, deleteComment, editComment, getComments, getContributions, getRole, likeIssueComment } from "@utils/ghHandler"

import { propose } from "@utils/snapshot"
import { Mint, proposeTransaction } from "@utils/proposeSafeTransaction"

type ProposalRoot = {
  data: Data;
}

type Data = {
  proposal: Proposal;
}

type Proposal = {
  state: string;
  choices: string[];
  scores: number[];
}

export default async function onComment(payload: IssueCommentEvent) {
  const connection: Connection = await getConnection(payload.repository.id)
  const { spaceName } = connection

  // If comment is created by bot then skip
  if (payload.comment.user.id.toString() == process.env.GH_APP_USERID) {
    return
  }

  const text: string = payload.comment.body
  const requiredText = "/request"
  if (text.startsWith(requiredText)) {
    if (payload.issue.user.id != payload.comment.user.id) {
      await deleteComment(payload.repository.owner.login,
        payload.repository.name, payload.comment.id,
        payload.installation.id)
      await createComment(
        payload.repository.owner.login,
        payload.repository.name,
        payload.issue.number,
        `@${payload.comment.user.login} User not authorized, only the PR owner can request slice distributions`,
        payload.installation.id
      )
      return
    }
    await likeIssueComment(payload.repository.owner.login,
      payload.repository.name, payload.comment.id, payload.installation.id)
  } else if (text.startsWith("/distribute")) {

    const { number } = payload.issue
    if (payload.issue.user.id != payload.comment.user.id) {
      await createComment(
        payload.repository.owner.login,
        payload.repository.name,
        payload.issue.number,
        `@${payload.comment.user.login} User not authorized, only the PR owner can request proposal`,
        payload.installation.id
      )
      await deleteComment(payload.repository.owner.login,
        payload.repository.name, payload.comment.id,
        payload.installation.id)
      return;
    }
    const comments = await getComments(
      payload.repository.owner.login,
      payload.repository.name,
      number,
      payload.installation.id
    )
    const addresses = comments.map(e => e.body).filter(e => e.startsWith("/request")).map(e => e.split(" ")[1])
    const id = await propose(addresses, `PR:${payload.organization.login}/${payload.repository.name}:${payload.issue.number}`, spaceName);
    await createComment(
      payload.repository.owner.login,
      payload.repository.name,
      payload.issue.number,
      `Proposal created ${id} https://demo.snapshot.org/#/${spaceName}/proposal/${id}`,
      payload.installation.id
    )
  } else if (text.startsWith("/merge")) {
    const roles = await getRole(payload.organization.login, payload.comment.user.login, payload.installation.id)
    if (roles.role != "admin" && roles.role != "member") {
      await createComment(
        payload.repository.owner.login,
        payload.repository.name,
        payload.issue.number,
        `@${payload.comment.user.login} User not authorized, only the member of organisation can merge`,
        payload.installation.id
      )
      await deleteComment(payload.repository.owner.login,
        payload.repository.name, payload.comment.id,
        payload.installation.id)
      return;
    }
    const { safeAddress, slicerId } = connection

    const { number } = payload.issue

    const comments = await getComments(
      payload.repository.owner.login,
      payload.repository.name,
      number,
      payload.installation.id
    )

    const proposal_comment = comments.find(e => e.body.startsWith("Proposal created "));
    if (!proposal_comment) {
      await createComment(
        payload.repository.owner.login,
        payload.repository.name,
        payload.issue.number,
        `@${payload.comment.user.login} First use /distribute to create proposal`,
        payload.installation.id
      )
      return;
    }
    const proposal_id = proposal_comment.body.split(" ")[2]
    const body = {
      operationName: "Proposal",
      query: `query Proposal {
        proposal(id:"${proposal_id}"){
        state
          choices
          scores
          scores_total
        }
        }
      `,
      variables: {},
    };
    const res = await fetch("https://testnet.snapshot.org/graphql", {
      body: JSON.stringify(body),
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }).then<ProposalRoot>((e) => e.json());

    if (res.data.proposal.state != "closed") {
      await createComment(
        payload.repository.owner.login,
        payload.repository.name,
        payload.issue.number,
        `@${payload.comment.user.login} Proposal is still open`,
        payload.installation.id
      )
      return;
    }

    const total_slices = +payload.comment.body.split("/merge ")[1]

    const mints: Mint[] = res.data.proposal.choices.map((e, i) => {
      return {
        account: e,
        shares: Math.ceil((total_slices/res.scores_total) * (res.data.proposal.scores?.[i] ?? 0))
      }
    })
    const status = await proposeTransaction(
      mints,
      safeAddress,
      slicerId
    )

    const message =
      status == 201
        ? `Successfully proposed transaction on the Gnosis Safe 🎉
        Slice distributions
        ${mints.map(e => e.account + " " + e.shares + " Slice").join('\n')}`
        : "Due to an unexpected issue the transaction has not been proposed on the Gnosis Safe. Please contact the project's maintainers."

    await createComment(
      payload.repository.owner.login,
      payload.repository.name,
      payload.issue.number,
      message,
      payload.installation.id
    )
  }
}
