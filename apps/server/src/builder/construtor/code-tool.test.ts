import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { test } from 'node:test'
import { AgentId, CodeSaveResult, CompanyId, ProjectId } from '@conexus/hub-api'
import { call, post } from '../../hub/identity/test-hub.ts'
import { agentOf, drafted, madeAgent } from '../agents/test-agents.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import type { Step } from './test-construtor.ts'
import { building, keeping, listOf, resultOf } from './test-construtor.ts'

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

/** The Matriz as the model learns it: the ready read of pedidos that tool_search shows. */
function matrizOf(asked: Parameters<Step>[0]) {
  const orders = listOf(resultOf(asked).ready).find((each) => each.operation === 'pedidos')
  assert.ok(orders, 'a ready read of pedidos')
  return String(orders.connectionId)
}

/** The model searches the library, then saves what `change` says on the connection the search showed. */
function searching(known: { matriz: string }, change: object = {}): Step[] {
  return [
    () => [tool('tool_search', {})],
    (asked) => {
      known.matriz = matrizOf(asked)
      return [tool('tool_code_save', saving(known.matriz, change))]
    },
  ]
}

/** The folders of tools the machine still holds: the fixtures are the company's rows. */
function leftOnMachine(on: { hub: { assistantMachines: { tuning: { workFolder: string } } } }) {
  return readdirSync(on.hub.assistantMachines.tuning.workFolder).filter((name) =>
    name.startsWith('tool-'),
  )
}

test('o teste passa: a versão 1 é gravada com o código, o módulo empacotado, os esquemas e o resultado do teste, e a pasta da máquina sai', async (t) => {
  const answers: Record<string, unknown>[] = []
  const known = { matriz: '' }
  const on = await building(t, [...searching(known), keeping(answers)])
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
  assert.deepEqual(leftOnMachine(on), [], 'the fixtures left the machine with the folder')
})

test('um esquema de mais de 2.000 caracteres é gravado inteiro: o corte do comando é só do que o modelo lê', async (t) => {
  const answers: Record<string, unknown>[] = []
  const known = { matriz: '' }
  const fields = Array.from({ length: 30 }, (_, at) => `campo${at}`)
  const wide = SOURCE.replace(
    'z.object({ total: z.number() })',
    `z.object({ total: z.number(), ${fields
      .map((name) => `${name}: z.string().optional().describe('${name}, descrito para o modelo')`)
      .join(', ')} })`,
  )
  const on = await building(t, [...searching(known, { source: wide }), keeping(answers)])
  assert.equal(endOf(await on.conversation.say('Crie')), 'complete')

  const saved = answerOf(answers)
  assert.equal(saved.kind, 'SAVED', JSON.stringify(answers))
  if (saved.kind !== 'SAVED') return
  const [version] = saved.tool.versions
  if (version?.kind !== 'CODE') return assert.fail('a CODE version')
  assert.ok(JSON.stringify(version.outputSchema).length > 2000, 'the schema is past the cut')
  assert.ok(Object(version.outputSchema.properties).campo29, 'the last field is in it')
})

