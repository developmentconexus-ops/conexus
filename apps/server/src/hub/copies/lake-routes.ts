import type { CompanyId, ConnectionId, PersonId } from '@conexus/hub-api'
import {
  getLakeTablesOfConnection,
  runLakeCopy,
  setLakeCopy,
  stopLakeCopyRun,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { Failure } from '../../platform/failure.ts'
import { answer, answerAs, serve } from '../../platform/http.ts'
import { companyScope } from './lake-close.ts'
import type { LakeCopyDeps } from './lake-copy.ts'
import { createLakeCopy } from './lake-copy.ts'
import { createLakeLeave } from './lake-leave.ts'
import { createLakeList } from './lake-list.ts'
import { createLakeStop } from './lake-stop.ts'
import { lakeTablesOf } from './lake-view.ts'

type Asked = Readonly<{ person: PersonId; companyId: CompanyId; connectionId: ConnectionId }>

/**
 * The routes of a connection's lake copy: the list, the writing of the copy, the run now and its
 * stop. Each admits the person first (the list: who reads the connections; the others: who manages
 * copies), and a connection that is not the company's, or of a connector the kit lacks, is
 * the same not-found as a refusal (S10).
 */
export function createLakeCopies(deps: LakeCopyDeps) {
  const copy = createLakeCopy(deps)
  const away = createLakeLeave(deps)
  const dados = createLakeList(deps)
  const stopRound = createLakeStop(deps)

  async function admit(at: Asked, action: 'readConnections' | 'manageCopies') {
    const scope = { kind: 'COMPANY', companyId: at.companyId, personId: at.person } as const
    await deps.database.command(scope, async (tx) => {
      await deps.identity.admitMember({
        tx,
        personId: at.person,
        companyId: at.companyId,
        action,
      })
    })
    const found = await deps.source.connection(at)
    if (found.kind === 'GONE') throw new Failure('NOT_FOUND', { details: { reason: 'CONNECTION' } })
    const { connector, name, unavailable, tables } = found
    return { scope, connector, name, unavailable, tables }
  }

  async function list(at: Asked) {
    const { scope, ...found } = await admit(at, 'readConnections')
    return lakeTablesOf(deps, scope, at, found)
  }

  async function set(at: Asked, body: Parameters<typeof copy.set>[1]) {
    const { scope, ...found } = await admit(at, 'manageCopies')
    await copy.set(at, body, found)
    return lakeTablesOf(deps, scope, at, found)
  }

  async function run(at: Asked, whole: boolean) {
    await admit(at, 'manageCopies')
    const scope = companyScope(at.companyId)
    const started = await deps.runs.iniciarRodada(scope, at.connectionId, 'NOW', whole)
    if (started.kind === 'NO_COPY')
      throw new Failure('NOT_FOUND', { details: { reason: 'NO_COPY' } })
    return { already: started.kind === 'ALREADY_RUNNING' }
  }

  async function stop(at: Asked) {
    await admit(at, 'manageCopies')
    const { person, ...of } = at
    return stopRound(of, person)
  }

  function routes(app: FastifyInstance) {
    dados.routes(app)
    serve(app, getLakeTablesOfConnection, async ({ person, params }) =>
      answer(await list({ person: person.id, ...params })),
    )
    serve(app, setLakeCopy, async ({ person, params, body, log }) => {
      const view = await set({ person: person.id, ...params }, body)
      const marks = { tables: body.tables.length, fullPass: body.fullPass }
      log.info({ by: person.id, ...params, ...marks }, 'LAKE_COPY_SET')
      return answer(view)
    })
    serve(app, runLakeCopy, async ({ person, params, body, log }) => {
      const started = await run({ person: person.id, ...params }, body.whole)
      const fields = { by: person.id, ...params, whole: body.whole, already: started.already }
      log.info(fields, 'LAKE_COPY_RUN_ASKED')
      return started.already ? answerAs(runLakeCopy, 200, started) : answer(started)
    })
    serve(app, stopLakeCopyRun, async ({ person, params }) => {
      const asked = await stop({ person: person.id, ...params })
      return asked.stopping ? answer(asked) : answerAs(stopLakeCopyRun, 200, asked)
    })
  }

  return Object.freeze({
    list,
    set,
    run,
    tables: dados.tables,
    runsOf: dados.runsOf,
    routes,
    ...away,
  })
}
