import type { TestCheck } from '@conexus/hub-api'
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

/** How many items ended each way. */
function countsOf(checks: readonly TestCheck[]) {
  return Object.fromEntries(
    Object.entries(Object.groupBy(checks, (check) => check.outcome)).map(([outcome, group]) => [
      outcome,
      group?.length ?? 0,
    ]),
  )
}

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
    // Scalars only (S41): the counts, and for what the provider refused its status and code, never its body.
    const fields =
      tested.result === 'WORKING'
        ? {
            ...countsOf(tested.checks),
            refusals: tested.checks
              .flatMap((check) =>
                'native' in check
                  ? [`${check.id} ${check.native.status} ${check.native.code ?? '-'}`]
                  : [],
              )
              .join(', '),
          }
        : ended(tested.native)
    log.info(
      { by: person.id, connectionId: params.connectionId, result: tested.result, ...fields },
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
