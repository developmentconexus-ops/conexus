import { randomUUID } from 'node:crypto'
import { connectorOf } from '@conexus/connectors'
import { ConnectionId } from '@conexus/hub-api'
import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import { Credential } from '../../platform/seal.ts'
import type { Executor, OpenedConnection } from './executor.ts'
import { createLimits as createLimitsWith } from './limits.ts'

const SILENT: FailureLog = { info: () => undefined, error: () => undefined }

export function createLimits(deps: { executor: Executor; log?: FailureLog }) {
  return createLimitsWith({ executor: deps.executor, log: deps.log ?? SILENT })
}

export const A = ConnectionId.parse(randomUUID())
export const B = ConnectionId.parse(randomUUID())

async function unused(): Promise<never> {
  throw new Error('the executor is not used by this test')
}
export const NO_EXECUTOR: Executor = {
  pasted: () => {
    throw new Error('the executor is not used by this test')
  },
  call: unused,
  write: unused,
  grant: unused,
  revoke: unused,
  who: unused,
}

/** An executor that logs in and out in `events`, each token living `expiresInSeconds`. */
export function executorOf(events: string[], expiresInSeconds: number): Executor {
  let logins = 0
  return {
    ...NO_EXECUTOR,
    pasted: () => ({
      held: null,
      async open() {
        logins += 1
        events.push(`login${logins}`)
        return {
          kind: 'TOKEN',
          token: `t${logins}`,
          expiresAt: Date.now() + expiresInSeconds * 1000,
        }
      },
      async end(grant) {
        events.push(`logout ${grant.token}`)
        return { kind: 'LOGGED_OUT' }
      },
    }),
  }
}

/** An executor whose logout has a defect of its own, which its promise never to throw does not cover. */
export function executorWithBrokenLogout(): Executor {
  const working = executorOf([], 61)
  return {
    ...working,
    pasted: (opened) => ({
      ...working.pasted(opened),
      async end() {
        throw new TypeError('a defect in the logout')
      },
    }),
  }
}

export function tokenOf(
  limits: ReturnType<typeof createLimits>,
  opened: OpenedConnection,
  deadlineMs: number,
) {
  return limits.session(opened).token(AbortSignal.timeout(deadlineMs))
}

const connector = z
  .custom<NonNullable<ReturnType<typeof connectorOf>>>()
  .parse(connectorOf('sankhya'))

export const OPENED: OpenedConnection = {
  id: A,
  linkedAt: '',
  connector,
  credential: Credential.parse('{}'),
  revision: 0,
  accountRef: null,
}
