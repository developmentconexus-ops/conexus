import { z } from 'zod'

/** From the most privileged to the least; the four roles every company has, before its own. */
export const FIXED_ROLES = ['owner', 'admin', 'developer', 'member'] as const
export type FixedRole = (typeof FIXED_ROLES)[number]

/** A role's stored name, fixed or the company's own; the server checks it against the company. */
export const Role = z.string().trim().min(1).max(40).brand<'Role'>()
export type Role = z.infer<typeof Role>

/** A fixed role as a `Role`: the names `FIXED_ROLES` lists parse. */
export function fixedRole(name: FixedRole): Role {
  return Role.parse(name)
}

/** The roles the Operations Central invites with in a client: the rule, read by the Hub and its form. */
export const OPERATOR_INVITES_AS: readonly Role[] = [fixedRole('owner')]

/** The Portuguese name of each fixed role, on the screens and in the mail. */
export const ROLE_LABELS: Record<FixedRole, string> = {
  owner: 'Dono',
  admin: 'Administrador',
  developer: 'Desenvolvedor',
  member: 'Membro',
}

/** The fixed role a name is, or nothing for a role of the company's own. */
export function fixedNameOf(role: string): FixedRole | undefined {
  return FIXED_ROLES.find((fixed) => fixed === role)
}

/** What a screen says for a role until it has the company's own labels: the fixed role's name, else the stored one. */
export function roleLabel(role: Role): string {
  const fixed = fixedNameOf(role)
  return fixed === undefined ? role : ROLE_LABELS[fixed]
}

/** Whether the role is one of the four every company has. */
export function isFixedRole(role: string): role is FixedRole {
  return fixedNameOf(role) !== undefined
}

/**
 * What the person may do in the company, for the screens to read instead of the role: the Hub
 * answers from the same table its routes admit by (code C26).
 */
export const CompanyMay = z.object({
  manageAgents: z.boolean(),
  manageAutomations: z.boolean(),
  manageRoles: z.boolean(),
})
export type CompanyMay = z.infer<typeof CompanyMay>
