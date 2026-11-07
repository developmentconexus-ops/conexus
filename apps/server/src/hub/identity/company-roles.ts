import { randomUUID } from 'node:crypto'
import type { CompanyId, Person, RoleChange, RoleCreate } from '@conexus/hub-api'
import {
  FIXED_ROLES,
  fixedNameOf,
  fixedRole,
  isFixedRole,
  ROLE_LABELS,
  Role,
  RoleView,
} from '@conexus/hub-api'
import { and, asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { admit } from './admission.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import { refusedAs } from './auth.ts'
import { companyScope, LIVE, lockCompany } from './invitations.ts'
import { replayOf } from './role-attempt.ts'
import {
  connectorsOf,
  customStatements,
  malformed,
  statementsOf,
  UNATTENDED_ACTION,
} from './role-statements.ts'
import type { RoleSet } from './roles.ts'
import { Statements } from './roles.ts'
import { invitation, member, organizationRole } from './tables.ts'

/**
 * The library's refusals of a role's write, as the Hub's failures (code C50). Two of its refusals
 * are not here because the Hub refuses first: `CANNOT_DELETE_A_PRE_DEFINED_ROLE` is `ROLE_FIXED`,
 * and `FORBIDDEN` is the admission of `manageRoles`.
 */
const ROLE_REFUSALS = {
  ROLE_NAME_IS_ALREADY_TAKEN: 'ROLE_NAME_TAKEN',
  ROLE_NOT_FOUND: 'ROLE_NOT_FOUND',
  ROLE_IS_ASSIGNED_TO_MEMBERS: 'ROLE_IN_USE',
} as const

/** The stored name of a role: its label, lowercase and without accent or space. */
function roleNameOf(label: string): string {
  return label
    .normalize('NFD')
    .replaceAll(/\p{M}/gu, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
}

/** The stored names of the fixed roles as a person reads them: a role of the company's own may not take one. */
const FIXED_NAMES = new Set(FIXED_ROLES.map((role) => roleNameOf(ROLE_LABELS[role])))

/** The rows the company's two editable roles start with: every read of the kit (founder, B1). */
export function seededRoles(set: RoleSet, companyId: CompanyId) {
  const permission = JSON.stringify(set.allReads)
  return (['developer', 'member'] as const).map((role) => ({
    id: randomUUID(),
    organizationId: companyId,
    role,
    permission,
    label: ROLE_LABELS[role],
    createdAt: new Date(),
  }))
}

/** Gives a company its developer's and member's rows; a company that has them keeps them. */
export async function seedRoles(set: RoleSet, tx: CommandTx, companyId: CompanyId): Promise<void> {
  await tx.insert(organizationRole).values(seededRoles(set, companyId)).onConflictDoNothing()
}

const Row = z.object({
  role: Role,
  label: z.string(),
  permission: z.string(),
})

/** The company's roles as its screens list them: the four fixed first, then its own by label. */
async function readRoles(set: RoleSet, tx: ReadTx, companyId: CompanyId): Promise<RoleView[]> {
  const rows = (
    await tx
      .select({
        role: organizationRole.role,
        label: organizationRole.label,
        permission: organizationRole.permission,
      })
      .from(organizationRole)
      .where(eq(organizationRole.organizationId, companyId))
      .orderBy(asc(organizationRole.label), asc(organizationRole.role))
  ).map((row) => Row.parse(row))
  const used = await tx
    .select({ role: member.role, count: sql<number>`count(*)::int` })
    .from(member)
    .where(eq(member.organizationId, companyId))
    .groupBy(member.role)
  const members = new Map(used.map((one) => [one.role, one.count]))
  const stored = new Map(rows.map((row) => [row.role, row]))
  const fixed = (['owner', 'admin', 'developer', 'member'] as const).map((name): RoleView => {
    const held = stored.get(fixedRole(name))
    const all = name === 'owner' || name === 'admin'
    const connectors = all
      ? connectorsOf(set, set.allOperations)
      : connectorsOf(set, Statements.parse(JSON.parse(held?.permission ?? '{}')))
    return {
      role: fixedRole(name),
      label: ROLE_LABELS[name],
      kind: all ? 'ALL' : 'EDITABLE',
      connectors,
      unattended: all,
      members: members.get(name) ?? 0,
    }
  })
  const own = rows
    .filter((row) => !isFixedRole(row.role))
    .map((row) => {
      const held = Statements.parse(JSON.parse(row.permission))
      return RoleView.parse({
        role: row.role,
        label: row.label,
        kind: 'CUSTOM',
        connectors: connectorsOf(set, held),
        unattended: held.agent?.includes(UNATTENDED_ACTION) === true,
        members: members.get(row.role) ?? 0,
      })
    })
  return [...fixed, ...own]
}

/** A role the company holds: a fixed one, or a row of its own; anything else is `ROLE_NOT_FOUND`. */
export async function checkRoleExists(
  tx: ReadTx,
  input: { companyId: CompanyId; role: Role },
): Promise<void> {
  if (isFixedRole(input.role)) return
  const [found] = await tx
    .select({ id: organizationRole.id })
    .from(organizationRole)
    .where(
      and(
        eq(organizationRole.organizationId, input.companyId),
        eq(organizationRole.role, input.role),
      ),
    )
  if (found === undefined) throw new Failure('ROLE_NOT_FOUND')
}

/** The name a person reads for a role of the company, for the mail that gives it. */
export async function roleLabelOf(
  tx: ReadTx,
  input: { companyId: CompanyId; role: Role },
): Promise<string> {
  const fixed = fixedNameOf(input.role)
  if (fixed !== undefined) return ROLE_LABELS[fixed]
  const [found] = await tx
    .select({ label: organizationRole.label })
    .from(organizationRole)
    .where(
      and(
        eq(organizationRole.organizationId, input.companyId),
        eq(organizationRole.role, input.role),
      ),
    )
  if (found === undefined) throw new Failure('ROLE_NOT_FOUND')
  return found.label
}

type Deps = { auth: Auth; libraryCommand: LibraryCommand; roles: RoleSet }
type Acting = { person: Person; headers: Headers; companyId: CompanyId }

/** The company's lock, then the admission: the order of every change of people and roles. */
async function admitted(tx: CommandTx, input: Acting) {
  await lockCompany(tx, input.companyId)
  return admit({
    tx,
    personId: input.person.id,
    companyId: input.companyId,
    action: 'manageRoles',
  })
}

async function viewOf(
  set: RoleSet,
  tx: ReadTx,
  companyId: CompanyId,
  role: Role,
): Promise<RoleView> {
  const found = (await readRoles(set, tx, companyId)).find((one) => one.role === role)
  if (found === undefined) throw new Failure('ROLE_NOT_FOUND')
  return found
}

/**
 * Creates a role of the company through the library, which checks that the creator holds each
 * action. The attempt key is the role's own column: under the company's lock a replay finds the
 * row and answers it, so a lost answer then a retry shows the role and not "already taken".
 */
export function createRoleCommand(deps: Deps) {
  return (input: Acting & { body: RoleCreate; attemptKey: string }) =>
    deps.libraryCommand(companyScope(input), async (tx) => {
      const { companyId, headers, body, attemptKey } = input
      await admitted(tx, input)
      const wanted = customStatements(deps.roles, body.connectors, body.unattended === true)
      const replayed = await replayOf(tx, { companyId, attemptKey, label: body.label, wanted })
      if (replayed !== undefined) {
        return { role: await viewOf(deps.roles, tx, companyId, replayed), created: false }
      }
      const role = roleNameOf(body.label)
      if (role === '') throw malformed('ROLE_NAME_EMPTY')
      if (FIXED_NAMES.has(role)) throw new Failure('ROLE_NAME_TAKEN')
      await refusedAs(
        () =>
          deps.auth.api.createOrgRole({
            headers,
            body: {
              organizationId: companyId,
              role,
              permission: wanted,
              additionalFields: { label: body.label, attemptKey },
            },
          }),
        ROLE_REFUSALS,
      )
      return {
        role: await viewOf(deps.roles, tx, companyId, Role.parse(role)),
        created: true,
      }
    })
}

/** Changes what a role uses of each connector; the owner and the administrator never change. */
export function updateRoleCommand(deps: Deps) {
  return (input: Acting & { role: Role; body: RoleChange }) =>
    deps.libraryCommand(companyScope(input), async (tx) => {
      const { companyId, headers, role, body } = input
      await admitted(tx, input)
      if (role === 'owner' || role === 'admin') throw new Failure('ROLE_FIXED')
      if (isFixedRole(role) && body.unattended === true) throw malformed('UNATTENDED_FIXED')
      const permission = isFixedRole(role)
        ? statementsOf(deps.roles, body.connectors)
        : customStatements(deps.roles, body.connectors, body.unattended === true)
      await refusedAs(
        () =>
          deps.auth.api.updateOrgRole({
            headers,
            body: { organizationId: companyId, roleName: role, data: { permission } },
          }),
        ROLE_REFUSALS,
      )
      return viewOf(deps.roles, tx, companyId, role)
    })
}

/** Deletes a role no person and no open invitation uses; the Hub counts both (an expired invitation is not open), and the library checks the people again. */
export function deleteRoleCommand(deps: Deps) {
  return (input: Acting & { role: Role; log: FailureLog }) =>
    deps.libraryCommand(companyScope(input), async (tx) => {
      const { companyId, headers, role } = input
      await admitted(tx, input)
      if (isFixedRole(role)) throw new Failure('ROLE_FIXED')
      await checkRoleExists(tx, { companyId, role })
      const invited = await tx.$count(
        invitation,
        and(
          eq(invitation.organizationId, companyId),
          eq(invitation.role, role),
          eq(invitation.status, 'pending'),
          LIVE,
        ),
      )
      if (invited > 0) {
        input.log.info(
          { companyId, role, by: input.person.id, reason: 'INVITATION' },
          'ROLE_DELETE_REFUSED',
        )
        throw new Failure('ROLE_IN_USE', { details: { reason: 'INVITATION' } })
      }
      const held = await tx.$count(
        member,
        and(eq(member.organizationId, companyId), eq(member.role, role)),
      )
      if (held > 0) {
        input.log.info(
          { companyId, role, by: input.person.id, reason: 'MEMBER' },
          'ROLE_DELETE_REFUSED',
        )
        throw new Failure('ROLE_IN_USE', { details: { reason: 'MEMBER' } })
      }
      await refusedAs(
        () =>
          deps.auth.api.deleteOrgRole({
            headers,
            body: { organizationId: companyId, roleName: role },
          }),
        ROLE_REFUSALS,
      )
    })
}

/** The company's roles for the one who manages them. */
export function listRolesCommand(deps: Pick<Deps, 'libraryCommand' | 'roles'>) {
  return (input: Acting) =>
    deps.libraryCommand(companyScope(input), async (tx) => {
      await admit({
        tx,
        personId: input.person.id,
        companyId: input.companyId,
        action: 'manageRoles',
      })
      return readRoles(deps.roles, tx, input.companyId)
    })
}
