import { randomUUID } from 'node:crypto'
import type { CompanyId, Person, RoleChange, RoleCreate } from '@conexus/hub-api'
import {
  ConnectorId,
  fixedRole,
  OperationId,
  isFixedRole,
  ROLE_LABELS,
  Role,
  RoleConnectors,
  RoleView,
} from '@conexus/hub-api'
import { and, asc, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { CommandTx, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { admit } from './admission.ts'
import type { Auth, LibraryCommand } from './auth.ts'
import { refusedAs } from './auth.ts'
import { companyScope, lockCompany } from './invitations.ts'
import { ALL_OPERATIONS, ALL_READS, KIT, MEMBER_BASE } from './roles.ts'
import { invitation, member, organizationRole } from './tables.ts'

const RESOURCE_PREFIX = 'connector_'
const Statements = z.record(z.string(), z.array(z.string()))
type Statements = z.infer<typeof Statements>

/** The library's refusals of a role's write, as the Hub's failures (code C50). */
const ROLE_REFUSALS = {
  ROLE_NAME_IS_ALREADY_TAKEN: 'ROLE_NAME_TAKEN',
  ROLE_NOT_FOUND: 'ROLE_NOT_FOUND',
  ROLE_IS_ASSIGNED_TO_MEMBERS: 'ROLE_IN_USE',
} as const

/** The stored name of a role: its label, lowercase and without accent or space. */
export function roleNameOf(label: string): string {
  return label
    .normalize('NFD')
    .replaceAll(/\p{M}/gu, '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, '-')
    .replaceAll(/^-+|-+$/g, '')
}

const malformed = (reason: string) => new Failure('REQUEST_MALFORMED', { details: { reason } })

/**
 * The statements a role's connectors become. The library checks only that a resource exists, so
 * the connector and each operation are checked against the kit before it is called (code C23).
 */
function statementsOf(connectors: RoleConnectors): Statements {
  const statements: Statements = {}
  for (const [connectorId, operations] of Object.entries(connectors)) {
    const connector = KIT.find((one) => one.id === connectorId)
    if (connector === undefined) throw malformed('CONNECTOR_UNKNOWN')
    const known = new Set(connector.operations.map((operation) => operation.id))
    if (operations.some((operation) => !known.has(operation))) throw malformed('OPERATION_UNKNOWN')
    if (operations.length > 0) statements[connector.resource] = [...new Set(operations)]
  }
  return statements
}

/** The connectors a stored permission names, in the kit's order; its other statements are no connector's. */
function connectorsOf(permission: Statements): RoleConnectors {
  const connectors: RoleConnectors = {}
  for (const connector of KIT) {
    const held = new Set(permission[connector.resource])
    const operations = connector.operations.map(({ id }) => id).filter((id) => held.has(id))
    if (operations.length > 0) connectors[ConnectorId.parse(connector.id)] = operations.map((id) => OperationId.parse(id))
  }
  return connectors
}

/** The statements a company's own role holds: the member's base besides its connectors. */
function customStatements(connectors: RoleConnectors): Statements {
  const base: Statements = Object.fromEntries(
    Object.entries(MEMBER_BASE).map(([resource, actions]) => [resource, [...actions]]),
  )
  return { ...base, ...statementsOf(connectors) }
}

/** The rows the company's two editable roles start with: every read of the kit (founder, B1). */
export function seededRoles(companyId: CompanyId) {
  const permission = JSON.stringify(ALL_READS)
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
export async function seedRoles(tx: CommandTx, companyId: CompanyId): Promise<void> {
  await tx.insert(organizationRole).values(seededRoles(companyId)).onConflictDoNothing()
}

const Row = z.object({
  role: Role,
  label: z.string(),
  permission: z.string(),
})

/** The company's roles as its screens list them: the four fixed first, then its own by label. */
export async function readRoles(tx: ReadTx, companyId: CompanyId): Promise<RoleView[]> {
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
      ? connectorsOf(ALL_OPERATIONS)
      : connectorsOf(Statements.parse(JSON.parse(held?.permission ?? '{}')))
    return {
      role: fixedRole(name),
      label: ROLE_LABELS[name],
      kind: all ? 'ALL' : 'EDITABLE',
      connectors,
      members: members.get(name) ?? 0,
    }
  })
  const own = rows
    .filter((row) => !isFixedRole(row.role))
    .map((row) =>
      RoleView.parse({
        role: row.role,
        label: row.label,
        kind: 'CUSTOM',
        connectors: connectorsOf(Statements.parse(JSON.parse(row.permission))),
        members: members.get(row.role) ?? 0,
      }),
    )
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
  if (isFixedRole(input.role)) return ROLE_LABELS[input.role]
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

type Deps = { auth: Auth; libraryCommand: LibraryCommand }
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

async function viewOf(tx: ReadTx, companyId: CompanyId, role: Role): Promise<RoleView> {
  const found = (await readRoles(tx, companyId)).find((one) => one.role === role)
  if (found === undefined) throw new Failure('ROLE_NOT_FOUND')
  return found
}

/** Creates a role of the company through the library, which checks that the creator holds each action. */
export function createRoleCommand(deps: Deps) {
  return (input: Acting & { body: RoleCreate }) =>
    deps.libraryCommand(companyScope(input), async (tx) => {
      const { companyId, headers, body } = input
      await admitted(tx, input)
      const role = roleNameOf(body.label)
      if (role === '') throw malformed('ROLE_NAME_EMPTY')
      const permission = customStatements(body.connectors)
      await refusedAs(
        () =>
          deps.auth.api.createOrgRole({
            headers,
            body: {
              organizationId: companyId,
              role,
              permission,
              additionalFields: { label: body.label },
            },
          }),
        ROLE_REFUSALS,
      )
      return viewOf(tx, companyId, Role.parse(role))
    })
}

/** Changes what a role uses of each connector; the owner and the administrator never change. */
export function updateRoleCommand(deps: Deps) {
  return (input: Acting & { role: Role; body: RoleChange }) =>
    deps.libraryCommand(companyScope(input), async (tx) => {
      const { companyId, headers, role, body } = input
      await admitted(tx, input)
      if (role === 'owner' || role === 'admin') throw new Failure('ROLE_FIXED')
      const permission = isFixedRole(role)
        ? statementsOf(body.connectors)
        : customStatements(body.connectors)
      await refusedAs(
        () =>
          deps.auth.api.updateOrgRole({
            headers,
            body: { organizationId: companyId, roleName: role, data: { permission } },
          }),
        ROLE_REFUSALS,
      )
      return viewOf(tx, companyId, role)
    })
}

/** Deletes a role no person and no open invitation uses; the library counts the people, the Hub the invitations. */
export function deleteRoleCommand(deps: Deps) {
  return (input: Acting & { role: Role }) =>
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
        ),
      )
      if (invited > 0) throw new Failure('ROLE_IN_USE', { details: { reason: 'INVITATION' } })
      await refusedAs(
        () => deps.auth.api.deleteOrgRole({ headers, body: { organizationId: companyId, roleName: role } }),
        ROLE_REFUSALS,
      )
    })
}

/** The company's roles for the one who manages them. */
export function listRolesCommand(deps: Pick<Deps, 'libraryCommand'>) {
  return (input: Acting) =>
    deps.libraryCommand(companyScope(input), async (tx) => {
      await admit({
        tx,
        personId: input.person.id,
        companyId: input.companyId,
        action: 'manageRoles',
      })
      return readRoles(tx, input.companyId)
    })
}
