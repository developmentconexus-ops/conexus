import { z } from 'zod'
import { CompanyId } from './companies.ts'
import { ConnectionId } from './connectors.ts'
import { LakeTableName } from './lake-copies.ts'
import { defineOperation } from './operation.ts'

export const TreatmentModelId = z.uuid().brand('TreatmentModelId')
export type TreatmentModelId = z.infer<typeof TreatmentModelId>
export const TreatmentRunId = z.uuid().brand('TreatmentRunId')
export type TreatmentRunId = z.infer<typeof TreatmentRunId>

/** Why a treatment run failed, and the only text a failed run carries. */
export const TREATMENT_RUN_FAILURES = [
  'TREAT_START_FAILED',
  'TREAT_TASK_STOPPED',
  'TREAT_SPEC_INVALID',
  'TREAT_ENGINE_FAILED',
] as const
export const TreatmentRunFailure = z.enum(TREATMENT_RUN_FAILURES)
export type TreatmentRunFailure = z.infer<typeof TreatmentRunFailure>

export const TableRef = z.object({
  layer: z.enum(['current', 'tratado', 'negocio']),
  table: LakeTableName,
})
export type TableRef = z.infer<typeof TableRef>

export const TREATMENT_DESCRIPTION_MAX = 500
export const TREATMENT_SQL_MAX = 20_000
const Description = z.string().max(TREATMENT_DESCRIPTION_MAX)
const Sql = z.string().min(1).max(TREATMENT_SQL_MAX)
const VersionHash = z.string().regex(/^[0-9a-f]{64}$/)
const At = z.iso.datetime()

export const VersionView = z.object({
  number: z.int().min(1),
  sql: z.string(),
  inputs: z.array(TableRef),
  hash: VersionHash,
  /** The person's name. */
  proposedBy: z.string(),
  proposedAt: At,
  /** The person's name; null, with `approvedAt`, while no one approved the version. */
  approvedBy: z.string().nullable(),
  approvedAt: At.nullable(),
})
export type VersionView = z.infer<typeof VersionView>

export const ModelRunView = z.discriminatedUnion('status', [
  z.object({ status: z.literal('BUILT'), rows: z.int().min(0), at: At }),
  z.object({
    status: z.literal('FAILED'),
    failure: z.string(),
    line: z.int().min(1).nullable(),
    at: At,
  }),
  z.object({ status: z.literal('SKIPPED'), at: At }),
])
export type ModelRunView = z.infer<typeof ModelRunView>

export const RunView = z.discriminatedUnion('state', [
  z.object({ state: z.enum(['STARTING', 'RUNNING']), since: At, stopping: z.boolean() }),
  z.object({ state: z.literal('DONE'), at: At }),
  z.object({ state: z.literal('FAILED'), failure: TreatmentRunFailure, at: At }),
  z.object({
    state: z.literal('STOPPED'),
    stoppedBy: z.object({ name: z.string() }).nullable(),
    at: At,
  }),
])
export type RunView = z.infer<typeof RunView>

export const TreatedTable = z.discriminatedUnion('layer', [
  z.object({
    layer: z.literal('tratado'),
    name: LakeTableName,
    /** The kit's label of the copied table this one belongs to. */
    label: z.string(),
    connectionId: ConnectionId,
    description: z.string(),
    columns: z.array(
      z.object({
        name: z.string(),
        /** The column's type in the treated table; null while a kept column's copied type is not known. */
        type: z.string().nullable(),
        description: z.string().nullable(),
      }),
    ),
    readBy: z.array(TableRef),
    lastRun: ModelRunView.nullable(),
  }),
  z.object({
    layer: z.literal('negocio'),
    id: TreatmentModelId,
    name: LakeTableName,
    description: z.string(),
    /** The version the runs build: the highest approved. */
    active: VersionView.nullable(),
    /** The newest version, while no one approved it. */
    proposal: VersionView.nullable(),
    readBy: z.array(TableRef),
    lastRun: ModelRunView.nullable(),
  }),
])
export type TreatedTable = z.infer<typeof TreatedTable>

export const TreatedTables = z.object({
  /** `OUTDATED`: the lake's recipe differs from the Hub's. `NONE`: no lake, or one not ready. */
  lake: z.enum(['CURRENT', 'OUTDATED', 'NONE']),
  lastRun: RunView.nullable(),
  tables: z.array(TreatedTable),
})
export type TreatedTables = z.infer<typeof TreatedTables>

export const TreatmentModel = z.object({
  id: TreatmentModelId,
  name: LakeTableName,
  description: z.string(),
  /** Newest first. */
  versions: z.array(VersionView),
  /** The version the runs build: the highest approved. */
  active: VersionView.nullable(),
  /** The newest version, while no one approved it. */
  proposal: VersionView.nullable(),
  /** The model's runs in the company's current lake, newest first, at most one page. */
  runs: z.array(ModelRunView),
})
export type TreatmentModel = z.infer<typeof TreatmentModel>

