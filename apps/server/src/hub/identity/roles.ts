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
})

const MANAGE_COMPANY = {
  project: ['create', 'delete'],
  modelAccount: ['manage'],
} as const

/**
 * The plugin's roles: its defaults and what each does to a Project (founder, step 7, P1 A). Every
 * member creates one; only an owner or an administrator deletes one and changes its model
 * accounts (step 11, D4). Only the
 * owner chooses the company's nickname (step 8, N1).
 * `allows` in admission reads these, so who may do what lives here alone (code C26).
 */
export const COMPANY_ROLES = {
  owner: ACCESS_CONTROL.newRole({
    ...ownerAc.statements,
    ...MANAGE_COMPANY,
    company: ['nickname'],
  }),
  admin: ACCESS_CONTROL.newRole({ ...adminAc.statements, ...MANAGE_COMPANY }),
  member: ACCESS_CONTROL.newRole({ ...memberAc.statements, project: ['create'] }),
}
