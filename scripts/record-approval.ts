import type { AgentController } from '@mastra/core/agent-controller'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import type { OrderBook } from '../packages/connectors/src/sankhya/fake-orders.ts'
import { APPROVAL_STEER, APPROVAL_TOOL } from './record-calls.ts'

// The `approval` scenarios of `scripts/record.ts` (step 24.5, T26): a write that asks the person
// first, on the Sankhya double's orders, answered the four ways a person can.

export const APPROVALS = [
  'approval',
  'approval-declined',
  'approval-interrupted',
  'approval-stopped',
] as const
export function isApproval(scenario: string): scenario is (typeof APPROVALS)[number] {
  return APPROVALS.some((each) => each === scenario)
}

type Session = Awaited<ReturnType<AgentController['createSession']>>
type Event = Parameters<Parameters<Session['subscribe']>[0]>[0]

/**
 * An event as `@mastra/server` puts it on the wire (`handlers/agent-controller.js` `toWireEvent`):
 * the display state is copied at that instant and its Maps become records; left as the controller
 * holds them, they serialize to `{}` and show the state the run ended in.
 */
export function wired(event: Event): unknown {
  if (event.type !== 'display_state_changed') return event
  const snapshot = structuredClone(event.displayState)
  return {
    ...event,
    displayState: {
      ...snapshot,
      pendingSuspensions: Object.fromEntries(snapshot.pendingSuspensions),
      pendingApprovals: Object.fromEntries(snapshot.pendingApprovals),
    },
  }
}

/** A person's pace: the card is read before it is answered, as in the card's failure table (Mastra #27831). */
const PERSON_PACE_MS = 1_500

/** What the person does with the card, after reading it: touch a button, write, or stop. */
export async function answerApproval(
  session: Session,
  scenario: string,
  toolCallId: string,
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, PERSON_PACE_MS))
  if (scenario === 'approval') session.respondToToolApproval({ decision: 'approve', toolCallId })
  else if (scenario === 'approval-declined')
    session.respondToToolApproval({ decision: 'decline', toolCallId })
  else if (scenario === 'approval-interrupted')
    await session.sendMessage({ content: APPROVAL_STEER })
  else if (scenario === 'approval-stopped') session.abort()
}

const Sent = z.object({ retorno: z.object({ codigoPedido: z.number() }) })

/** The write of the version, here always asking, whose order the double keeps. */
export function approvalTool(orders: OrderBook) {
  return createTool({
    id: APPROVAL_TOOL,
    description: 'Lança um pedido de venda no Sankhya.',
    inputSchema: z.object({
      codigoCliente: z.number(),
      itens: z.array(
        z.object({ codigoProduto: z.number(), quantidade: z.number(), valorUnitario: z.number() }),
      ),
    }),
    requireApproval: async () => true,
    execute: async (given) => {
      const { retorno } = Sent.parse(await orders.add(given).json())
      return { kind: 'OK', value: { codigoPedido: retorno.codigoPedido } }
    },
  })
}