export const ProposeTreatment = z.object({
  name: LakeTableName,
  description: Description,
  sql: Sql,
})
export type ProposeTreatment = z.infer<typeof ProposeTreatment>

export const ProposedTreatment = z.object({
  id: TreatmentModelId,
  name: LakeTableName,
  description: z.string(),
  version: VersionView,
})
export type ProposedTreatment = z.infer<typeof ProposedTreatment>

export const ProposeTreatmentVersion = z.object({ sql: Sql, description: Description })
export type ProposeTreatmentVersion = z.infer<typeof ProposeTreatmentVersion>

const InCompany = z.object({ companyId: CompanyId })
const OfModel = InCompany.extend({ modelId: TreatmentModelId })

const JSON_BYTES_PER_CHARACTER = 6
// The SQL at its longest, and room for the other fields.
const PROPOSAL_BODY = (TREATMENT_SQL_MAX + 1_000) * JSON_BYTES_PER_CHARACTER

const READ = ['NOT_FOUND', 'SESSION_REQUIRED', 'DATABASE_UNAVAILABLE'] as const
const PROPOSE = [
  ...READ,
  'LAKE_NOT_READY',
  'TREATMENT_SQL_INVALID',
  'TREATMENT_SQL_NOT_A_QUERY',
  'TREATMENT_SQL_TEMPLATE',
  'TREATMENT_INPUT_UNQUALIFIED',
  'TREATMENT_INPUT_UNKNOWN',
  'TREATMENT_INPUT_CYCLE',
] as const

export const listTreatedTables = defineOperation({
  id: 'listTreatedTables',
  summary:
    "Lists the company's treated and business tables, with the lake's recipe and the last treatment run.",
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/data/treated',
  bodyLimit: 1024,
  input: { params: InCompany },
  success: { status: 200, body: TreatedTables },
  failures: READ,
})

export const getTreatmentModel = defineOperation({
  id: 'getTreatmentModel',
  summary: "Reads one treatment of the company's own, with its versions and its newest runs.",
  access: 'session',
  method: 'GET',
  path: '/api/companies/{companyId}/data/treated/models/{modelId}',
  bodyLimit: 1024,
  input: { params: OfModel },
  success: { status: 200, body: TreatmentModel },
  failures: READ,
})

export const proposeTreatment = defineOperation({
  id: 'proposeTreatment',
  summary: 'Creates a treatment with its first version as a proposal; nothing runs.',
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/data/treated/models',
  bodyLimit: PROPOSAL_BODY,
  input: { params: InCompany, body: ProposeTreatment },
  success: { status: 201, body: ProposedTreatment },
  failures: [...PROPOSE, 'TREATMENT_NAME_TAKEN'],
})

export const proposeTreatmentVersion = defineOperation({
  id: 'proposeTreatmentVersion',
  summary:
    "Adds a version to a treatment as a proposal and sets the treatment's description; the active version stays.",
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/data/treated/models/{modelId}/versions',
  bodyLimit: PROPOSAL_BODY,
  input: { params: OfModel, body: ProposeTreatmentVersion },
  success: { status: 201, body: VersionView },
  failures: [...PROPOSE, 'TREATMENT_VERSION_CHANGED'],
})

export const approveTreatmentVersion = defineOperation({
  id: 'approveTreatmentVersion',
  summary:
    "Makes the newest proposal the treatment's active version, if its hash is the one the person read.",
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/data/treated/models/{modelId}/versions/{number}/approve',
  bodyLimit: 1024,
  input: {
    params: OfModel.extend({ number: z.coerce.number().int().min(1) }),
    body: z.object({ hash: VersionHash }),
  },
  success: { status: 200, body: VersionView },
  failures: [...READ, 'TREATMENT_VERSION_CHANGED'],
})

export const runTreatmentNow = defineOperation({
  id: 'runTreatmentNow',
  summary:
    'Opens a treatment run of every treatment of the company and answers before it ends; with a run open it refuses.',
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/data/treated/run',
  bodyLimit: 1024,
  input: { params: InCompany },
  success: { status: 202, body: z.object({ run: TreatmentRunId }) },
  failures: [
    ...READ,
    'ALREADY_RUNNING',
    'LAKE_NOT_READY',
    'NOTHING_TO_TREAT',
    'TREATMENT_WAITING_COPY',
  ],
})

export const StopTreatmentRunAnswer = z.object({ stopping: z.boolean() })
export type StopTreatmentRunAnswer = z.infer<typeof StopTreatmentRunAnswer>

export const stopTreatmentRun = defineOperation({
  id: 'stopTreatmentRun',
  summary:
    "Asks the company's open treatment run to stop and answers before it ends; with no run open it writes nothing.",
  access: 'session',
  method: 'POST',
  path: '/api/companies/{companyId}/data/treated/run/stop',
  bodyLimit: 1024,
  input: { params: InCompany },
  success: { status: 202, body: StopTreatmentRunAnswer },
  alsoAnswers: [{ status: 200, body: StopTreatmentRunAnswer }],
  failures: [...READ, 'COPY_AWS_UNAVAILABLE'],
})
