import { IssueCommentEvent } from "@octokit/webhooks-types"
import { Connection } from "@prisma/client";
import getConnection from "@utils/getConnection";
import { createComment, getComments } from "@utils/ghHandler";
import { Mint, proposeTransaction } from "@utils/proposeSafeTransaction";

export default async function onIssueClosed(payload: IssueCommentEvent) {
    console.log("issue closed");


    if (payload.issue.user.id.toString() != process.env.GH_APP_USERID) {
        return
    }

    const connection: Connection = await getConnection(payload.repository.id)
    const { slicerId, safeAddress } = connection
    const { number } = payload.issue

    const comments = await getComments(
        payload.repository.owner.login,
        payload.repository.name,
        number,
        payload.installation.id
    )

    const accountsToReslice: Mint[] = comments.map(e => e.body).filter(e => e.includes("/request")).map(e => {
        return { account: e.split(" ")[1], shares: 1 }
    })
    const status = await proposeTransaction(
        accountsToReslice,
        safeAddress,
        slicerId
    )
    const message =
        status == 201
            ? "Successfully proposed transaction on the Gnosis Safe 🎉"
            : "Due to an unexpected issue the transaction has not been proposed on the Gnosis Safe. Please contact the project's maintainers."
    await createComment(
        payload.repository.owner.login,
        payload.repository.name,
        payload.issue.number,
        message,
        payload.installation.id
    )

}
