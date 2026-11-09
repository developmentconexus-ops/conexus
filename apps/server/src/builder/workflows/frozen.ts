import {
  AgentId,
  BalloonId,
  ConnectionId,
  OperationId,
  WorkflowDraft,
  WorkflowId,
} from '@conexus/hub-api'
import { z } from 'zod'

/** The draft with no `ERROR` problem and every field filled: the only one that compiles. */
const Ready = WorkflowDraft.brand<'ReadyDraft'>()
export type ReadyDraft = z.infer<typeof Ready>

/** Brands a draft the readiness check passed; only `problemsOf` calls it. */
export function readyDraftOf(draft: WorkflowDraft): ReadyDraft {
  return Ready.parse(draft)
}

/** What a published version holds, read back by `FrozenWorkflowSchema` (code C27). */
export type FrozenWorkflow = Readonly<{
  draft: ReadyDraft
  agents: ReadonlyArray<{ balloonId: BalloonId; agentId: AgentId; versionNumber: number }>
  /** The other workflow of each USE, copied from the version fixed (its document, its agents and its uses). */
  uses: ReadonlyArray<{
    balloonId: BalloonId
    workflowId: WorkflowId
    versionNumber: number
    frozen: FrozenWorkflow
  }>
  /** Each READ with the `many` mark of the kit written at publish: the compilation picks `conexus-ler-lista` without reading the kit. */
  reads: ReadonlyArray<{ balloonId: BalloonId; many: boolean }>
  /** The reads and the writes the version declares, also the ones of the workflows it uses. */
  declared: ReadonlyArray<{ connectionId: ConnectionId; operation: OperationId }>
}>

export const FrozenWorkflowSchema: z.ZodType<FrozenWorkflow> = z.lazy(() =>
  z.object({
    draft: Ready,
    agents: z.array(
      z.object({ balloonId: BalloonId, agentId: AgentId, versionNumber: z.int().positive() }),
    ),
    uses: z.array(
      z.object({
        balloonId: BalloonId,
        workflowId: WorkflowId,
        versionNumber: z.int().positive(),
        frozen: FrozenWorkflowSchema,
      }),
    ),
    reads: z.array(z.object({ balloonId: BalloonId, many: z.boolean() })),
    declared: z.array(z.object({ connectionId: ConnectionId, operation: OperationId })),
  }),
)
