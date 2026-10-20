import type { FastifyInstance } from 'fastify'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { CliProxy } from '../../platform/config.ts'
import type { Database } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import type { SealKeys } from '../../platform/seal.ts'
import { claudeSignIn } from './claude/claude.ts'
import { googleCalls } from './google/calls.ts'
import { googleSignIn } from './google/google.ts'
import { reseal } from './reseal.ts'
import { registerModelAccountRoutes } from './routes.ts'
import type { SignInFlows } from './sign-ins.ts'
import { createModelAccountStore } from './store.ts'

export {
  accountErrorProcessors,
  accountModel,
  accountPick,
  MAX_PROCESSOR_RETRIES,
} from './processors.ts'
export type { QueueDeps } from './queue.ts'
export { conversationModel, providerOf } from './queue.ts'
export { effortsOf, providerOptionsOf } from './thinking.ts'
export { chosenModel, NOTICE_PART, Notice, Turn, turnContext } from './turn.ts'

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

/** The installation's sign-in flows, one per kind the operators open (decision 0049). */
export function signInFlows(deps: { cliProxy: CliProxy; log: FailureLog }): SignInFlows {
  return { claude_subscription: claudeSignIn(), google_cliproxy: googleSignIn(deps) }
}

/** Google's calls, one CLIProxyAPI per account; `stop()` ends them with the program (step 12 U10). */
export function openGoogleCalls(deps: {
  cliProxy: CliProxy
  log: FailureLog
  database: Database
  sealKeys: SealKeys
  /** Idle time before a process stops; ten minutes when absent. */
  idleMs?: number
}) {
  const calls = googleCalls(deps)
  return { googleCalls: calls.open, stop: calls.stop }
}
