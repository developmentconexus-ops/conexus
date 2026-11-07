import type { AgentController } from '@mastra/core/agent-controller'
import { createTool } from '@mastra/core/tools'
import { PostgresStore } from '@mastra/pg'
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

/**
 * The store the agents' controller keeps its threads in: the `approval` scenarios run on Postgres, as
 * the Hub does, since a call that waits on the person is read from what the store holds. The database is
 * a disposable one, named by `RECORD_DATABASE_URL`, empty at each run: the thread a scenario leaves stays in its schema.
 */
export function approvalStore(scenario: string): PostgresStore {
  const connectionString = process.env.RECORD_DATABASE_URL
  if (connectionString === undefined)
    throw new Error('The approval scenarios record on Postgres: set RECORD_DATABASE_URL.')
  return new PostgresStore({
    id: 'record',
    connectionString,
    schemaName: `record_${scenario.replaceAll('-', '_')}`,
  })
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
async function answerApproval(
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

/** What the recorder does on an event of an `approval` scenario: the person's answer when the call asks, the end when the run ends. */
export function approvalReaction(
  session: Session,
  scenario: string,
  event: Event,
  ended: { resolve: () => void },
): void {
  if (event.type === 'tool_approval_required')
    void answerApproval(session, scenario, event.toolCallId)
  if (isApproval(scenario) && event.type === 'agent_end') ended.resolve()
}
