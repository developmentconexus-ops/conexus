import { ProviderId } from '@conexus/hub-api'
import { Failure } from '../../../platform/failure.ts'
import { Credential } from '../../../platform/seal.ts'
import type { SignInFlow } from '../sign-ins.ts'
import { AnthropicRefusal, completeAnthropicLogin, startAnthropicLogin } from './anthropic-login.ts'

// A wrong, used or late code is the person's to fix; a 5xx, no answer or a malformed reply is the
// vendor down (502).
// How long the Hub keeps a started Claude sign-in's verifier for its code (decision 0049).
const CODE_SECONDS = 600

function failureOf(error: unknown): Failure {
  const refused =
    error instanceof AnthropicRefusal && (error.status === undefined || error.status < 500)
  const details = { provider: 'anthropic' }
  return refused
    ? new Failure('MODEL_ACCOUNT_REFUSED', { details, cause: error })
    : new Failure('MODEL_ACCOUNT_UNAVAILABLE', { details, cause: error })
}

/**
 * The Claude subscription's paste-code sign-in (decision 0049, criterion 2): the PKCE verifier is
 * what waits, sealed; the trade gives `refresh`, `access` and `expires`, sealed whole.
 */
export function claudeSignIn(): SignInFlow {
  return {
    provider: ProviderId.parse('anthropic'),
    seconds: CODE_SECONDS,
    async start() {
      const { url, verifier } = startAnthropicLogin()
      return { url, pending: Credential.parse(verifier) }
    },
    async complete(pending, code) {
      try {
        const credentials = await completeAnthropicLogin(code, pending.reveal())
        return Credential.parse(JSON.stringify(credentials))
      } catch (error) {
        throw failureOf(error)
      }
    },
  }
}
