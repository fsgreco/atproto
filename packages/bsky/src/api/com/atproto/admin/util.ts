import AppContext from '../../../../context'
import {
  RepoView,
  RepoViewDetail,
  AccountView,
} from '../../../../lexicon/types/com/atproto/admin/defs'

export const getPdsAccountInfo = async (
  ctx: AppContext,
  did: string,
): Promise<AccountView | null> => {
  try {
    const agent = await ctx.pdsAdminAgent(did)
    const res = await agent.api.com.atproto.admin.getAccountInfo({ did })
    return res.data
  } catch (err) {
    return null
  }
}

export const getPdsAccountInfos = async (
  ctx: AppContext,
  dids: string[],
): Promise<Record<string, AccountView>> => {
  const unique = [...new Set(dids)]
  const infos = await Promise.all(
    unique.map((did) => getPdsAccountInfo(ctx, did)),
  )
  return infos.reduce((acc, cur) => {
    if (cur) {
      acc[cur.did] = cur
    }
    return acc
  }, {} as Record<string, AccountView>)
}

export const addAccountInfoToRepoViewDetail = (
  repoView: RepoViewDetail,
  accountInfo: AccountView | null,
  includeEmail = false,
): RepoViewDetail => {
  if (!accountInfo) return repoView
  return {
    ...repoView,
    email: includeEmail ? accountInfo.email : undefined,
    invitedBy: accountInfo.invitedBy,
    invitesDisabled: accountInfo.invitesDisabled,
    inviteNote: accountInfo.inviteNote,
    invites: accountInfo.invites,
  }
}

export const addAccountInfoToRepoView = (
  repoView: RepoView,
  accountInfo: AccountView | null,
  includeEmail = false,
): RepoView => {
  if (!accountInfo) return repoView
  return {
    ...repoView,
    email: includeEmail ? accountInfo.email : undefined,
    invitedBy: accountInfo.invitedBy,
    invitesDisabled: accountInfo.invitesDisabled,
    inviteNote: accountInfo.inviteNote,
  }
}
