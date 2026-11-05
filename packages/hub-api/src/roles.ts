import { z } from 'zod'

/** From the most privileged to the least; `mayInviteAs` and the invite form read this order. */
export const Role = z.enum(['owner', 'admin', 'developer', 'member'])
export type Role = z.infer<typeof Role>

/** The roles the Operations Central invites with in a client: the rule, read by the Hub and its form. */
export const OPERATOR_INVITES_AS: readonly Role[] = ['owner']

/** The Portuguese name of each role, on the screens and in the mail. */
export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Dono',
  admin: 'Administrador',
  developer: 'Desenvolvedor',
  member: 'Membro',
}

/**
 * What the person may do in the company, for the screens to read instead of the role: the Hub
 * answers from the same table its routes admit by (code C26).
 */
export const CompanyMay = z.object({ manageAgents: z.boolean(), manageAutomations: z.boolean() })
export type CompanyMay = z.infer<typeof CompanyMay>