test('o teste não passa: o Construtor recebe TOOL_TEST_FAILED com o erro, nada entra na biblioteca e a pasta sai', async (t) => {
  const answers: Record<string, unknown>[] = []
  const known = { matriz: '' }
  const on = await building(t, [...searching(known, { test: FAILING }), keeping(answers)])
  assert.equal(endOf(await on.conversation.say('Crie')), 'complete')

  const refused = answerOf(answers)
  assert.equal(refused.kind, 'REFUSED')
  if (refused.kind !== 'REFUSED') return
  assert.equal(refused.code, 'TOOL_TEST_FAILED')
  assert.match(String(refused.output), /fail|expected|Error/i)
  const listed = await call(on.hub, on.ana, 'GET', on.tools)
  assert.deepEqual(Object(listed.json()).tools, [])
  assert.deepEqual(leftOnMachine(on), [], 'the fixtures left the machine with the folder')
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

test('um esquema com callback que chama JSON.parse não é estado: a regra olha a chamada, não o texto', async (t) => {
  const answers: Record<string, unknown>[] = []
  const known = { matriz: '' }
  const schema = 'const texto = z.string().transform((valor) => JSON.parse(valor))\n\n'
  const on = await building(t, [
    ...searching(known, { source: SOURCE.replace('type Data', `${schema}type Data`) }),
    keeping(answers),
  ])
  assert.equal(endOf(await on.conversation.say('Crie')), 'complete')
  assert.equal(answerOf(answers).kind, 'SAVED', JSON.stringify(answers))
})

/** Code that keeps state outside the function in each of the shapes a model writes it. */
const WITH_STATE: Record<string, string> = {
  let: 'let chamadas = 0\n\n',
  'export let': 'export let chamadas = 0\n\n',
  var: 'var chamadas = 0\n\n',
  'um Map tipado': 'const chamadas = new Map<string, number>()\n\n',
  'um Set tipado': 'const chamadas = new Set<string>()\n\n',
  'um Map com valores': "const chamadas = new Map([['a', 1]])\n\n",
  'uma lista vazia': 'const chamadas = [] as string[]\n\n',
  'um objeto mudado': 'const chamadas = { total: 0 }\n\n',
  'um campo estático': 'class Contador { static chamadas = 0 }\n\n',
  'a globalThis': 'globalThis.chamadas = 0\n\n',
  'uma classe padrão': 'export default class { chamadas = 0 }\n\n',
  'um valor lido por um esquema': 'const chamadas = z.any().parse(new Map<string, number>())\n\n',
  'um valor lido por um esquema, assíncrono':
    'const chamadas = z.any().safeParseAsync(new Map())\n\n',
  'um valor decodificado por um esquema': 'const chamadas = z.any().decode(new Map())\n\n',
  'o parse chamado por .call': 'const chamadas = z.any().parse.call(null, new Map())\n\n',
  'o parse chamado por .apply': 'const chamadas = z.any().parse.apply(null, [new Map()])\n\n',
  'o parse guardado por .bind': 'const ler = z.any().parse.bind(z.any())\n\n',
  'o parse pelo nome entre colchetes': "const chamadas = z.any()['parse'](new Map())\n\n",
  'um esquema somado a um Map': 'const chamadas = z.any() && new Map<string, number>()\n\n',
  'um esquema escolhido por condição':
    'const chamadas = z.any() ? new Map<string, number>() : null\n\n',
  'um registro do Zod': 'const registro = z.registry<{ n: number }>()\n\n',
}

test('estado de módulo: cada forma de guardar estado fora da função é recusada antes do teste e nada é gravado', async (t) => {
  const answers: Record<string, unknown>[] = []
  const known = { matriz: '' }
  const shapes = Object.entries(WITH_STATE)
  function sourceWith(state: string) {
    return SOURCE.replace('type Data', `${state}type Data`)
  }
  const attempts: Step[] = shapes.map(([, state], at) => (asked) => {
    if (at === 0) known.matriz = matrizOf(asked)
    else answers.push(resultOf(asked))
    return [tool('tool_code_save', saving(known.matriz, { source: sourceWith(state) }))]
  })
  const on = await building(t, [() => [tool('tool_search', {})], ...attempts, keeping(answers)])
  assert.equal(endOf(await on.conversation.say('Crie')), 'complete')

  assert.equal(answers.length, shapes.length)
  shapes.forEach(([name], at) => {
    const refused = answerOf(answers, at)
    assert.deepEqual(
      [refused.kind, Object(refused).code, Object(refused).field, Object(refused).reason],
      ['REFUSED', 'TOOL_REFUSED', 'source', 'MODULE_STATE'],
      name,
    )
  })
  const listed = await call(on.hub, on.ana, 'GET', on.tools)
  assert.deepEqual(Object(listed.json()).tools, [])
})

test('uma versão nunca muda: a segunda grava a versão 2 e o agente publicado abre e continua na 1', async (t) => {
  const answers: Record<string, unknown>[] = []
  const known = { matriz: '' }
  const [search, firstSave] = searching(known)
  assert.ok(search && firstSave)
  const on = await building(t, [
    search,
    firstSave,
    (asked) => {
      answers.push(resultOf(asked))
      const toolId = String(Object(Object(answers[0]).tool).id)
      return [
        tool(
          'tool_code_save',
          saving(known.matriz, { toolId, basedOn: 1, description: 'Soma, v2.' }),
        ),
      ]
    },
    keeping(answers),
  ])
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
  const known = { matriz: '' }
  const [search, firstSave] = searching(known)
  assert.ok(search && firstSave)
  function toolIdOf() {
    return String(Object(Object(answers[0]).tool).id)
  }
  const on = await building(t, [
    search,
    firstSave,
    (asked) => {
      answers.push(resultOf(asked))
      return [tool('tool_code_save', saving(known.matriz, { toolId: toolIdOf(), basedOn: 1 }))]
    },
    (asked) => {
      answers.push(resultOf(asked))
      const change = { toolId: toolIdOf(), basedOn: 1, description: 'Outra.' }
      return [tool('tool_code_save', saving(known.matriz, change))]
    },
    keeping(answers),
  ])
  assert.equal(endOf(await on.conversation.say('Crie e mude duas vezes')), 'complete')
  const stale = answerOf(answers, 2)
  assert.deepEqual(
    [stale.kind, Object(stale).code, Object(stale).field, Object(stale).reason],
    ['REFUSED', 'TOOL_REFUSED', 'toolId', 'STALE_VERSION'],
  )
})
