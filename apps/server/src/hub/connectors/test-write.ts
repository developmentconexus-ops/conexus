import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import type { BalloonCallKey } from '@conexus/hub-api'
import {
  AgentId,
  BalloonAddress,
  balloonCallKeyOf,
  CompanyId,
  ConnectionId,
  ConversationId,
  OperationId,
  PersonId,
  ProjectId,
  Role,
  ToolCallId,
  WorkflowId,
  WorkflowRunId,
} from '@conexus/hub-api'
import { z } from 'zod'
import { post } from '../identity/test-hub.ts'
import type { SessionScope, WriteRequest } from './public.ts'
import { TurnKey } from './public.ts'
import { appCalls } from './test-app-calls.ts'
import { markOf, scopeIdOf } from './write-request.ts'

/** A request kept in a conversation, whose call key is a tool call. */
type InConversation = Extract<WriteRequest, { where: { kind: 'CONVERSATION' } }>

/** What a test changes in the request of `byAna`, `byVersion` and `byCarla`. */
type Over = Partial<{
  scope: SessionScope
  connectionId: ConnectionId
  operation: OperationId
  input: unknown
  threadId: ConversationId
  toolCallId: ToolCallId
  turn: TurnKey
}>

export const ORDER = {
  notaModelo: 12,
  codigoCliente: 1,
  codigoLocalEstoque: 1,
  itens: [{ codigoProduto: 11, quantidade: 2, valorUnitario: 10 }],
}
export const LANCAR = OperationId.parse('lancarPedido')

/** What the stand-in before the double does to the order's add: `cut` forwards it and drops the answer. */
type Mode = { cut: boolean; posts: number }

