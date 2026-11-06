import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AgentId, CodeSaveResult, CompanyId, ProjectId } from '@conexus/hub-api'
import { call, post } from '../../hub/identity/test-hub.ts'
import { agentOf, drafted, madeAgent } from '../agents/test-agents.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { building, keeping } from './test-construtor.ts'

/** The tool's code: counts the rows the read answers, as a Worker module of the platform. */
const SOURCE = `import { z } from 'zod'

export const input = z.object({ mes: z.string() })
export const output = z.object({ total: z.number() })

type Data = { read(operation: string, input: unknown): Promise<unknown> }

export default {
  async fetch(request: Request, _env: unknown, ctx: { props: { data: Data } }) {
    const { mes } = input.parse(await request.json())
    const lido = z.object({ linhas: z.array(z.unknown()) }).parse(
      await ctx.props.data.read('pedidos', { mes }),
    )
    return Response.json(output.parse({ total: lido.linhas.length }))
  },
}
`

const TEST = `import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import tool from './tool.ts'

const fixtures = JSON.parse(readFileSync(new URL('./fixtures.json', import.meta.url), 'utf8'))

test('conta as linhas lidas', async () => {
  const ctx = { props: { data: { read: async (operation: string) => fixtures[operation] } } }
  const request = new Request('http://tool/', { method: 'POST', body: JSON.stringify({ mes: '2026-09' }) })
  const answer = await tool.fetch(request, {}, ctx)
  const body = await answer.json()
  assert.equal(body.total, fixtures.pedidos.linhas.length)
})
`

const FAILING = TEST.replace('fixtures.pedidos.linhas.length', 'fixtures.pedidos.linhas.length + 1')

function saving(connectionId: string, change: object = {}) {
  return {
    slug: 'vendas_por_vendedor',
    connectionId,
    reads: ['pedidos'],
    description: 'Soma as vendas de cada vendedor num mês.',
    source: SOURCE,
    test: TEST,
    samples: { pedidos: { codigoEmpresa: 1, page: 1 } },
    ...change,
  }
}

function answerOf(answers: Record<string, unknown>[], at = 0) {
  return CodeSaveResult.parse(answers[at])
}

test('o teste passa: a versão 1 é gravada com o código, o módulo empacotado e o resultado do teste', async (t) => {
  const answers: Record<string, unknown>[] = []
  let matriz = ''
  const on = await building(t, [() => [tool('tool_code_save', saving(matriz))], keeping(answers)])
  matriz = on.matriz
  assert.equal(endOf(await on.conversation.say('Crie uma ferramenta de vendas')), 'complete')

  const saved = answerOf(answers)
  assert.equal(saved.kind, 'SAVED', JSON.stringify(answers))
  if (saved.kind !== 'SAVED') return
  assert.equal(saved.tool.kind, 'CODE')
  assert.equal(saved.tool.latest.number, 1)
  const [version] = saved.tool.versions
  assert.equal(version?.kind, 'CODE')
  if (version?.kind !== 'CODE') return
  assert.equal(version.source, SOURCE)
  assert.deepEqual(version.reads, ['pedidos'])
  assert.equal(version.test.passed, true)
  assert.ok(version.inputSchema.type === 'object', 'the JSON Schema of the input')
  const listed = await call(on.hub, on.ana, 'GET', on.tools)
  const [kept] = Object(listed.json()).tools
  assert.equal(kept.kind, 'CODE')
  assert.deepEqual(kept.reads, ['pedidos'])
  const stored = await on.hub.test.asOwner(
    "select config->>'module' as module from builder.tool_version where tool_id = $1",
    [saved.tool.id],
  )
  assert.match(String(stored[0]?.module), /total/)
})

test('o teste não passa: o Construtor recebe TOOL_TEST_FAILED com o erro e nada entra na biblioteca', async (t) => {
  const answers: Record<string, unknown>[] = []
  let matriz = ''
  const on = await building(t, [
    () => [tool('tool_code_save', saving(matriz, { test: FAILING }))],
    keeping(answers),
  ])
  matriz = on.matriz
  assert.equal(endOf(await on.conversation.say('Crie')), 'complete')

  const refused = answerOf(answers)
  assert.equal(refused.kind, 'REFUSED')
  if (refused.kind !== 'REFUSED') return
  assert.equal(refused.code, 'TOOL_TEST_FAILED')
  assert.match(String(refused.output), /fail|expected|Error/i)
  const listed = await call(on.hub, on.ana, 'GET', on.tools)
  assert.deepEqual(Object(listed.json()).tools, [])
})

