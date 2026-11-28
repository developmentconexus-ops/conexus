import type { Replies } from './layout-harness.ts'
import { companies } from './sweep-replies.ts'

export const COMPANY_ID = '0'.repeat(32)
/** The company page of an owner, with its roles. */
export function rolesReplies(): Replies {
  return companies([{ name: 'Empresa Teste', role: 'owner' }], false)
}