/** In front of the Sankhya double, counting every POST of an order, whatever the double answers. */
function counting(t: TestContext, mode: Mode) {
  return async (origin: string) => {
    const server = createServer(async (incoming, outgoing) => {
      const chunks: Buffer[] = []
      for await (const chunk of incoming) chunks.push(z.instanceof(Buffer).parse(chunk))
      const adding = incoming.method === 'POST' && incoming.url === '/v1/vendas/pedidos'
      if (adding) mode.posts += 1
      const headers = Object.entries(incoming.headers).flatMap(([name, value]) =>
        typeof value === 'string' && name !== 'host'
          ? [[name, value] satisfies [string, string]]
          : [],
      )
      const answered = await fetch(`${origin}${incoming.url}`, {
        method: incoming.method,
        headers,
        redirect: 'manual',
        ...(incoming.method === 'GET' ? {} : { body: Buffer.concat(chunks) }),
      })
      const body = Buffer.from(await answered.arrayBuffer())
      if (adding && mode.cut) {
        outgoing.destroy()
        return
      }
      outgoing.writeHead(answered.status, Object.fromEntries(answered.headers))
      outgoing.end(body)
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    t.after(() => {
      server.closeAllConnections()
      server.close()
    })
    const { port } = z.object({ port: z.number() }).parse(server.address())
    return `http://127.0.0.1:${port}`
  }
}

/** The requests of Ana (owner), of a published version and of Carla, each a fresh call unless a test changes it. */
function requesters(on: Awaited<ReturnType<typeof appCalls>>, matriz: ConnectionId) {
  const companyId = CompanyId.parse(on.companyId)
  const projectId = ProjectId.parse(on.projectId)
  function scopeOf(personId: string, chosen = [matriz]): SessionScope {
    return {
      companyId,
      personId: PersonId.parse(personId),
      place: { kind: 'PROJECT', projectId },
      chosen,
    }
  }
  const thread = ConversationId.parse(randomUUID())
  const agentId = AgentId.parse(randomUUID())
  const runId = WorkflowRunId.parse(randomUUID())
  const workflowId = WorkflowId.parse(randomUUID())
  function common(over: Omit<Over, 'threadId' | 'toolCallId'>) {
    return {
      scope: scopeOf(on.ana.id),
      connectionId: matriz,
      operation: LANCAR,
      input: ORDER,
      turn: TurnKey.parse(randomUUID()),
      ...over,
    }
  }
  function base({ threadId, toolCallId, ...rest }: Over) {
    return {
      ...common(rest),
      where: { kind: 'CONVERSATION', threadId: threadId ?? thread },
      callKey: toolCallId ?? ToolCallId.parse(randomUUID()),
    } as const
  }
  function byAna(over: Over = {}): InConversation {
    const speaker = {
      kind: 'PERSON',
      personId: PersonId.parse(on.ana.id),
      role: Role.parse('owner'),
    } as const
    return { ...base(over), speaker }
  }
  function byVersion(over: Over = {}): InConversation {
    const declared = [{ connectionId: matriz, operation: LANCAR }]
    return { ...base(over), speaker: { kind: 'VERSION', declared }, agentId, number: 1 }
  }
  /** A balloon of a workflow run writing: the run's book, the workflow's version declared. */
  function byWorkflow(
    over: Omit<Over, 'threadId' | 'toolCallId'> & {
      callKey?: BalloonCallKey
      declares?: boolean
    } = {},
  ): WriteRequest {
    const { callKey, declares = true, ...rest } = over
    const declared = declares ? [{ connectionId: matriz, operation: LANCAR }] : []
    return {
      ...common(rest),
      where: { kind: 'RUN', runId },
      callKey: callKey ?? balloonCallKeyOf(BalloonAddress.parse('b5'), 0),
      speaker: { kind: 'WORKFLOW', declared },
      workflowId,
      number: 1,
    }
  }
  function byCarla(over: Over = {}): InConversation {
    const speaker = {
      kind: 'PERSON',
      personId: PersonId.parse(on.carla.id),
      role: Role.parse('member'),
    } as const
    return { ...base({ scope: scopeOf(on.carla.id), ...over }), speaker }
  }
  return { scopeOf, byAna, byVersion, byWorkflow, byCarla, thread, agentId, runId, workflowId }
}

/** The mark of the request's own write, as the record keeps it. */
export function markFor(request: WriteRequest): string {
  return markOf(scopeIdOf(request.where), request.callKey)
}

/** Empresa A with the Sankhya double released to the Projeto, and a way to ask the write funnel as Ana, as a version, or as Carla in a role without the write. */
export async function writing(t: TestContext, a: { order?: () => Promise<Response> } = {}) {
  const mode: Mode = { cut: false, posts: 0 }
  const { order } = a
  if (order !== undefined) {
    const real = globalThis.fetch
    t.mock.method(globalThis, 'fetch', (input: Request | string | URL, init?: RequestInit) => {
      if (
        !(input instanceof Request) ||
        input.method !== 'POST' ||
        !input.url.endsWith('/v1/vendas/pedidos')
      )
        return real(input, init)
      mode.posts += 1
      return order()
    })
  }
  const on = await appCalls(t, { through: counting(t, mode) })
  const matriz = ConnectionId.parse(await on.connect('Matriz'))
  const companyRoute = `/api/companies/${on.companyId}`
  assert.equal(
    (
      await post(on.hub, on.ana, `${companyRoute}/roles`, {
        label: 'Atendente',
        connectors: { sankhya: ['pedidos'] },
      })
    ).statusCode,
    201,
  )
  await on.hub.test.asOwner(
    "update auth.member set role = 'atendente' where company_id = $1 and user_id = $2",
    [on.companyId, on.carla.id],
  )
  const { scopeOf, byAna, byVersion, byWorkflow, byCarla, thread, agentId, runId, workflowId } =
    requesters(on, matriz)
  function ask(request: WriteRequest) {
    return on.hub.connectors.assistant.write(request)
  }
  function ledger() {
    return on.hub.test.asOwner(
      'select thread_id, tool_call_id, state, answer, agent_id, version_number, person_id, workflow_id, workflow_version, approved_by, input_hash from connectors.connector_write order by created_at',
    )
  }
  function lines(message: string) {
    return on.hub.lines.filter((line) => line.message === message)
  }
  return {
    ...on,
    mode,
    matriz,
    thread,
    agentId,
    byAna,
    byVersion,
    byWorkflow,
    runId,
    workflowId,
    byCarla,
    ask,
    ledger,
    lines,
    scopeOf,
  }
}
