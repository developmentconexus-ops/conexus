import { isPasswordCompromised } from 'better-auth/plugins/haveibeenpwned'
import { Failure } from '../../platform/failure.ts'

const PASSWORD_CHECK_SECONDS = 3

/**
 * Refuses a password that appears in the leaked-password corpus (security S36, S41). Only the first
 * five characters of its SHA-1 hash leave the server. The library's check takes no signal, so past
 * the deadline its request runs on alone and its answer is dropped; a check that fails or runs out
 * of time refuses the password too, since an unchecked one is not accepted. It runs before the
 * transaction that spends the link, so a refusal leaves the link as it was.
 */
export async function checkPassword(password: string): Promise<void> {
  let timer: NodeJS.Timeout | undefined
  const deadline = new Promise<'UNCHECKED'>((resolve) => {
    timer = setTimeout(() => resolve('UNCHECKED'), PASSWORD_CHECK_SECONDS * 1000)
  })
  const answer = isPasswordCompromised(password).catch(() => 'UNCHECKED' as const)
  const verdict = await Promise.race([answer, deadline]).finally(() => clearTimeout(timer))
  if (verdict === 'UNCHECKED') throw new Failure('PASSWORD_CHECK_UNAVAILABLE')
  if (verdict) throw new Failure('PASSWORD_COMPROMISED')
}
