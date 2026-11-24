import { z } from 'zod'

/**
 * Whether two holders of the same credential can each keep a session (decision 0077): SHAREABLE when
 * a second login leaves the first alive (Sankhya, measured), EXCLUSIVE when a renewal ends the other's
 * (Mercado Livre's single-use refresh). HubSpot is EXCLUSIVE until measured. Every login declares it,
 * with no default; not the account's `exclusive`, which is one connection per account.
 */
export const CredentialClass = z.enum(['SHAREABLE', 'EXCLUSIVE'])
export type CredentialClass = z.infer<typeof CredentialClass>
