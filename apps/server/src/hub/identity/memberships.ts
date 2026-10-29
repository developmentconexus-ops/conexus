import type { CompanyId, Person, PersonId } from '@conexus/hub-api'
import {
  Email,
  LIBRARY_ID,
  Member,
  PAGE_SIZE,
  PersonId as PersonIdSchema,
  Role,
} from '@conexus/hub-api'
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx, Database, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { after, pageKey, pageOf } from '../../platform/pages.ts'
import type { Actor, CompanyProof } from './admission.ts'
import { actorOf, admitCompany, rankAllows } from './admission.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import { organizationAdapter } from './auth.ts'
import { cancelSentBy } from './invitation-management.ts'
import { companyScope, LIVE, lockCompany } from './invitations.ts'
import { invitation, member, user } from './tables.ts'

const Listed = Member.pick({ personId: true, name: true }).extend({
  id: z.string().regex(LIBRARY_ID),
  email: Email,
  role: Role,
  invitationsSent: z.number().int().nonnegative(),
})
type Listed = z.infer<typeof Listed>

// The invitations a removal would cancel: what the person sent here that still opens.
const columns = {
  id: member.id,
  personId: user.id,
  name: user.name,
  email: user.email,
  role: member.role,
  invitationsSent: sql<number>`(select count(*)::int from ${invitation}
    where ${invitation.organizationId} = ${member.organizationId}
    and ${invitation.inviterId} = ${member.userId}
    and ${invitation.status} = 'pending' and ${LIVE})`,
}

/** What the viewer may do to a row, from the rank table that decides it on the write (code C26). */
function viewOf(viewer: { actor: Actor; personId: PersonId }, row: Listed): Member {
  const { id: _id, ...shown } = row
  return {
    ...shown,
    mayRemove: viewer.personId === row.personId || rankAllows(viewer.actor, row.role),
    mayChangeTo: Role.options.filter(
      (next) => next !== row.role && rankAllows(viewer.actor, row.role, next),
    ),
  }
}

function viewerOf(admitted: CompanyProof, personId: PersonId) {
  return { actor: actorOf(admitted), personId }
}

export function readMembers(
  database: Database,
  input: { personId: PersonId; companyId: CompanyId },
  page: string | undefined,
) {
  return database.read({ kind: 'COMPANY', ...input }, async (tx) => {
    const admitted = await admitCompany({ tx, ...input, action: 'readMembers' })
    const key = pageKey(page, Listed.shape.id)
    const rows = await tx
      .select(columns)
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(
        and(
          eq(member.organizationId, admitted.companyId),
          after(sql`(${user.name}, ${member.id})`, key, (id) =>
            tx
              .select({ name: user.name, id: member.id })
              .from(member)
              .innerJoin(user, eq(user.id, member.userId))
              .where(and(eq(member.id, id), eq(member.organizationId, admitted.companyId))),
          ),
        ),
      )
      .orderBy(asc(user.name), asc(member.id))
      .limit(PAGE_SIZE + 1)
    const listed = pageOf(
      rows.map((row) => Listed.parse(row)),
      (row) => row.id,
    )
    const viewer = viewerOf(admitted, input.personId)
    return { members: listed.rows.map((row) => viewOf(viewer, row)), next: listed.next }
  })
}

const Named = z.object({ personId: PersonIdSchema, name: z.string().min(1), email: Email })

/** The company's members, who build its apps and use every one (step 18, E1). */
export async function companyMembersOf(tx: ReadTx, companyId: CompanyId) {
  const rows = await tx
    .select({ personId: user.id, name: user.name, email: user.email })
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(eq(member.organizationId, companyId))
    .orderBy(asc(user.name), asc(user.id))
  return rows.map((row) => Named.parse(row))
}

/** The name and address of each person the scope reads among `personIds`. */
export async function peopleNamed(tx: ReadTx, personIds: readonly PersonId[]) {
  if (personIds.length === 0) return new Map<PersonId, z.infer<typeof Named>>()
  const rows = await tx
    .select({ personId: user.id, name: user.name, email: user.email })
    .from(user)
    .where(inArray(user.id, [...personIds]))
  return new Map(rows.map((row) => Named.parse(row)).map((named) => [named.personId, named]))
}

type OfMember = { person: Person; companyId: CompanyId; personId: PersonId }

