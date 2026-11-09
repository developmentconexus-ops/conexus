import { z } from 'zod'
import { AgentId } from './agent-ids.ts'
import { Cadence } from './automations.ts'
import { CONNECTIONS_MAX, ConnectionId } from './connectors.ts'
import type { FailureCode } from './failures.ts'
import { PersonId } from './identity.ts'
import { ProjectId } from './library-ids.ts'
import { OperationId } from './tools.ts'
import { BalloonId, WorkflowId } from './workflow-ids.ts'

/** The workflow's limit, with a source: Kiro refuses more than 50 steps. Passing it is a problem, not a refusal. It counts the balloons of every path. */
export const BALLOONS_MAX = 50
/** Schema ceilings, only against an absurd body (above them, `REQUEST_MALFORMED`); they are not product rules. */
export const BALLOONS_SCHEMA_MAX = 200
/** The paths of a Ao mesmo tempo. */
export const BRANCH_MAX = 10
export const PEOPLE_MAX = 10
/** A value of the trigger or of an earlier balloon: `{{gatilho.valor}}`, `{{b2.texto}}`. */
export const Template = z.string().max(2000)
export const Title = z.string().trim().min(1).max(80)
export const FieldName = z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/)

/** Where a workflow lives (decision H): the company, or one Projeto. */
export const WorkflowPlace = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('COMPANY') }),
  z.object({ kind: z.literal('PROJECT'), projectId: ProjectId }),
])
export type WorkflowPlace = z.infer<typeof WorkflowPlace>

/** In this step, by the clock or by hand; the CONNECTOR arm comes with step 24.6.1, which only adds. */
export const Trigger = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('SCHEDULE'), cadence: Cadence }),
  z.object({ kind: z.literal('MANUAL') }),
])
export type Trigger = z.infer<typeof Trigger>

/** Who answers a request (decision A): by default whoever activated the version the run runs (`RunIdentity.answeredBy`). */
export const Approver = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('ACTIVATED_BY') }),
  z.object({ kind: z.literal('PERSON'), personId: PersonId }),
])
export type Approver = z.infer<typeof Approver>

export const AgentTarget = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('PUBLISHED'), agentId: AgentId }),
  z.object({
    kind: z.literal('ASSISTANT'),
    connections: z.array(ConnectionId).max(CONNECTIONS_MAX),
  }),
])
export type AgentTarget = z.infer<typeof AgentTarget>

/** Mastra's predicate, only the shape Conexus uses: a number field of the trigger against a number. */
export const Condition = z.object({
  field: FieldName,
  op: z.enum(['gt', 'gte', 'lt', 'lte', 'eq', 'ne']),
  than: z.number().nullable(),
})
export type Condition = z.infer<typeof Condition>

/** Written by hand because the union is recursive and `z.infer` cannot deduce it (Zod 4 `z.lazy`). */
export type Balloon =
  | {
      kind: 'READ'
      id: BalloonId
      title: string
      connectionId: ConnectionId | null
      operation: OperationId | null
      input: Record<string, string>
    }
  | {
      kind: 'AGENT'
      id: BalloonId
      title: string
      agent: AgentTarget | null
      prompt: string
      approver: Approver
    }
  | { kind: 'APPROVAL'; id: BalloonId; title: string; approver: Approver; question: string }
  | {
      kind: 'WRITE'
      id: BalloonId
      title: string
      connectionId: ConnectionId | null
      operation: OperationId | null
      input: Record<string, string>
      approval: 'ASK' | 'AUTO'
      approver: Approver
    }
  | { kind: 'NOTIFY'; id: BalloonId; title: string; people: PersonId[]; message: string }
  | {
      kind: 'USE'
      id: BalloonId
      title: string
      workflowId: WorkflowId | null
      input: Record<string, string>
    }
  | { kind: 'IF'; id: BalloonId; title: string; when: Condition; then: Path; else: Path }
  | { kind: 'PARALLEL'; id: BalloonId; title: string; paths: Path[] }
  | { kind: 'FOREACH'; id: BalloonId; title: string; body: Path }
  | { kind: 'LOOP'; id: BalloonId; title: string; until: Condition; max: number; body: Path }
export type Path = Balloon[]

