import { IssueCommentEvent, PullRequestEvent } from "@octokit/webhooks-types"
import { controllerCheck } from "@utils/controllerCheck"
import { onPrOpenedMessage, onSlicesRequestMessage } from "@utils/ghMessages"
import { createComment, deleteComment, editComment, getComments, getContributions, likeIssueComment } from "@utils/ghHandler"
import getConnection from "@utils/getConnection"
import { Connection } from "@prisma/client"
import { getPinnedComment } from "@utils/getPinnedComment"

export default async function onIssueComment(payload: IssueCommentEvent) {

    // If comment is created by bot or the issue is not created by bot then skip
    if (payload.comment.user.id.toString() == process.env.GH_APP_USERID || payload.issue.user.id.toString() != process.env.GH_APP_USERID) {
        return
    }

    const contributions = await getContributions(payload.repository.owner.login, payload.repository.name, payload.installation.id)
    const contributions_id = contributions.map(e => e.id)
    const text: string = payload.comment.body
    const requiredText = "/request"

    if (text.includes(requiredText)) {
        const connection: Connection = await getConnection(payload.repository.id)

        const splitText = text.split("-")
        let botMessage: string

        const indexToStart =
            splitText.findIndex((el) => el.includes(requiredText)) + 1

        const author = payload.issue.user.login
        const { number } = payload.issue

        const comments = await getComments(
            payload.repository.owner.login,
            payload.repository.name,
            number,
            payload.installation.id
        )


        const pinnedBotComment = await getPinnedComment(
            <PullRequestEvent & IssueCommentEvent>payload
        )

        if (contributions_id.includes(payload.comment.user.id)) {
            if (comments.filter(e => e.user.id == payload.comment.user.id).length > 1) {
                botMessage =
                    `@${payload.comment.user.login} You already requested, please delete old comment before commenting again`
                await deleteComment(payload.repository.owner.login,
                    payload.repository.name, payload.comment.id,
                    payload.installation.id)
            } else {
                await likeIssueComment(payload.repository.owner.login,
                    payload.repository.name, payload.comment.id, payload.installation.id)
            }
        } else {
            botMessage =
                `@${payload.comment.user.login} User not authorized, only the contributors can request slice distributions`
            await deleteComment(payload.repository.owner.login,
                payload.repository.name, payload.comment.id,
                payload.installation.id)
        }
        if (
            botMessage != undefined
        ) {
            await createComment(
                payload.repository.owner.login,
                payload.repository.name,
                payload.issue.number,
                botMessage,
                payload.installation.id
            )
        }
    } else {
        await deleteComment(payload.repository.owner.login,
            payload.repository.name, payload.comment.id,
            payload.installation.id)
    }
}
