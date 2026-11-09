import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { BalloonAddress, PersonId, ToolSlug } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import { Tool } from '@mastra/core/tools'
import { TurnKey } from '../../hub/connectors/public.ts'
import { LANCAR, writing } from '../../hub/connectors/test-write.ts'
import type { PresetFrozenTool } from './frozen.ts'
import { presetTools, RUN_CALL_KEY } from './tools.ts'

const ASKED = {
  codigoCliente: 1,
  itens: [{ codigoProduto: 11, quantidade: 2, valorUnitario: 10 }],
}

/** Mastra's context for a tool call has far more fields than the tool reads; the test gives the ones it reads. */
function contextOf(given: object) {
  return Object.assign(Object.create(null), given)
}

type Writing = Awaited<ReturnType<typeof writing>>

/** The scope and author of the write: the draft talked to by Ana, or a published version she answers for. */
function speakingAs(on: Writing, by: 'DRAFT' | 'VERSION') {
  const declared = [{ connectionId: on.matriz, operation: LANCAR }]
  const scope =
    by === 'DRAFT'
      ? on.scopeOf(on.ana.id)
      : { ...on.scopeOf(on.ana.id), speaksAs: { kind: 'VERSION', declared } as const }
  const author =
    by === 'DRAFT'
      ? ({ kind: 'DRAFT' } as const)
      : ({
          kind: 'VERSION',
          agentId: on.agentId,
          number: 1,
          answeredBy: PersonId.parse(on.ana.id),
        } as const)
  return { scope, author }
}

function toolOn(connectionId: Writing['matriz']) {
  return {
    kind: 'PRESET',
    slug: ToolSlug.parse('lancar_pedido'),
    description: 'Lança um pedido.',
    connectionId,
    operation: LANCAR,
    bound: { notaModelo: 12, codigoLocalEstoque: 1 },
    open: ['codigoCliente', 'itens'],
    approval: 'AUTO',
  } satisfies PresetFrozenTool
}

/**
 * The agent's write tool over the real funnel, its author the person on the draft, called as a
 * balloon `b3` of a workflow run does (step 24.6, U2): `attempt` puts the run's call on the
 * request context, `undefined` leaves it a conversation's call.
 */
export async function writingInARun(t: TestContext, by: 'DRAFT' | 'VERSION' = 'DRAFT') {
  const on = await writing(t)
  const { scope, author } = speakingAs(on, by)
  const tool = toolOn(on.matriz)
  const { writes } = await presetTools({
    connectors: on.hub.connectors.assistant,
    scope,
    tools: [tool],
    turnOf: () => TurnKey.parse(randomUUID()),
    author,
    offered: [{ connectionId: on.matriz, connector: 'sankhya' }],
    approval: {
      database: on.hub.test.database,
      identity: { mayUse: async () => true, mayPublishUnattended: async () => true },
      openWrites: (key) => on.hub.connectors.assistant.openWrites(key),
    },
    log: { info: () => undefined, error: () => undefined },
  })
  const write = writes.tool_lancar_pedido
  assert.ok(write instanceof Tool)
  const writer: Tool = write
  function contextAt(attempt: number | undefined) {
    const requestContext = new RequestContext()
    if (attempt !== undefined) {
      const balloon = BalloonAddress.parse('b3')
      requestContext.set(RUN_CALL_KEY, { runId: on.runId, balloon, attempt })
    }
    return requestContext
  }
  /** One call of the tool in a conversation of its own, as Mastra makes it. */
  function call(attempt: number | undefined, toolCallId: string) {
    const agent = {
      toolCallId,
      threadId: randomUUID(),
      messages: [],
      suspend: async () => undefined,
    }
    return writer.execute?.(ASKED, contextOf({ requestContext: contextAt(attempt), agent }))
  }
  /** Whether the tool asks the person first, given the plain object Mastra 1.82 hands the rule (`buildToolApprovalContext`). */
  function asks(attempt: number | undefined) {
    const rule = writer.requireApproval
    const requestContext = Object.fromEntries(contextAt(attempt).entries())
    return typeof rule === 'function' ? rule(ASKED, { requestContext }) : rule
  }
  /** A call whose run call on the request context is not one: a defect, never a conversation's call. */
  function callMalformed() {
    const requestContext = new RequestContext()
    requestContext.set(RUN_CALL_KEY, { runId: on.runId })
    const agent = {
      toolCallId: 'call-x',
      threadId: randomUUID(),
      messages: [],
      suspend: async () => undefined,
    }
    return writer.execute?.(ASKED, contextOf({ requestContext, agent }))
  }
  return { on, call, asks, callMalformed }
}
