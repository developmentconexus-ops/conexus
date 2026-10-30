import {
  callAppConnector,
  completeConnectionSignIn,
  deleteConnectionNote,
  getConnection,
  grantProjectConnection,
  linkConnection,
  listAppConnections,
  listConnections,
  listProjectConnections,
  reconnectConnection,
  revokeProjectConnection,
  startConnectionSignIn,
  testConnection,
  unlinkConnection,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { answer, serve } from '../../platform/http.ts'
import type { AppCalls } from './app-calls.ts'
import { detail, link, list, reconnect, unlink } from './connections.ts'
import { grant, list as listGrants, revoke } from './grants.ts'
import { erase } from './notes.ts'
import type { Deps } from './rows.ts'
import { completeSignIn, startSignIn } from './sign-ins.ts'
import { test } from './testing.ts'

/** The status and code an ended test came with, when it came with any. */
function ended(
  native: { status: number; code: string | null } | null,
): Record<string, string | number> {
  return native === null ? {} : { status: native.status, code: native.code ?? '-' }
}

export function registerConnectionRoutes(app: FastifyInstance, deps: Deps): void {
  serve(app, listConnections, async ({ person, params }) =>
    answer(await list(deps, { person, ...params })),
  )

  serve(app, getConnection, async ({ person, params }) =>
    answer(await detail(deps, { person, ...params })),
  )

  serve(app, linkConnection, async ({ person, params, body, attemptKey, log }) => {
    const made = await link(deps, { person, ...params, ...body, attemptKey })
    if (made.created) {
      const fields = {
        by: person.id,
        companyId: params.companyId,
        connectionId: made.connection.id,
        connector: made.connection.connector,
      }
      log.info(fields, 'CONNECTION_LINKED')
    }
    return answer({ connection: made.connection })
  })

  serve(app, testConnection, async ({ person, params, log }) => {
    const tested = await test(deps, { person, ...params })
    // Scalars only (S41): for what the provider refused, its status and code, never its body.
    const fields = tested.result === 'WORKING' ? {} : ended(tested.native)
    log.info(
      { by: person.id, connectionId: params.connectionId, result: tested.result, ...fields },
      'CONNECTION_TESTED',
    )
    return answer(tested)
  })

  serve(app, reconnectConnection, async ({ person, params, body, log }) => {
    const connection = await reconnect(deps, { person, ...params, ...body })
    const fields = {
      by: person.id,
      companyId: params.companyId,
      connectionId: connection.id,
      connector: connection.connector,
    }
    log.info(fields, 'CONNECTION_RECONNECTED')
    return answer({ connection })
  })

  serve(app, startConnectionSignIn, async ({ person, params, body, log }) => {
    const started = await startSignIn(deps, { person, ...params, ...body })
    const fields = { by: person.id, companyId: params.companyId, connector: started.connector }
    log.info(fields, 'CONNECTION_SIGN_IN_STARTED')
    return answer({ url: started.url })
  })

  serve(app, completeConnectionSignIn, async ({ person, params, body, log }) =>
    answer(await completeSignIn(deps, { person, ...params, answer: body, log })),
  )

  registerGrantRoutes(app, deps)

  serve(app, unlinkConnection, async ({ person, params, log }) => {
    const { removed, revocation } = await unlink(deps, { person, ...params })
    if (removed)
      log.info({ by: person.id, connectionId: params.connectionId }, 'CONNECTION_REMOVED')
    return answer({ revocation })
  })
}

/** The grant of a connection to a Projeto, and the connection's notebook (step 20). */
function registerGrantRoutes(app: FastifyInstance, deps: Deps): void {
  serve(app, listProjectConnections, async ({ person, params }) =>
    answer(await listGrants(deps, { person, ...params })),
  )

  serve(app, grantProjectConnection, async ({ person, params, log }) => {
    const made = await grant(deps, { person, ...params })
    log.info({ by: person.id, ...params }, 'PROJECT_CONNECTION_GRANTED')
    return answer({ grant: made })
  })

  serve(app, revokeProjectConnection, async ({ person, params, log }) => {
    if (await revoke(deps, { person, ...params }))
      log.info({ by: person.id, ...params }, 'PROJECT_CONNECTION_REVOKED')
    return answer(undefined)
  })

  serve(app, deleteConnectionNote, async ({ person, params, log }) => {
    await erase(deps, { person, ...params })
    log.info({ by: person.id, connectionId: params.connectionId }, 'CONNECTION_NOTE_DELETED')
    return answer(undefined)
  })
}

/** The dispatcher's two connector calls, on the edge listener alone (security S48). */
export function registerAppCallRoutes(edge: FastifyInstance, calls: AppCalls): void {
  serve(edge, callAppConnector, async ({ body, headers }) =>
    answer(await calls.call({ host: body.host, headers, body })),
  )
  serve(edge, listAppConnections, async ({ query, headers }) =>
    answer({ names: await calls.names({ host: query.host, headers, connector: query.connector }) }),
  )
}
