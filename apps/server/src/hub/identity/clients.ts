import type { CompanyId, Email } from '@conexus/hub-api'
import { Client, Company, OwnerInvitation } from '@conexus/hub-api'
import { and, asc, eq, inArray, min, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { OperatorProof } from './admission.ts'
import type { Auth } from './auth.ts'
import { organizationAdapter, storedAddress } from './auth.ts'
import { companyById } from './companies.ts'
import { stateOf } from './invitation-reads.ts'
import {
  LIVE,
  lockCompany,
  lockedInviter,
  PendingRow,
  pending,
  pendingOf,
  Status,
} from './invitations.ts'
import { company, invitation, member, user } from './tables.ts'

// The ports the Operations Central reaches identity through (code C4), each in the caller's
// transaction. The operator's proof comes from `admitOperator`; nothing here checks a role again.

const SentRow = PendingRow.extend({ status: Status, unmailed: z.boolean() })

/**
 * Creates a client's company with no member and the invitation of its first owner, through the
 * plugin's adapter: its endpoint would make the caller a member (`crud-org.mjs:80-100`). The
 * attempt key is the company's slug and key and the invitation's key, so a replay finds both; the
 * same key with another name or address is a conflict (code C37).
 */
export function registerCompanyOn(auth: Auth) {
  return async (
    tx: CommandTx,
    input: { admitted: OperatorProof; name: string; ownerEmail: Email; attemptKey: string },
  ) => {
    const email = storedAddress(input.ownerEmail)
    const [found] = await tx
      .select({ id: company.id, name: company.name })
      .from(company)
      .where(eq(company.attemptKey, input.attemptKey))
    if (found !== undefined) {
      const [listed] = await tx
        .select({
          ...pending,
          status: invitation.status,
          unmailed: sql<boolean>`${invitation.status} = 'pending' and ${invitation.mailedAt} is null
            and ${LIVE}`,
        })
        .from(invitation)
        .where(
          and(eq(invitation.organizationId, found.id), eq(invitation.attemptKey, input.attemptKey)),
        )
      const sent = SentRow.optional().parse(listed)
      if (found.name !== input.name || sent?.email !== email) {
        throw new Failure('IDEMPOTENCY_CONFLICT')
      }
      // Committed but never answered by the provider: the replay sends it again (C64).
      const mail = sent.unmailed ? pendingOf(sent) : undefined
      return { company: Company.parse(found), mail, created: false }
    }
    const adapter = await organizationAdapter(auth)
    const { attemptKey } = input
    const made = await adapter.createOrganization({
      organization: { name: input.name, slug: attemptKey, attemptKey, createdAt: new Date() },
    })
    const created = Company.parse({ id: made.id, name: made.name })
    const invited = await adapter.createInvitation({
      invitation: { email, role: 'owner', organizationId: created.id, teamIds: [], attemptKey },
      user: await lockedInviter(tx, input.admitted.personId),
    })
    const [row] = await tx.select(pending).from(invitation).where(eq(invitation.id, invited.id))
    return { company: created, mail: pendingOf(PendingRow.parse(row)), created: true }
  }
}

/** Renames a company still awaiting its first owner, under the company's lock (security S8). */
export function renameCompanyOn(auth: Auth) {
  return async (
    tx: CommandTx,
    input: { admitted: OperatorProof; companyId: CompanyId; name: string },
  ): Promise<{ ok: true } | { ok: false; reason: 'ACTIVE' }> => {
    await lockCompany(tx, input.companyId)
    const members = await tx.$count(member, eq(member.organizationId, input.companyId))
    if (members > 0) return { ok: false, reason: 'ACTIVE' }
    if ((await companyById(tx, input.companyId)).name !== input.name) {
      const adapter = await organizationAdapter(auth)
      await adapter.updateOrganization(input.companyId, { name: input.name })
    }
    return { ok: true }
  }
}

/**
 * Deletes a client's company with its members and invitations, through the plugin's adapter
 * (`organization/adapter.mjs:370`), in the caller's transaction: its endpoint asks for a
 * membership (`crud-org.mjs:264`), and the Hub routes none to it. The caller took the company's
 * lock first; taking it again holds it. The adapter returns no row count, and a read afterwards
 * goes through the same row policy as the DELETE, so it could not see a row the policy hid: no
 * check follows (code C50).
 */
export function deleteCompanyOn(auth: Auth) {
  return async (
    tx: CommandTx,
    input: { admitted: OperatorProof; companyId: CompanyId },
  ): Promise<void> => {
    await lockCompany(tx, input.companyId)
    const adapter = await organizationAdapter(auth)
    await adapter.deleteOrganization(input.companyId)
  }
}

export type OperatedCompany = { name: string; state: Client['state'] }

const InvitationRow = PendingRow.extend({
  status: Status,
  live: z.boolean(),
  companyId: z.string(),
})

/** The last owner invitation of each company, the newest first (C26: derived, never stored). */
async function lastOwnerInvitations(tx: ReadTx, companyIds: CompanyId[]) {
  const ranked = tx
    .select({
      ...pending,
      companyId: invitation.organizationId,
      status: invitation.status,
      live: sql<boolean>`${LIVE}`.as('live'),
      rank: sql<number>`row_number() over (partition by ${invitation.organizationId}
        order by ${invitation.createdAt} desc, ${invitation.id} desc)`.as('rank'),
    })
    .from(invitation)
    .where(and(inArray(invitation.organizationId, companyIds), eq(invitation.role, 'owner')))
    .as('ranked')
  const rows = await tx.select().from(ranked).where(eq(ranked.rank, 1))
  return new Map(
    rows.map((listed) => {
      const row = InvitationRow.parse(listed)
      return [row.companyId, row]
    }),
  )
}

/** The owner invitation a company awaiting its first owner shows; an accepted one never is. */
function ownerInvitationOf(row: z.infer<typeof InvitationRow>) {
  return OwnerInvitation.parse({
    ...row,
    state: stateOf(row.status, row.live),
    expiresAt: row.expiresAt.toISOString(),
  })
}

/**
 * The name and state of the companies the operator asks for: awaiting its first owner while no one
 * is a member, active since the first membership, with the current owners and nobody else (P7).
 */
export async function readOperatedCompanies(
  tx: ReadTx,
  input: { admitted: OperatorProof; companyIds: CompanyId[] },
): Promise<Map<CompanyId, OperatedCompany>> {
  const { companyIds } = input
  if (companyIds.length === 0) return new Map()
  const named = await tx
    .select({ id: company.id, name: company.name })
    .from(company)
    .where(inArray(company.id, companyIds))
  const since = await tx
    .select({ companyId: member.organizationId, since: min(member.createdAt) })
    .from(member)
    .where(inArray(member.organizationId, companyIds))
    .groupBy(member.organizationId)
  const owners = await tx
    .select({ companyId: member.organizationId, name: user.name, email: user.email })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(and(inArray(member.organizationId, companyIds), eq(member.role, 'owner')))
    .orderBy(asc(user.name), asc(user.id))
  const activeSince = new Map(since.map((row) => [row.companyId, row.since]))
  const invitations = await lastOwnerInvitations(tx, companyIds)
  const operated = new Map<CompanyId, OperatedCompany>()
  for (const row of named) {
    const { id, name } = Company.parse(row)
    const first = activeSince.get(id)
    const last = invitations.get(id)
    if (first != null) {
      const ownersOf = owners.filter((owner) => owner.companyId === id)
      const active = { kind: 'ACTIVE', activeSince: first.toISOString(), owners: ownersOf }
      operated.set(id, { name, state: Client.shape.state.parse(active) })
    } else if (last !== undefined) {
      const ownerInvitation = ownerInvitationOf(last)
      operated.set(id, { name, state: { kind: 'AWAITING_OWNER', ownerInvitation } })
    } else {
      throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'no owner invitation' } })
    }
  }
  return operated
}
