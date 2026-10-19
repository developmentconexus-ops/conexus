import { ProviderId } from '@conexus/hub-api'
import {
  completeAnthropicLogin,
  startAnthropicLogin,
} from '@mastra/code-sdk/auth/providers/anthropic'
import { Failure } from '../../../platform/failure.ts'
import { Credential } from '../../../platform/seal.ts'
import type { SignInFlow } from '../sign-ins.ts'

// The trade's own refusal names the vendor's status; 5xx is the vendor down, not the code wrong.
const EXCHANGE_STATUS = /^Token exchange failed: (\d{3})$/

function failureOf(error: unknown): Failure {
  const status = error instanceof Error ? EXCHANGE_STATUS.exec(error.message)?.[1] : undefined
  const unreachable =
    error instanceof TypeError ||
    (error instanceof DOMException && ['TimeoutError', 'AbortError'].includes(error.name)) ||
    (status !== undefined && Number(status) >= 500)
  return unreachable
    ? new Failure('MODEL_ACCOUNT_UNAVAILABLE', { details: { provider: 'anthropic' }, cause: error })
    : new Failure('MODEL_ACCOUNT_REFUSED', { details: { provider: 'anthropic' }, cause: error })
}

/**
 * The Claude subscription's paste-code sign-in (decision 0049, criterion 2): the PKCE verifier is
 * what waits, sealed; the trade gives `refresh`, `access` and `expires`, sealed whole for step 12.
 */
export function claudeSignIn(): SignInFlow {
  return {
    provider: ProviderId.parse('anthropic'),
    async start() {
      const { url, verifier } = await startAnthropicLogin()
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