test('uma ligação que o Projeto não recebeu é recusada com NOT_OFFERED, sem máquina e sem linha', async (t) => {
  const answers: Record<string, unknown>[] = []
  const on = await building(t, [
    () => [tool('tool_code_save', saving('00000000-0000-4000-8000-000000000000'))],
    keeping(answers),
  ])
  assert.equal(endOf(await on.conversation.say('Crie')), 'complete')

  const refused = answerOf(answers)
  assert.deepEqual(
    [refused.kind, Object(refused).code, Object(refused).field, Object(refused).reason],
    ['REFUSED', 'TOOL_REFUSED', 'connectionId', 'NOT_OFFERED'],
  )
  const listed = await call(on.hub, on.ana, 'GET', on.tools)
  assert.deepEqual(Object(listed.json()).tools, [])
})

test('estado de módulo: um let fora da função é recusado antes do teste e nada é gravado', async (t) => {
  const answers: Record<string, unknown>[] = []
  let matriz = ''
  const withState = SOURCE.replace('type Data', 'let chamadas = 0\n\ntype Data').replace(
    'const { mes }',
    'chamadas += 1\n    const { mes }',
  )
  const on = await building(t, [
    () => [tool('tool_code_save', saving(matriz, { source: withState }))],
    keeping(answers),
  ])
  matriz = on.matriz
  assert.equal(endOf(await on.conversation.say('Crie')), 'complete')

  const refused = answerOf(answers)
  assert.deepEqual(
    [refused.kind, Object(refused).code, Object(refused).field, Object(refused).reason],
    ['REFUSED', 'TOOL_REFUSED', 'source', 'MODULE_STATE'],
  )
  const listed = await call(on.hub, on.ana, 'GET', on.tools)
  assert.deepEqual(Object(listed.json()).tools, [])
})

test('uma versão nunca muda: a segunda grava a versão 2 e o agente publicado abre e continua na 1', async (t) => {
  const answers: Record<string, unknown>[] = []
  let matriz = ''
  let toolId = ''
  const on = await building(t, [
    () => [tool('tool_code_save', saving(matriz))],
    (asked) => {
      answers.push(Object(JSON.parse(String(asked.texts.at(-1)))))
      toolId = String(Object(Object(answers[0]).tool).id)
      return [
        tool('tool_code_save', saving(matriz, { toolId, basedOn: 1, description: 'Soma, v2.' })),
      ]
    },
    keeping(answers),
  ])
  matriz = on.matriz
  assert.equal(endOf(await on.conversation.say('Crie e mude')), 'complete')
  const [first, second] = [answerOf(answers, 0), answerOf(answers, 1)]
  assert.equal(first.kind, 'SAVED')
  assert.equal(second.kind, 'SAVED', JSON.stringify(answers[1]))
  if (first.kind !== 'SAVED' || second.kind !== 'SAVED') return
  assert.deepEqual(
    second.tool.versions.map((each) => each.number),
    [1, 2],
  )

  const agent = await madeAgent(on.hub, on.ana, on.agents)
  const chosen = await drafted(on.hub, on.ana, on.agents, agent, {
    instructions: 'Responda com as vendas.',
    connections: [on.matriz],
    tools: [first.tool.latest.id],
  })
  const published = await post(on.hub, on.ana, `${on.agents}/${agent.id}/publish`, {
    revision: chosen.revision,
    message: 'Primeira',
  })
  assert.equal(published.statusCode, 200, published.body)
  const ids = { companyId: CompanyId.parse(on.companyId), projectId: ProjectId.parse(on.projectId) }
  const active = await on.hub.agents.activeOf(ids, AgentId.parse(agent.id))
  const [frozen] = active?.tools ?? []
  assert.equal(frozen?.kind, 'CODE')
  if (frozen?.kind !== 'CODE') return
  assert.equal(frozen.toolVersionId, first.tool.latest.id)
  assert.equal(frozen.description, 'Soma as vendas de cada vendedor num mês.')
  assert.ok(!('module' in frozen) && !('source' in frozen), 'the agent does not carry the code')
  assert.equal(agentOf(published).state.kind, 'PUBLISHED')
})

test('a versão gravada sobre uma que não é a última é recusada com STALE_VERSION', async (t) => {
  const answers: Record<string, unknown>[] = []
  let matriz = ''
  let toolId = ''
  const on = await building(t, [
    () => [tool('tool_code_save', saving(matriz))],
    (asked) => {
      answers.push(Object(JSON.parse(String(asked.texts.at(-1)))))
      toolId = String(Object(Object(answers[0]).tool).id)
      return [tool('tool_code_save', saving(matriz, { toolId, basedOn: 1 }))]
    },
    (asked) => {
      answers.push(Object(JSON.parse(String(asked.texts.at(-1)))))
      return [tool('tool_code_save', saving(matriz, { toolId, basedOn: 1, description: 'Outra.' }))]
    },
    keeping(answers),
  ])
  matriz = on.matriz
  assert.equal(endOf(await on.conversation.say('Crie e mude duas vezes')), 'complete')
  const stale = answerOf(answers, 2)
  assert.deepEqual(
    [stale.kind, Object(stale).code, Object(stale).field, Object(stale).reason],
    ['REFUSED', 'TOOL_REFUSED', 'toolId', 'STALE_VERSION'],
  )
})
