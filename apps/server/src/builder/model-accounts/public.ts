import { ProviderId } from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { SealKeys } from '../../platform/seal.ts'
import { claudeSignIn } from './claude/claude.ts'
import { reseal } from './reseal.ts'
import { registerModelAccountRoutes } from './routes.ts'
import type { SignInFlow, SignInFlows } from './sign-ins.ts'
import { createModelAccountStore } from './store.ts'

export type ModelAccounts = ReturnType<typeof createModelAccounts>

/**
 * The model accounts of each company and of its people (decision 0049). It reaches identity only
 * through its ports (code C4); `main.ts` hands them over with the installation's seal keys.
 */
export function createModelAccounts(deps: {
  database: Database
  identity: IdentityPorts
  sealKeys: SealKeys
  flows: SignInFlows
}) {
  const store = createModelAccountStore(deps)
  return Object.freeze({
    routes: (app: FastifyInstance) => registerModelAccountRoutes(app, { ...deps, store }),
  })
}

/** The `reseal` command's work: every account on the key that seals, and how many moved. */
export function resealModelAccounts(deps: { database: Database; sealKeys: SealKeys }) {
  return reseal(deps)
}

// Google's sign-in through CLIProxyAPI comes with its own unit (U7); until then it is down.
const GOOGLE_PENDING: SignInFlow = {
  provider: ProviderId.parse('google'),
  start: () => Promise.reject(new Failure('CLIPROXY_UNAVAILABLE')),
  complete: () => Promise.reject(new Failure('CLIPROXY_UNAVAILABLE')),
}

/** The installation's sign-in flows, one per kind the operators open (decision 0049). */
export function signInFlows(): SignInFlows {
  return { claude_subscription: claudeSignIn(), google_cliproxy: GOOGLE_PENDING }
}