const PathSchema: z.ZodType<Path> = z.lazy(() => z.array(Balloon).max(BALLOONS_SCHEMA_MAX))

/** The balloons with no path inside, which need no laziness. */
const LEAF_BALLOONS = [
  z.object({
    kind: z.literal('READ'),
    id: BalloonId,
    title: Title,
    connectionId: ConnectionId.nullable(),
    operation: OperationId.nullable(),
    input: z.record(z.string(), Template),
  }),
  z.object({
    kind: z.literal('AGENT'),
    id: BalloonId,
    title: Title,
    agent: AgentTarget.nullable(),
    prompt: Template,
    approver: Approver,
  }),
  z.object({
    kind: z.literal('APPROVAL'),
    id: BalloonId,
    title: Title,
    approver: Approver,
    question: Template,
  }),
  z.object({
    kind: z.literal('WRITE'),
    id: BalloonId,
    title: Title,
    connectionId: ConnectionId.nullable(),
    operation: OperationId.nullable(),
    input: z.record(z.string(), Template),
    approval: z.enum(['ASK', 'AUTO']),
    approver: Approver,
  }),
  z.object({
    kind: z.literal('NOTIFY'),
    id: BalloonId,
    title: Title,
    people: z.array(PersonId).max(PEOPLE_MAX),
    message: Template,
  }),
  /** Usar outro workflow: what the other reads from its trigger, field by field. */
  z.object({
    kind: z.literal('USE'),
    id: BalloonId,
    title: Title,
    workflowId: WorkflowId.nullable(),
    input: z.record(FieldName, Template),
  }),
] as const

export const Balloon: z.ZodType<Balloon> = z.lazy(() =>
  z.discriminatedUnion('kind', [
    ...LEAF_BALLOONS,
    z.object({
      kind: z.literal('IF'),
      id: BalloonId,
      title: Title,
      when: Condition,
      // biome-ignore lint/suspicious/noThenProperty: `then` is the "se sim" path of the card's contract, and a field of the stored document
      then: PathSchema,
      else: PathSchema,
    }),
    z.object({
      kind: z.literal('PARALLEL'),
      id: BalloonId,
      title: Title,
      paths: z.array(PathSchema).min(2).max(BRANCH_MAX),
    }),
    /** Para cada: the list is the output of the balloon right before, which must return one. */
    z.object({ kind: z.literal('FOREACH'), id: BalloonId, title: Title, body: PathSchema }),
    z.object({
      kind: z.literal('LOOP'),
      id: BalloonId,
      title: Title,
      until: Condition,
      max: z.int().positive(),
      body: PathSchema,
    }),
  ]),
)

/** The draft as the person and the Construtor save it: it takes an incomplete balloon (the "+"). */
export const WorkflowDraft = z.object({ name: Title, trigger: Trigger, balloons: PathSchema })
export type WorkflowDraft = z.infer<typeof WorkflowDraft>

export const WorkflowProblemCode = z.enum([
  // Conexus's own rules
  'NO_BALLOONS',
  'WORKFLOW_TOO_MANY_BALLOONS',
  'DUPLICATE_ID',
  'BALLOON_INCOMPLETE',
  'BALLOON_KIND_LATER',
  'CONNECTION_NOT_OFFERED',
  'OPERATION_UNKNOWN',
  'OPERATION_WRONG_CLASS',
  'OPERATION_NOT_IN_ROLE',
  'INPUT_FIELD_UNKNOWN',
  'INPUT_FIELD_MISSING',
  'INPUT_FIELD_INVALID',
  'REF_BALLOON_UNKNOWN',
  'REF_NOT_BEFORE',
  'REF_INSIDE_BRANCH',
  'REF_FIELD_UNKNOWN',
  'AGENT_NOT_FOUND',
  'AGENT_NOT_PUBLISHED',
  'AGENT_OTHER_PROJECT',
  'AGENT_IN_COMPANY',
  'USE_NOT_PUBLISHED',
  'USE_ITSELF',
  'USE_OTHER_PLACE',
  'USE_INPUT_MISSING',
  'PERSON_NOT_FOUND',
  'PERSON_CANNOT_APPROVE',
  'IF_FIELD_NOT_NUMBER',
  'IF_EMPTY',
  'FOREACH_NOT_A_LIST',
  'REF_OUTSIDE_ITEM',
  'WRITE_AUTO_NOT_ALLOWED',
  // Mastra's validation: three of its 16 codes by name, every other in GRAPH_OTHER
  'GRAPH_MISSING_REFERENCE',
  'GRAPH_INCOMPATIBLE_SCHEMA',
  'GRAPH_INVALID_MAP',
  'GRAPH_OTHER',
])
export type WorkflowProblemCode = z.infer<typeof WorkflowProblemCode>

