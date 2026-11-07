import { CONNECTORS } from '@conexus/connectors'
import { createAccessControl } from 'better-auth/plugins/access'
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from 'better-auth/plugins/organization/access'

/**
 * What a connector offers a role: the door's reads and the operations, by the ids the kit gives
 * them. The kit owns the list (code C26); this only assembles it.
 */
export const KIT = CONNECTORS.map((connector) => ({
  id: connector.id,
  resource: `connector_${connector.id}`,
  operations: [...Object.values(connector.readDoor ?? {}), ...connector.operations].map(
    (operation) => ({ id: operation.id, class: operation.class }),
  ),
}))

const CONNECTOR_STATEMENTS: Record<string, string[]> = Object.fromEntries(
  KIT.map((connector) => [
    connector.resource,
    connector.operations.map((operation) => operation.id),
  ]),
)

const READS: Record<string, string[]> = Object.fromEntries(
  KIT.map((connector) => [
    connector.resource,
    connector.operations.filter((operation) => operation.class === 'read').map(({ id }) => id),
  ]),
)

/** What the owner and the administrator use: every operation of every connector, always. */
export const ALL_OPERATIONS = CONNECTOR_STATEMENTS

/** What the developer and the member use when a company is born: every read of the kit (founder, B1). */
export const ALL_READS = READS

/** The statements the organization plugin's roles may hold: its own and the Hub's. */
export const ACCESS_CONTROL = createAccessControl({
  ...defaultStatements,
  ...CONNECTOR_STATEMENTS,
  project: ['create', 'delete'],
  company: ['nickname'],
  modelAccount: ['manage'],
  appAccess: ['manage'],
  connection: ['manage'],
  app: ['publish'],
  agent: ['manage', 'publish'],
  automation: ['manage'],
  assistant: ['ask'],
  request: ['create', 'decide'],
})

const MANAGE_COMPANY = {
  project: ['create', 'delete'],
  modelAccount: ['manage'],
  appAccess: ['manage'],
  connection: ['manage'],
  request: ['create', 'decide'],
} as const

// Every member asks to publish a version; only an owner or an administrator decides (step 24.3.4, "3").
const ASK = { request: ['create'] } as const

// What makes a person a builder: they publish apps, manage and publish agents, create automations
// and ask the Assistant (step 24.3.4, U1). The connections stay the administrators' (step 19, D).
const BUILD = {
  app: ['publish'],
  agent: ['manage', 'publish'],
  automation: ['manage'],
  assistant: ['ask'],
} as const

/**
 * The plugin's roles: its defaults and what each does to a Project (founder, step 7, P1 A). Every
 * member creates one; only an owner or an administrator deletes one and changes its model
 * accounts (step 11, D4), gives and takes a person's access to an app (step 18, B), and links,
 * tests and removes the company's connections (step 19, D). Only the
 * owner chooses the company's nickname (step 8, N1).
 * `allows` in admission reads these, so who may do what lives here alone (code C26).
 */
export const COMPANY_ROLES = {
  owner: ACCESS_CONTROL.newRole({
    ...ownerAc.statements,
    ...MANAGE_COMPANY,
    ...BUILD,
    ...ALL_OPERATIONS,
    company: ['nickname'],
  }),
  admin: ACCESS_CONTROL.newRole({
    ...adminAc.statements,
    ...MANAGE_COMPANY,
    ...BUILD,
    ...ALL_OPERATIONS,
  }),
  developer: ACCESS_CONTROL.newRole({
    ...memberAc.statements,
    project: ['create'],
    ...BUILD,
    ...ASK,
  }),
  member: ACCESS_CONTROL.newRole({
    ...memberAc.statements,
    project: ['create'],
    assistant: ['ask'],
    ...ASK,
  }),
}

/**
 * What a role of the company's own holds besides its connectors: the member's base, written by the
 * Hub and never shown (founder, B1). Developer and member keep theirs in the fixed role.
 */
export const MEMBER_BASE = {
  ...memberAc.statements,
  project: ['create'],
  assistant: ['ask'],
  request: ['create'],
} as const
