import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import type { StreamEvent } from '../../harness/routes/test-conversation.ts'
import { sessionUrl, streamOf } from '../../harness/routes/test-conversation.ts'
import { tool } from '../../harness/routes/test-questions.ts'
import { salesSankhya } from '../../hub/connectors/test-sales.ts'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { call, post } from '../../hub/identity/test-hub.ts'
import { until } from '../../platform/test-until.ts'
import { assisting } from '../assistant/test-assistant.ts'
import { madeTool, publishedAgent, talkedTo } from './test-agents.ts'

export const WRITE = 'tool_lancar_pedido'

/** The fields of an order the model fills; the model of the note is fixed by the tool. */
export const ASKED = {
  codigoCliente: 1,
  itens: [{ codigoProduto: 11, quantidade: 2, valorUnitario: 10 }],
}

/** The model's call of the write, with the order. */
export function launched() {
  return tool(WRITE, ASKED)
}

/**
 * The Assistant's test company (`assisting`) on a Sankhya double of its own, whose orders the test
 * counts, and `Lançar pedido` of the Matriz in the Projeto's library, its model of note fixed.
 */
export async function approving(
  t: TestContext,
  model: Parameters<typeof assisting>[1],
  change?: Parameters<typeof assisting>[3],
) {
  const sankhya = await salesSankhya(t)
  const { fake } = sankhya
  const on = await assisting(t, model, sankhya, change)
  const project = `${on.company}/projects/${on.projectId}`
  const agents = `${project}/agents`
  const tools = `${project}/tools`
  const write = await madeTool(on.hub, on.ana, tools, {
    slug: 'lancar_pedido',
    connectionId: on.matriz,
    operation: 'lancarPedido',
    description: 'Lança um pedido de venda da empresa 1.',
    bound: { notaModelo: 12, codigoLocalEstoque: 1 },
    open: ['codigoCliente', 'itens'],
  })
  /** A published agent of Ana with the write at `approval` and `others` of the library beside it. */
  async function writer(approval: 'ASK' | 'AUTO', body: object = {}, others: string[] = []) {
    return publishedAgent(on.hub, on.ana, agents, {
      instructions: 'Lance os pedidos que a pessoa pedir.',
      connections: [on.matriz],
      tools: [write.latest.id, ...others],
      approvals: { [write.id]: approval },
      ...body,
    })
  }
  /** Ana's new conversation with the agent and its stream. */
  async function opened(agentId: string) {
    const url = await talkedTo(on.hub, on.ana, agents, agentId)
    const stream = await streamOf(on.hub, on.ana, url)
    t.after(() => stream.close())
    return { url, stream }
  }
  return { ...on, fake, agents, tools, write, writer, opened }
}

/**
 * Waits until Mastra stores the run of the card `toolCallId` as suspended. Mastra 1.82 publishes the
 * card before it stores the run, and an answer in that instant loses the resume (#27831).
 */
export async function untilCardStored(hub: Hub, toolCallId: string) {
  await until(
    async () =>
      (
        await hub.test.mastraPool.query(
          `select 1 from mastra.mastra_workflow_snapshot
            where workflow_name = 'agentic-loop' and snapshot->>'status' = 'suspended'
              and position($1 in snapshot::text) > 0`,
          [toolCallId],
        )
      ).rowCount === 1,
    `Mastra stored the run of the card ${toolCallId}`,
  )
}

/** A person's answer to the card of `toolCallId`, through Mastra's own route, once Mastra stores its run; its body. */
export async function answer(
  hub: Hub,
  person: Person,
  url: string,
  toolCallId: string,
  approved: boolean,
) {
  await untilCardStored(hub, toolCallId)
  return answerLate(hub, person, url, toolCallId, approved)
}

/** An answer to a card that no longer waits: sent without waiting for its run. */
export async function answerLate(
  hub: Hub,
  person: Person,
  url: string,
  toolCallId: string,
  approved: boolean,
) {
  const answered = await post(hub, person, `${sessionUrl(url)}/tool-approval`, {
    toolCallId,
    approved,
  })
  assert.equal(answered.statusCode, 200, answered.body)
  return Object(answered.json())
}

type Stream = Awaited<ReturnType<typeof streamOf>>

/** The events until the run asks for an approval or ends, that event last. */
export async function untilAsked(stream: Stream): Promise<StreamEvent[]> {
  const said: StreamEvent[] = []
  for (;;) {
    const event = await stream.next()
    said.push(event)
    if (event.type === 'tool_approval_required' || event.type === 'agent_end') return said
  }
}

/** The card the events end on. */
export function askedOf(events: readonly StreamEvent[]) {
  const last = events.at(-1)
  assert.ok(last?.type === 'tool_approval_required', `the run ended on ${last?.type}`)
  return last
}

/** Every approval the events ask. */
export function approvalsIn(events: readonly StreamEvent[]) {
  return events.filter((event) => event.type === 'tool_approval_required')
}

/** The calls the session's display state holds waiting, by `toolCallId`, as the stream last said it. */
export function pendingOf(stream: Stream): Record<string, { toolName: string }> {
  const display = stream.seen.displays.at(-1)
  assert.ok(display?.type === 'display_state_changed')
  return Object(Reflect.get(display.displayState, 'pendingApprovals'))
}

/** The developer role's connector operations, and whether it publishes a write that runs alone, set by Ana. */
export async function developerHolds(
  on: Awaited<ReturnType<typeof approving>>,
  operations: readonly string[],
  unattended?: boolean,
) {
  const role = await call(on.hub, on.ana, 'PUT', `${on.company}/roles/developer`, {
    connectors: { sankhya: operations },
    ...(unattended === undefined ? {} : { unattended }),
  })
  assert.equal(role.statusCode, 200, role.body)
}
