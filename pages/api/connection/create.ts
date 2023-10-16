import prisma from "@lib/prisma"
import fetcher from "@utils/fetcher"
import { createIssue } from "@utils/ghHandler"
import type { NextApiRequest, NextApiResponse } from "next"

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { token, installationId, repoId, slicerId, safeAddress, spaceName } = req.body

  try {
    const Authorization = "Bearer " + token
    const body = {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization
      },
      method: "GET"
    }
    console.log(1)

    const repoData = await fetcher(
      `https://api.github.com/user/installations/${installationId}/repositories`,
      body
    )

    console.log(2)

    const sRepoData = repoData?.repositories?.find((el: any) => el.id == Number(repoId))
    if (
      !sRepoData
    ) {
      throw Error("You haven't installed merge to earn on this repo")
    }

    console.log(3)
    const connectionData = await prisma.connection.create({
      data: {
        repoId: Number(repoId),
        slicerId: Number(slicerId),
        safeAddress,
        spaceName
      }
    })
    console.log(4)
    const issue_body = `Request slice with /request wallet_address`
    await createIssue(sRepoData.owner.login, sRepoData.name, "Request for slice", issue_body, installationId)

    res.status(200).json(connectionData)
  } catch (error) {
    console.log(error)

    res.status(500).json(error)
  }
}

export default handler
