import { createHash, randomUUID } from 'node:crypto'
import type {
  CompanyId,
  PersonId,
  ProposeTreatment,
  ProposeTreatmentVersion,
} from '@conexus/hub-api'
import { TreatmentModelId } from '@conexus/hub-api'
import { and, eq, isNull, max, sql } from 'drizzle-orm'
import type { CommandTx, Database, ReadTx } from '../../platform/database.ts'
import { transactionLock, violatedConstraint } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { IdentityPorts } from '../identity/public.ts'
import type { TreatmentReads } from './models.ts'
import { businessModelOf, checkInputs, treatmentLakeOf, versionOf } from './models.ts'
import { readModelSql } from './sql.ts'
import { treatmentModel, treatmentVersion } from './tables.ts'

export type VersionDeps = TreatmentReads & Readonly<{ database: Database; identity: IdentityPorts }>

export type Asked = Readonly<{ person: PersonId; companyId: CompanyId }>
export type OfModel = Asked & Readonly<{ modelId: TreatmentModelId }>
type Action = 'readTreatment' | 'proposeTreatment' | 'approveTreatment'

export function scopeOf(at: Asked) {
  return { kind: 'COMPANY', companyId: at.companyId, personId: at.person } as const
}

export function admit(deps: Pick<VersionDeps, 'identity'>, tx: ReadTx, at: Asked, action: Action) {
  return deps.identity.admitMember({ tx, personId: at.person, companyId: at.companyId, action })
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

async function checkedProposal(deps: VersionDeps, tx: ReadTx, at: Asked, text: string) {
  const lake = await treatmentLakeOf(deps, tx, at.companyId)
  if (lake.state !== 'CURRENT') throw new Failure('LAKE_NOT_READY')
  const read = readModelSql(text)
  if (read.kind === 'REFUSED') throw new Failure(read.code, { named: read.detail })
  const { sql, inputs } = read
  const hash = createHash('sha256').update(JSON.stringify({ sql, inputs })).digest('hex')
  return { sql, inputs, hash }
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

export function createModel(deps: VersionDeps, at: Asked, body: ProposeTreatment) {
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
      await checkInputs(deps, tx, at.companyId, { name, inputs: read.inputs })
      const version = await insertVersion(tx, { ...at, modelId: id }, 1, read)
      return { id, name, description, version }
    }),
  )
}

export function addVersion(deps: VersionDeps, at: OfModel, body: ProposeTreatmentVersion) {
  return refusedIfTaken(() =>
    deps.database.command(scopeOf(at), async (tx) => {
      await admit(deps, tx, at, 'proposeTreatment')
      await lockCompanyProposals(tx, at.companyId)
      const model = await businessModelOf(tx, at.modelId)
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

export function approveVersion(deps: VersionDeps, at: OfModel, number: number, hash: string) {
  return deps.database.command(scopeOf(at), async (tx) => {
    await admit(deps, tx, at, 'approveTreatment')
    await businessModelOf(tx, at.modelId)
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