export const WorkflowProblem = z.object({
  code: WorkflowProblemCode,
  /** `ERROR` blocks testing and publishing. */
  severity: z.enum(['ERROR', 'WARNING']),
  /** Null: the trigger or the whole workflow. */
  balloonId: BalloonId.nullable(),
  /** `balloons.3.then.0.input.codigo`, or `graph:<Mastra's path>`. */
  path: z.string(),
  message: z.string(),
  /** Mastra's `WorkflowValidationIssue.repair`, only in a `GRAPH_*` problem. */
  repair: z.unknown().optional(),
})
export type WorkflowProblem = z.infer<typeof WorkflowProblem>

export const WorkflowState = z.enum(['ON', 'PAUSED', 'PAUSED_OWNER'])
export type WorkflowState = z.infer<typeof WorkflowState>

/** The agent a balloon froze, at the version it ran with. */
export const FrozenAgent = z.object({
  balloonId: BalloonId,
  agentId: AgentId,
  versionNumber: z.int().positive(),
})

/** The other workflow a USE froze, at the version it ran with. */
export const FrozenUse = z.object({
  balloonId: BalloonId,
  workflowId: WorkflowId,
  versionNumber: z.int().positive(),
})

export const WorkflowView = z.object({
  id: WorkflowId,
  place: WorkflowPlace,
  name: z.string(),
  revision: z.int().nonnegative(),
  draft: WorkflowDraft.nullable(),
  /** Recomputed at every read. */
  problems: z.array(WorkflowProblem),
  published: z
    .object({
      number: z.int().positive(),
      draft: WorkflowDraft,
      agents: z.array(FrozenAgent),
      uses: z.array(FrozenUse),
      publishedBy: PersonId.nullable(),
      publishedAt: z.iso.datetime(),
    })
    .nullable(),
  /** Who activated the active version (`workflow.active_by`). */
  activeBy: PersonId.nullable(),
  /** The draft differs from the published version. */
  changed: z.boolean(),
  state: WorkflowState,
})
export type WorkflowView = z.infer<typeof WorkflowView>

export const CreateWorkflowBody = z.object({ place: WorkflowPlace, draft: WorkflowDraft })
export const SaveDraftBody = z.object({ revision: z.int().nonnegative(), draft: WorkflowDraft })
export const PublishBody = z.object({ revision: z.int().nonnegative() })

/** How a balloon or `conferir` fails (code C21: a closed set); a code outside it becomes `INTERNAL_UNEXPECTED`. */
export const WorkflowFailureCode = z.enum([
  'WORKFLOW_NOT_FOUND',
  'WORKFLOW_OWNER_CANNOT_RUN',
  'WORKFLOW_LOOP_LIMIT',
  'WORKFLOW_TEST_STOPPED_AT_WRITE',
  'BALLOON_SYSTEM_REFUSED',
  'BALLOON_SYSTEM_UNREACHABLE',
  'NOT_IN_ROLE',
  'CONNECTOR_NOT_GRANTED',
  'CONNECTION_SIGN_IN_EXPIRED',
  'CONNECTION_CREDENTIAL_INVALID',
  'IDEMPOTENCY_CONFLICT',
  'REQUEST_MALFORMED',
  'AGENT_NOT_FOUND',
  'MODEL_NO_ACCOUNT',
  'MODEL_CALL_FAILED',
  'MODEL_REFUSED',
  'MODEL_ANSWER_CUT',
  'MACHINE_UNAVAILABLE',
  'MACHINE_LOST',
  'HUB_UPDATED',
  'INTERRUPTED',
  'DATABASE_UNAVAILABLE',
  'INTERNAL_UNEXPECTED',
] as const satisfies readonly FailureCode[])
export type WorkflowFailureCode = z.infer<typeof WorkflowFailureCode>
