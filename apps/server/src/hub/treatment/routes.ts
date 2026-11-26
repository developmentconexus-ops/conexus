import { createHash, randomUUID } from 'node:crypto'
import type {
  CompanyId,
  PersonId,
  ProposeTreatment,
  ProposeTreatmentVersion,
} from '@conexus/hub-api'
import {
  approveTreatmentVersion,
  getTreatmentModel,
  listTreatedTables,
  proposeTreatment,
  proposeTreatmentVersion,
  TreatmentModelId,
} from '@conexus/hub-api'
import { and, eq, isNull, max, sql } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import type { CommandTx, Database, ReadTx } from '../../platform/database.ts'
import { transactionLock, violatedConstraint } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { answer, serve } from '../../platform/http.ts'
import type { IdentityPorts } from '../identity/public.ts'
import type { TreatmentReads } from './models.ts'
import {
  businessModelsOf,
  checkInputs,
  treatedTablesOf,
  treatmentLakeOf,
  treatmentModelViewOf,
  versionOf,
} from './models.ts'
import { readModelSql } from './sql.ts'
import { treatmentModel, treatmentVersion } from './tables.ts'

export type TreatmentRouteDeps = TreatmentReads &
  Readonly<{ database: Database; identity: IdentityPorts }>

type Asked = Readonly<{ person: PersonId; companyId: CompanyId }>
type OfModel = Asked & Readonly<{ modelId: TreatmentModelId }>
type Action = 'readTreatment' | 'proposeTreatment' | 'approveTreatment'

function scopeOf(at: Asked) {
  return { kind: 'COMPANY', companyId: at.companyId, personId: at.person } as const
}

function admit(deps: TreatmentRouteDeps, tx: ReadTx, at: Asked, action: Action) {
  return deps.identity.admitMember({ tx, personId: at.person, companyId: at.companyId, action })
}

function readAs<T>(deps: TreatmentRouteDeps, at: Asked, work: (tx: ReadTx) => Promise<T>) {
  return deps.database.read(scopeOf(at), async (tx) => {
    await admit(deps, tx, at, 'readTreatment')
    return work(tx)
  })
}

function lockCompanyProposals(tx: CommandTx, companyId: CompanyId) {
  return transactionLock(tx, `conexus.treatment-proposal:${companyId}`)
}

async function refusedIfTaken<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work()
  } catch (error) {
    const taken = violatedConstraint(error)
    if (taken === 'treatment_model_name_key')
      throw new Failure('TREATMENT_NAME_TAKEN', { cause: error })
    if (taken === 'treatment_version_number_key')
      throw new Failure('TREATMENT_VERSION_CHANGED', { cause: error })
    throw error
  }
}

async function checkedProposal(deps: TreatmentRouteDeps, tx: ReadTx, at: Asked, text: string) {
  const lake = await treatmentLakeOf(deps, tx, at.companyId)
  if (lake.state !== 'CURRENT') throw new Failure('LAKE_NOT_READY')
  const read = readModelSql(text)
  if (read.kind === 'REFUSED') throw new Failure(read.code, { named: read.detail })
  const { inputs } = read
  const hash = createHash('sha256')
    .update(JSON.stringify({ sql: text, inputs }))
    .digest('hex')
  return { sql: text, inputs, hash }
}

async function modelOf(tx: ReadTx, modelId: TreatmentModelId) {
  const model = (await businessModelsOf(tx)).find((each) => each.id === modelId)
  if (model === undefined) throw new Failure('NOT_FOUND', { details: { reason: 'MODEL' } })
  return model
}

async function insertVersion(
  tx: CommandTx,
  at: OfModel,
  number: number,
  read: Awaited<ReturnType<typeof checkedProposal>>,
) {
  await tx.insert(treatmentVersion).values({
    ...{ id: randomUUID(), modelId: at.modelId, companyId: at.companyId, number, ...read },
    proposedBy: at.person,
    proposedAt: sql`now()`,
  })
  return versionOf(tx, at.modelId, number)
}

function create(deps: TreatmentRouteDeps, at: Asked, body: ProposeTreatment) {
  return refusedIfTaken(() =>
    deps.database.command(scopeOf(at), async (tx) => {
      await admit(deps, tx, at, 'proposeTreatment')
      await lockCompanyProposals(tx, at.companyId)
      const read = await checkedProposal(deps, tx, at, body.sql)
      const { name, description } = body
      const id = TreatmentModelId.parse(randomUUID())
      await tx.insert(treatmentModel).values({
        ...{ id, companyId: at.companyId, name, description },
        createdBy: at.person,
        createdAt: sql`now()`,
      })
      const model = await modelOf(tx, id)
      await checkInputs(deps, tx, at.companyId, { name: model.name, inputs: read.inputs })
      const version = await insertVersion(tx, { ...at, modelId: id }, 1, read)
      return { id, name, description, version }
    }),
  )
}

function addVersion(deps: TreatmentRouteDeps, at: OfModel, body: ProposeTreatmentVersion) {
  return refusedIfTaken(() =>
    deps.database.command(scopeOf(at), async (tx) => {
      await admit(deps, tx, at, 'proposeTreatment')
      await lockCompanyProposals(tx, at.companyId)
      const model = await modelOf(tx, at.modelId)
      const read = await checkedProposal(deps, tx, at, body.sql)
      await checkInputs(deps, tx, at.companyId, { name: model.name, inputs: read.inputs })
      const number = Math.max(0, ...model.versions.map((version) => version.number)) + 1
      await tx
        .update(treatmentModel)
        .set({ description: body.description })
        .where(eq(treatmentModel.id, model.id))
      return insertVersion(tx, at, number, read)
    }),
  )
}

function approve(deps: TreatmentRouteDeps, at: OfModel, number: number, hash: string) {
  return deps.database.command(scopeOf(at), async (tx) => {
    await admit(deps, tx, at, 'approveTreatment')
    await modelOf(tx, at.modelId)
    const newest = tx
      .select({ number: max(treatmentVersion.number) })
      .from(treatmentVersion)
      .where(eq(treatmentVersion.modelId, at.modelId))
    const approved = await tx
      .update(treatmentVersion)
      .set({ approvedBy: at.person, approvedAt: sql`now()` })
      .where(
        and(
          eq(treatmentVersion.modelId, at.modelId),
          eq(treatmentVersion.number, number),
          eq(treatmentVersion.hash, hash),
          isNull(treatmentVersion.approvedAt),
          eq(treatmentVersion.number, newest),
        ),
      )
      .returning({ id: treatmentVersion.id })
    if (approved.length === 0) throw new Failure('TREATMENT_VERSION_CHANGED')
    return versionOf(tx, at.modelId, number)
  })
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
    const proposed = await create(deps, { person: person.id, ...params }, body)
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
    const version = await approve(deps, { person: person.id, ...of }, number, body.hash)
    log.info({ by: person.id, ...params }, 'TREATMENT_APPROVED')
    return answer(version)
  })
}
