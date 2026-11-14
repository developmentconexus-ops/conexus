import type { CompanyId, ConnectionId } from '@conexus/hub-api'
import {
  callAppConnector,
  callToolConnector,
  completeConnectionSignIn,
  getConnection,
  grantProjectConnection,
  linkConnection,
  listAppConnections,
  listConnectionCopies,
  listConnections,
  listProjectConnections,
  reconnectConnection,
  revokeProjectConnection,
  startConnectionSignIn,
  testConnection,
  unlinkConnection,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import type { AppCalls } from './app-calls.ts'
import { copiesOfConnection } from './connection-copies.ts'
import { detail, link, list, reconnect, unlink } from './connections.ts'
import { grant, list as listGrants, revoke } from './grants.ts'
import type { Deps } from './rows.ts'
import { completeSignIn, startSignIn } from './sign-ins.ts'
import { test } from './testing.ts'
import type { ToolDoor } from './tool-door.ts'

/** The status and code an ended test came with, when it came with any. */
function ended(
  native: { status: number; code: string | null } | null,
): Record<string, string | number> {
  return native === null ? {} : { status: native.status, code: native.code ?? '-' }
}

/** A connection just linked has its inventory read; a failure only reaches the log, and the link answers as before (U2). */
async function readInventory(
  deps: Deps,
  ids: { companyId: CompanyId; connectionId: ConnectionId },
  log: FailureLog,
): Promise<void> {
  try {
    await deps.inventory().launch(ids)
  } catch (error) {
    logFailure(
      log,
      new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'INVENTORY_OPEN' }, cause: error }),
      {
        connectionId: ids.connectionId,
      },
    )
  }
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
      await readInventory(
        deps,
        { companyId: params.companyId, connectionId: made.connection.id },
        log,
      )
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

  serve(app, listConnectionCopies, async ({ person, params }) =>
    answer({ copies: await copiesOfConnection(deps, { person, ...params }) }),
  )

  serve(app, unlinkConnection, async ({ person, params, log }) => {
    const { removed, revocation, copies, tablesLeft } = await unlink(deps, { person, ...params })
    const { connectionId } = params
    if (removed) log.info({ by: person.id, connectionId }, 'CONNECTION_REMOVED')
    for (const { copyId, ended } of copies) log.info({ connectionId, copyId, ended }, 'COPIES_LEFT')
    return answer({ revocation, tablesLeft })
  })
}

/** The grant of a connection to a Projeto (step 20). */
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

/** The saved tools' reads (step 24.4), on the edge listener alone (security S48). */
export function registerToolCallRoutes(edge: FastifyInstance, door: ToolDoor): void {
  serve(edge, callToolConnector, async ({ body }) => answer(await door.read(body)))
}
