import {
  approveTreatmentVersion,
  getTreatmentModel,
  listTreatedTables,
  proposeTreatment,
  proposeTreatmentVersion,
  runTreatmentNow,
  stopTreatmentRun,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import type { ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { answer, answerAs, serve } from '../../platform/http.ts'
import { companyScope } from '../copies/public.ts'
import { treatedTablesOf, treatmentModelViewOf } from './models.ts'
import type { TreatmentRuns } from './treatment-run.ts'
import type { TreatmentStopDeps } from './treatment-stop.ts'
import { stopTreatment } from './treatment-stop.ts'
import type { Asked, VersionDeps } from './versions.ts'
import { addVersion, admit, approveVersion, createModel, scopeOf } from './versions.ts'

export type TreatmentRouteDeps = VersionDeps &
  Omit<TreatmentStopDeps, 'runs'> &
  Readonly<{ runs: Pick<TreatmentRuns, 'now' | 'close'> }>

function readAs<T>(deps: TreatmentRouteDeps, at: Asked, work: (tx: ReadTx) => Promise<T>) {
  return deps.database.read(scopeOf(at), async (tx) => {
    await admit(deps, tx, at, 'readTreatment')
    return work(tx)
  })
}

async function runNow(deps: TreatmentRouteDeps, at: Asked) {
  await deps.database.command(scopeOf(at), (tx) => admit(deps, tx, at, 'approveTreatment'))
  const opened = await deps.runs.now(companyScope(at.companyId))
  switch (opened.kind) {
    case 'OPENED':
      return { run: opened.run }
    case 'ALREADY_RUNNING':
    case 'COALESCED':
      throw new Failure('ALREADY_RUNNING')
    case 'LAKE_OUTDATED':
      throw new Failure('LAKE_NOT_READY')
    case 'WAITING_COPY':
      throw new Failure('TREATMENT_WAITING_COPY')
    case 'NOTHING_TO_TREAT':
      throw new Failure('NOTHING_TO_TREAT')
    default: {
      const exhaustive: never = opened
      return exhaustive
    }
  }
}

async function stopNow(deps: TreatmentRouteDeps, at: Asked) {
  await deps.database.command(scopeOf(at), (tx) => admit(deps, tx, at, 'approveTreatment'))
  return stopTreatment(deps, companyScope(at.companyId), at.person)
}

export function registerTreatmentRoutes(app: FastifyInstance, deps: TreatmentRouteDeps): void {
  serve(app, listTreatedTables, async ({ person, params }) => {
    const at = { person: person.id, companyId: params.companyId }
    return answer(await readAs(deps, at, (tx) => treatedTablesOf(deps, tx, at.companyId)))
  })
  serve(app, getTreatmentModel, async ({ person, params }) => {
    const at = { person: person.id, companyId: params.companyId }
    const { modelId } = params
    return answer(
      await readAs(deps, at, (tx) => treatmentModelViewOf(deps, tx, at.companyId, modelId)),
    )
  })
  serve(app, proposeTreatment, async ({ person, params, body, log }) => {
    const proposed = await createModel(deps, { person: person.id, ...params }, body)
    const fields = { by: person.id, ...params, modelId: proposed.id, number: 1 }
    log.info(fields, 'TREATMENT_PROPOSED')
    return answer(proposed)
  })
  serve(app, proposeTreatmentVersion, async ({ person, params, body, log }) => {
    const version = await addVersion(deps, { person: person.id, ...params }, body)
    log.info({ by: person.id, ...params, number: version.number }, 'TREATMENT_PROPOSED')
    return answer(version)
  })
  serve(app, approveTreatmentVersion, async ({ person, params, body, log }) => {
    const { number, ...of } = params
    const version = await approveVersion(deps, { person: person.id, ...of }, number, body.hash)
    log.info({ by: person.id, ...params }, 'TREATMENT_APPROVED')
    return answer(version)
  })
  serve(app, runTreatmentNow, async ({ person, params, log }) => {
    const opened = await runNow(deps, { person: person.id, ...params })
    log.info({ by: person.id, ...params, runId: opened.run }, 'TREATMENT_RUN_ASKED')
    return answer(opened)
  })
  serve(app, stopTreatmentRun, async ({ person, params }) => {
    const asked = await stopNow(deps, { person: person.id, ...params })
    return asked.stopping ? answer(asked) : answerAs(stopTreatmentRun, 200, asked)
  })
}
