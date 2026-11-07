import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { sankhyaFake } from '@conexus/connectors'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { post } from '../../hub/identity/test-hub.ts'
import { assisting } from '../assistant/test-assistant.ts'
import type { StreamEvent } from '../conversation/test-conversation.ts'
import { sessionUrl, streamOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
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
  const fake = sankhyaFake()
  const served = await fake.serve()
  t.after(() => served.close())
  const sankhya = { origin: served.origin, matriz: fake.credential, filial: fake.credential }
  const on = await assisting(t, model, sankhya, change)
  const project = `${on.company}/projects/${on.projectId}`
  const agents = `${project}/agents`
  const tools = `${project}/tools`
  const write = await madeTool(on.hub, on.ana, tools, {
    slug: 'lancar_pedido',
    connectionId: on.matriz,
    operation: 'lancarPedido',
    description: 'Lança um pedido de venda da empresa 1.',
    bound: { notaModelo: 12 },
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
 * How long a person takes to read the card before answering. Mastra 1.82 publishes the card before
 * it stores the run as suspended, and an answer in that instant loses the resume (#27831): the
 * card's failure table keeps the person's pace, never a retry.
 */
export const PERSON_PACE_MS = 1_500

/** A person's answer to the card of `toolCallId`, through Mastra's own route, at a person's pace; its body. */
export async function answer(
  hub: Hub,
  person: Person,
  url: string,
  toolCallId: string,
  approved: boolean,
) {
  await sleep(PERSON_PACE_MS)
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
