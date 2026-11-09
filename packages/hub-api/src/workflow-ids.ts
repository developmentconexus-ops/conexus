import { z } from 'zod'
import type { ToolCallId } from './questions.ts'

export const WorkflowId = z.uuid().brand<'WorkflowId'>()
export type WorkflowId = z.infer<typeof WorkflowId>
/** Um balão do workflow, a id de entrada da compilação. */
export const BalloonId = z
  .string()
  .regex(/^b[0-9]{1,3}$/)
  .brand<'BalloonId'>()
export type BalloonId = z.infer<typeof BalloonId>
/** Onde o balão mora numa execução: os segmentos dos USE de fora até ele, e ele ('b3', 'b7_0.b3'). */
export const BalloonAddress = z
  .string()
  .regex(/^(b[0-9]{1,3}_0\.)*b[0-9]{1,3}$/)
  .brand<'BalloonAddress'>()
export type BalloonAddress = z.infer<typeof BalloonAddress>
/** Uma execução do Mastra: uuid (manual, teste) ou sched_<agenda>_<ms> (horário); a 24.6.1 acrescenta trg_<gatilho>_<chave>. */
export const WorkflowRunId = z
  .string()
  .regex(/^([0-9a-f-]{36}|sched_[A-Za-z0-9_-]+_[0-9]+)$/)
  .brand<'WorkflowRunId'>()
export type WorkflowRunId = z.infer<typeof WorkflowRunId>
/** A escrita de um balão numa tentativa: '<endereço>#<tentativa>', e '#<toolCallId>' no fim quando é a escrita de um agente. */
export const BalloonCallKey = z
  .string()
  .regex(/^(b[0-9]{1,3}_0\.)*b[0-9]{1,3}#[0-9]{1,4}(#.{1,200})?$/)
  .brand<'BalloonCallKey'>()
export type BalloonCallKey = z.infer<typeof BalloonCallKey>
export function balloonCallKeyOf(
  balloon: BalloonAddress,
  attempt: number,
  toolCallId?: ToolCallId,
): BalloonCallKey {
  return BalloonCallKey.parse(
    toolCallId === undefined ? `${balloon}#${attempt}` : `${balloon}#${attempt}#${toolCallId}`,
  )
}
