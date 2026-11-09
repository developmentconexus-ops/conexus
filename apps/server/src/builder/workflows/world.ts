import type {
  AgentId,
  ConnectionId,
  ConnectorId,
  OperationId,
  PersonId,
  ProjectId,
  WorkflowId,
  WorkflowPlace,
} from '@conexus/hub-api'
import type { DynamicWorkflowGraph } from '@mastra/core/workflows'
import type { z } from 'zod'
import type { WriteTarget } from '../../hub/connectors/public.ts'
import type { Speaker } from '../../hub/identity/public.ts'
import type { FrozenWorkflow } from './frozen.ts'
import type { RegistryIndex } from './index.ts'

/** One operation the kit gives a connection: whether it returns a list, and the shape of what it takes. */
export type KitOperation = Readonly<{
  id: OperationId
  many: boolean
  input: z.ZodObject | null
}>

/** A connection released to the workflow's place, with the reads and the writes its connector has. */
export type OfferedKit = Readonly<{
  connectionId: ConnectionId
  connectorId: ConnectorId
  reads: readonly KitOperation[]
  writes: readonly KitOperation[]
}>

/** An agent of the company, with the Projeto it lives in and the version it is published at. */
export type CompanyAgent = Readonly<{
  agentId: AgentId
  projectId: ProjectId
  activeVersion: number | null
}>

/** A workflow of the company: where it lives, and the version it is published at with what that version froze. */
export type CompanyWorkflow = Readonly<{
  workflowId: WorkflowId
  place: WorkflowPlace
  activeVersion: number | null
  frozen: FrozenWorkflow | null
}>

export type PersonSpeaker = Extract<Speaker, { kind: 'PERSON' }>

/**
 * What the problems of a draft read outside it: the port, and its adapter reads the Hub's
 * transaction. `problems.ts` opens none.
 */
export type World = Readonly<{
  /** Where the workflow lives. */
  place: WorkflowPlace
  /** The connections released to that place. */
  offered(): Promise<readonly OfferedKit[]>
  /** Every agent of the company. */
  agents(): Promise<readonly CompanyAgent[]>
  /** Every workflow of the company. */
  workflows(): Promise<readonly CompanyWorkflow[]>
  /** The people in the company now. */
  people(): Promise<ReadonlySet<PersonId>>
  /** The person as the role they hold now; none once they left. */
  speakerOf(personId: PersonId): Promise<PersonSpeaker | undefined>
  /** Whether the person's role holds the operation. */
  mayUse(speaker: PersonSpeaker, target: WriteTarget): Promise<boolean>
  /** Whether the person's role lets a write run without asking (step 24.5.1, D1-a). */
  mayLeaveAlone(personId: PersonId, write: WriteTarget & { slug: string }): Promise<boolean>
  /** What the validation of a version's definitions resolves references against. */
  registryOf(bundle: readonly DynamicWorkflowGraph[]): RegistryIndex
}>
