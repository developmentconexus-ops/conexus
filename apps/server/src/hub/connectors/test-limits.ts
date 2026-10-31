import { randomUUID } from 'node:crypto'
import { connectorOf } from '@conexus/connectors'
import { ConnectionId } from '@conexus/hub-api'
import { z } from 'zod'
import { Credential } from '../../platform/seal.ts'
import { Secret } from '../../platform/secret.ts'
import type { FailureLog } from '../../platform/failure.ts'
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
  login: unused,
  call: unused,
  grant: unused,
  revoke: unused,
  who: unused,
  logout: unused,
}

/** An executor that logs in and out in `events`, each token living `expiresInSeconds`. */
export function executorOf(events: string[], expiresInSeconds: number): Executor {
  let logins = 0
  return {
    ...NO_EXECUTOR,
    async login() {
      logins += 1
      events.push(`login${logins}`)
      return {
        kind: 'TOKEN',
        token: new Secret('BearerToken', `t${logins}`),
        expiresInSeconds,
      }
    },
    async logout(_, live) {
      events.push(`logout ${live.reveal()}`)
      return 'LOGGED_OUT'
    },
  }
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
