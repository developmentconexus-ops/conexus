import { createAccessControl } from 'better-auth/plugins/access'
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from 'better-auth/plugins/organization/access'
import { z } from 'zod'

/** What a role holds in the library's own shape: each resource with its actions. */
export const Statements = z.record(z.string(), z.array(z.string()))
export type Statements = z.infer<typeof Statements>

/**
 * What a connector offers a role: its resource and its operations by the ids the kit gives them.
 * The server's start hands the list over, so the identity never imports the kit (security S36).
 */
export type RoleKit = readonly {
  id: string
  resource: string
  operations: readonly { id: string; class: string }[]
}[]

const MANAGE_COMPANY = {
  project: ['create', 'delete'],
  modelAccount: ['manage'],
  appAccess: ['manage'],
  connection: ['manage'],
  request: ['create', 'decide'],
} as const

// Every member asks to publish a version; only an owner or an administrator decides (step 24.3.4, "3").
const ASK = { request: ['create'] } as const

// Only an owner or an administrator, and a company role marked with it, publishes a write that runs
// without asking (step 24.5, Papéis `D1`).
const UNATTENDED = ['publishUnattendedWrite'] as const

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
export function rolesFor(kit: RoleKit) {
  const allOperations: Record<string, string[]> = Object.fromEntries(
    kit.map((connector) => [connector.resource, connector.operations.map(({ id }) => id)]),
  )
  const allReads: Record<string, string[]> = Object.fromEntries(
    kit.map((connector) => [
      connector.resource,
      connector.operations.filter(({ class: kind }) => kind === 'read').map(({ id }) => id),
    ]),
  )
  // The statements the organization plugin's roles may hold: its own and the Hub's.
  const ac = createAccessControl({
    ...defaultStatements,
    ...allOperations,
    project: ['create', 'delete'],
    company: ['nickname'],
    modelAccount: ['manage'],
    appAccess: ['manage'],
    connection: ['manage'],
    app: ['publish'],
    agent: ['manage', 'publish', ...UNATTENDED],
    automation: ['manage'],
    assistant: ['ask'],
    request: ['create', 'decide'],
  })
  const roles = {
    // The owner and the administrator use every operation of every connector, always.
    owner: ac.newRole({
      ...ownerAc.statements,
      ...MANAGE_COMPANY,
      ...BUILD,
      agent: [...BUILD.agent, ...UNATTENDED],
      ...allOperations,
      company: ['nickname'],
    }),
    admin: ac.newRole({
      ...adminAc.statements,
      ...MANAGE_COMPANY,
      ...BUILD,
      agent: [...BUILD.agent, ...UNATTENDED],
      ...allOperations,
    }),
    developer: ac.newRole({
      ...memberAc.statements,
      project: ['create'],
      ...BUILD,
      ...ASK,
    }),
    member: ac.newRole({
      ...memberAc.statements,
      project: ['create'],
      assistant: ['ask'],
      ...ASK,
    }),
  }
  // A role of the company's own holds the member's base besides its connectors (founder, B1); the
  // developer and the member keep theirs in the fixed role, so they store connectors only.
  return { kit, ac, roles, allOperations, allReads, memberBase: roles.member.statements }
}

export type RoleSet = ReturnType<typeof rolesFor>

/** The roles with no connector: `allows` reads only actions that name none (code C26). */
export const NO_KIT_ROLES = rolesFor([])
export const COMPANY_ROLES = NO_KIT_ROLES.roles