/** The company's lock, then the admission, then the member the action names: the order of every change of people. */
async function admittedTarget(
  tx: CommandTx,
  input: OfMember & { action: 'removeMember' | 'leaveCompany' | 'changeRole' },
) {
  await lockCompany(tx, input.companyId)
  const admitted = await admitCompany({
    tx,
    personId: input.person.id,
    companyId: input.companyId,
    action: input.action,
  })
  const [found] = await tx
    .select(columns)
    .from(member)
    .innerJoin(user, eq(member.userId, user.id))
    .where(and(eq(member.organizationId, input.companyId), eq(member.userId, input.personId)))
  return { admitted, target: Listed.optional().parse(found) }
}

/**
 * The company keeps an owner (security S11): the lock every change of people takes makes this count
 * the committed one, so two changes at once cannot each leave the other as the owner.
 */
async function keepOwner(
  tx: CommandTx,
  input: { companyId: CompanyId; leaving: Role; next?: Role },
) {
  if (input.leaving !== 'owner' || input.next === 'owner') return
  const owners = await tx.$count(
    member,
    and(eq(member.organizationId, input.companyId), eq(member.role, 'owner')),
  )
  if (owners <= 1) throw new Failure('LAST_OWNER')
}

function refused(): Failure {
  return new Failure('NOT_FOUND', { details: { reason: 'FORBIDDEN' } })
}

/** What taking a person out asks of the Builder (code C4): their conversations' threads and memory. */
export type PersonConversationRelease = (scope: {
  companyId: CompanyId
  personId: PersonId
}) => Promise<void>

/** The member the removal takes out, after its checks, or nothing if they are already out. */
async function removable(tx: CommandTx, input: OfMember) {
  const leaving = input.person.id === input.personId
  const action = leaving ? 'leaveCompany' : 'removeMember'
  const { admitted, target } = await admittedTarget(tx, { ...input, action })
  if (target === undefined) return undefined
  if (!leaving && !rankAllows(actorOf(admitted), target.role)) throw refused()
  await keepOwner(tx, { companyId: input.companyId, leaving: target.role })
  return target
}

/**
 * Takes a person out of the company, or the person out of theirs; a person already out stays out.
 * Their pending invitations go with them. Their conversations go first, with no transaction open
 * (data D22), after a first pass of the same checks: if the Builder cannot release them, the
 * person stays, `PERSON_REMOVAL_PENDING`. It writes through the plugin's adapter: the endpoints
 * require the caller to be a member, which the operator is not, and their last-owner count is not
 * locked (docs/reference/boundaries.md). Returns the role the person held, or nothing if absent.
 */
export function removeMemberCommand(deps: {
  auth: Auth
  libraryCommand: LibraryCommand
  releaseConversations: PersonConversationRelease
}) {
  return async (input: OfMember) => {
    const { companyId, personId } = input
    const found = await deps.libraryCommand(companyScope(input), (tx) => removable(tx, input))
    if (found === undefined) return undefined
    await deps.releaseConversations({ companyId, personId }).catch((cause: unknown) => {
      throw new Failure('PERSON_REMOVAL_PENDING', { cause })
    })
    return deps.libraryCommand(companyScope(input), async (tx) => {
      const target = await removable(tx, input)
      if (target === undefined) return undefined
      const adapter = await organizationAdapter(deps.auth)
      await adapter.deleteMember({
        memberId: target.id,
        organizationId: companyId,
        userId: personId,
      })
      await cancelSentBy(tx, { companyId, personId })
      return target.role
    })
  }
}

/** Changes a member's role at the role the caller read, through the adapter, under the same lock. */
export function changeMemberRoleCommand(deps: { auth: Auth; libraryCommand: LibraryCommand }) {
  return (input: OfMember & { role: Role; from: Role }) =>
    deps.libraryCommand(companyScope(input), async (tx) => {
      const { admitted, target } = await admittedTarget(tx, { ...input, action: 'changeRole' })
      if (target === undefined) throw refused()
      if (target.role !== input.from) throw new Failure('MEMBER_STALE')
      if (!rankAllows(actorOf(admitted), target.role, input.role)) throw refused()
      await keepOwner(tx, { companyId: input.companyId, leaving: target.role, next: input.role })
      const adapter = await organizationAdapter(deps.auth)
      await adapter.updateMember(target.id, input.role)
      return viewOf(viewerOf(admitted, input.person.id), { ...target, role: input.role })
    })
}
