import { defineRelations } from 'drizzle-orm'
import {
  account,
  company,
  invitation,
  member,
  organizationRole,
  rateLimit,
  session,
  user,
  verification,
} from './tables.ts'

/**
 * The joins the library asks for, by the names its relations-v2 adapter looks up: the joined model
 * for one row, the model plus "s" for many (@better-auth/drizzle-adapter dist/relations-v2,
 * getJoinRelationKey). With them each join is one query, never one per row on one connection.
 */
export const relations = defineRelations(
  {
    user,
    session,
    account,
    verification,
    rateLimit,
    company,
    member,
    invitation,
    organizationRole,
  },
  (r) => ({
    user: { accounts: r.many.account() },
    session: { user: r.one.user({ from: r.session.userId, to: r.user.id }) },
    account: { user: r.one.user({ from: r.account.userId, to: r.user.id }) },
    company: { members: r.many.member(), invitations: r.many.invitation() },
    member: {
      user: r.one.user({ from: r.member.userId, to: r.user.id }),
      company: r.one.company({ from: r.member.organizationId, to: r.company.id }),
    },
    invitation: {
      company: r.one.company({ from: r.invitation.organizationId, to: r.company.id }),
    },
  }),
)
