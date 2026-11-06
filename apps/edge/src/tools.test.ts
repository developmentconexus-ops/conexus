import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { APP_CALL_LIMITS } from '@conexus/app-contract'
import { callToolConnector, ToolCallAnswer } from '@conexus/hub-api'
import type { Tool } from './test-edge.ts'
import { edge, TOOLS_AUD } from './test-edge.ts'

const VERSION = randomUUID()
const WORKER = `t-${VERSION}`
const CALL = randomUUID()
const ACCESS = { aud: TOOLS_AUD }
const READS_PATH = '/api/tool-connector-calls'

/** The Hub's call of a saved tool, as `createEdgeTools` sends it. */
function calling(input: unknown = { mes: '2026-09' }): RequestInit {
  return { method: 'POST', body: JSON.stringify({ call: CALL, input }) }
}

/** A tool that sums the rows its one declared read gives, as the Construtor's test tool does. */
const summing: Tool = async (request, { props }) => {
  const { mes } = Object(await request.json())
  const read = Object(await props.data.read('pedidos', { mes }))
  return Response.json({ total: read.linhas.length })
}

/** The Hub's tool door: `pedidos` reads three rows, any other operation is not declared. */
async function door(request: Request): Promise<Response> {
  const body = callToolConnector.input.body.parse(await request.json())
  return Response.json(
    body.operation === 'pedidos'
      ? { kind: 'OK', value: { linhas: [1, 2, 3] } }
      : { kind: 'NOT_DECLARED' },
  )
}

async function answerOf(response: Response) {
  assert.equal(response.status, 200)
  return ToolCallAnswer.parse(await response.json())
}

test('a ferramenta roda no seu Worker t-<versão> só com data, sob os limites dos apps, e a conta volta', async () => {
  const at = edge({ hub: door, tools: { [WORKER]: summing } })
  const answer = await answerOf(await at.tool(`/${VERSION}`, calling(), ACCESS))
  assert.deepEqual(answer, { kind: 'OK', value: { total: 3 } })
  const [call] = at.toolCalls
  assert.equal(call?.name, WORKER)
  assert.deepEqual(call?.options, {
    outbound: {},
    limits: { subRequests: APP_CALL_LIMITS.dbCallsPerCall, cpuMs: APP_CALL_LIMITS.cpuMs },
  })
  assert.deepEqual(await call?.request.json(), { mes: '2026-09' })
  const [bound] = at.toolBindings
  assert.deepEqual(Object.keys(bound ?? {}).sort(), ['call', 'endsAt', 'toolVersionId'])
  const [read] = at.hubCalls.filter((r) => new URL(r.url).pathname === READS_PATH)
  const { deadlineMs, ...body } = callToolConnector.input.body.parse(await read?.json())
  assert.ok(deadlineMs >= 1 && deadlineMs <= APP_CALL_LIMITS.callDeadlineMs)
  assert.deepEqual(body, {
    toolVersionId: VERSION,
    call: CALL,
    operation: 'pedidos',
    input: { mes: '2026-09' },
  })
})

test('sem o Access ou com outro público: 403, e nenhum Worker roda', async () => {
  const at = edge({ hub: door, tools: { [WORKER]: summing } })
  const refused = [
    await at.tool(`/${VERSION}`, calling()),
    await at.tool(`/${VERSION}`, calling(), { aud: 'b'.repeat(64) }),
  ]
  assert.deepEqual(
    refused.map((response) => response.status),
    [403, 403],
  )
  assert.equal(at.toolCalls.length, 0)
  assert.equal(at.hubCalls.length, 0)
})

test('uma leitura que a versão não declarou rejeita com NOT_DECLARED, e o Hub ouve TOOL_FAILED com a razão', async (t) => {
  t.mock.method(console, 'error', () => undefined)
  const undeclared: Tool = async (_request, { props }) =>
    Response.json(await props.data.read('clientes', {}))
  const at = edge({ hub: door, tools: { [WORKER]: undeclared } })
  const answer = await answerOf(await at.tool(`/${VERSION}`, calling(), ACCESS))
  assert.deepEqual(answer, { kind: 'FAILED', reason: 'NOT_DECLARED' })
})

test('a CPU passada, uma resposta que não é JSON e um erro da ferramenta voltam como TOOL_FAILED', async (t) => {
  const lines: string[] = []
  t.mock.method(console, 'error', (line: string) => lines.push(line))
  const tools: Record<string, Tool> = {
    [`t-${'1'.repeat(8)}-0000-4000-8000-000000000001`]: () => {
      throw new Error('Worker exceeded CPU time limit.')
    },
    [`t-${'1'.repeat(8)}-0000-4000-8000-000000000002`]: () => new Response('não é json'),
    [`t-${'1'.repeat(8)}-0000-4000-8000-000000000003`]: () => {
      throw new TypeError('linhas is undefined')
    },
    [`t-${'1'.repeat(8)}-0000-4000-8000-000000000004`]: () =>
      Response.json({ erro: 'entrada' }, { status: 400 }),
  }
  const at = edge({ hub: door, tools })
  const reasons = []
  for (const name of Object.keys(tools)) {
    const answer = await answerOf(await at.tool(`/${name.slice(2)}`, calling(), ACCESS))
    reasons.push(answer.kind === 'FAILED' ? answer.reason : answer.kind)
  }
  assert.deepEqual(reasons, ['CPU', 'NOT_JSON', 'THREW', 'STATUS'])
  // The log names the reason, never the tool's message nor its input (S41).
  assert.ok(lines.every((line) => !line.includes('linhas') && !line.includes('2026-09')))
})

test('a versão cujo Worker sumiu responde MISSING, para o Hub subir de novo', async () => {
  const at = edge({ hub: door })
  assert.deepEqual(await answerOf(await at.tool(`/${VERSION}`, calling(), ACCESS)), {
    kind: 'MISSING',
  })
})

test('um caminho que não é um id de versão ou um pedido que não é a chamada do Hub não chegam a um Worker', async () => {
  const at = edge({ hub: door, tools: { [WORKER]: summing } })
  const answers = [
    await at.tool('/../t-x', calling(), ACCESS),
    await at.tool(`/${VERSION}`, { method: 'GET' }, ACCESS),
    await at.tool(`/${VERSION}`, { method: 'POST', body: '{"input":1}' }, ACCESS),
  ]
  assert.deepEqual(
    answers.map((response) => response.status),
    [404, 404, 400],
  )
  assert.equal(at.toolCalls.length, 0)
})
