import {
  getConnection,
  linkConnection,
  listConnections,
  testConnection,
  unlinkConnection,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { answer, serve } from '../../platform/http.ts'
import { detail, link, list, unlink } from './connections.ts'
import type { Deps } from './rows.ts'
import { test } from './testing.ts'

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
    const counts =
      tested.result === 'WORKING' ? Object.groupBy(tested.checks, (check) => check.outcome) : {}
    const outcomes = Object.fromEntries(
      Object.entries(counts).map(([outcome, checks]) => [outcome, checks?.length ?? 0]),
    )
    log.info(
      { by: person.id, connectionId: params.connectionId, result: tested.result, ...outcomes },
      'CONNECTION_TESTED',
    )
    return answer(tested)
  })

  serve(app, unlinkConnection, async ({ person, params, log }) => {
    const { removed } = await unlink(deps, { person, ...params })
    if (removed)
      log.info({ by: person.id, connectionId: params.connectionId }, 'CONNECTION_REMOVED')
    return answer(undefined)
  })
}
