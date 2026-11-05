import { createAccessControl } from 'better-auth/plugins/access'
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from 'better-auth/plugins/organization/access'

/** The statements the organization plugin's roles may hold: its own and the Hub's. */
export const ACCESS_CONTROL = createAccessControl({
  ...defaultStatements,
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
    company: ['nickname'],
  }),
  admin: ACCESS_CONTROL.newRole({ ...adminAc.statements, ...MANAGE_COMPANY, ...BUILD }),
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
