import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Balloon } from '@conexus/hub-api'
import type { Mastra } from '@mastra/core/mastra'
import type { DynamicWorkflowGraph } from '@mastra/core/workflows'
import { validateDynamicWorkflow } from '@mastra/core/workflows'
import type { FrozenWorkflow, MastraWorkflowId, TriggerShape } from './public.ts'
import { compiled, mastraWorkflowIdOf } from './public.ts'
import {
  approval,
  foreach,
  frozenOf,
  ifBalloon,
  loop,
  notify,
  parallel,
  read,
  testMastra,
  use,
  WORKFLOW_A,
  WORKFLOW_B,
} from './test-workflows.ts'

const ID: MastraWorkflowId = { kind: 'VERSION', workflowId: WORKFLOW_A, version: 1, path: [] }
const SHAPE: TriggerShape = { fields: { total: 'number' } }

function compile(frozen: FrozenWorkflow, shape: TriggerShape = SHAPE): DynamicWorkflowGraph[] {
  return compiled(ID, frozen, shape)
}

type Entry = DynamicWorkflowGraph['graph'][number]

/** Every entry of a list, with the ones a container holds. */
function inside(entries: readonly Entry[]): Entry[] {
  return entries.flatMap((entry): Entry[] => {
    if (entry.type === 'conditional' || entry.type === 'parallel') return [entry, ...entry.steps]
    if (entry.type === 'foreach' || entry.type === 'loop') return [entry, entry.step]
    return [entry]
  })
}

function mainOf(defs: readonly DynamicWorkflowGraph[]): DynamicWorkflowGraph {
  const main = defs.at(-1)
  assert.ok(main)
  return main
}

function pathOf(defs: readonly DynamicWorkflowGraph[], segment: string): DynamicWorkflowGraph {
  const found = defs.find((def) => def.id === `${mastraWorkflowIdOf(ID)}-${segment}`)
  assert.ok(found, segment)
  return found
}

test('o Se com senão: um conditional de dois passos, o senão é o not do se, e cada caminho é um workflow', () => {
  const defs = compile(
    frozenOf([ifBalloon(2, 'total', [notify(3, 'sim')], [notify(4, 'não')]), notify(5, 'fim')]),
  )
  assert.deepEqual(
    defs.map((def) => def.id),
    ['b2_0', 'b2_1', ''].map((segment) => `${mastraWorkflowIdOf(ID)}${segment && `-${segment}`}`),
  )
  const conditional = mainOf(defs).graph.find((entry) => entry.type === 'conditional')
  assert.ok(conditional && conditional.type === 'conditional')
  assert.deepEqual(
    conditional.steps.map((step) => (step.type === 'workflow' ? step.id : null)),
    ['b2_0', 'b2_1'],
  )
  const [yes, no] = conditional.predicates ?? []
  assert.deepEqual(no, { op: 'not', arg: yes })
})

test('um senão sem balão não entra no conditional: um passo e um predicado', () => {
  const defs = compile(frozenOf([ifBalloon(2, 'total', [notify(3, 'sim')], [])]))
  const conditional = mainOf(defs).graph.find((entry) => entry.type === 'conditional')
  assert.ok(conditional && conditional.type === 'conditional')
  assert.equal(conditional.steps.length, 1)
  assert.equal(conditional.predicates?.length, 1)
  assert.equal(defs.length, 2)
})

test('nenhum mapping dentro de um contêiner, e todo balão tipado vem depois do seu mapping, também depois de um APPROVAL', () => {
  const balloons: Balloon[] = [
    read(1),
    approval(2, 'ok? {{b1.resultado}}'),
    notify(3, 'depois da aprovação {{b1.resultado}}'),
    ifBalloon(4, 'total', [notify(5, 'x')], [notify(6, 'y')]),
    parallel(7, [[notify(8, 'a')], [notify(9, 'b')]]),
  ]
  for (const def of compile(frozenOf(balloons))) {
    const top = def.graph
    for (const container of top.filter(
      (entry) => entry.type === 'conditional' || entry.type === 'parallel',
    ))
      if (container.type === 'conditional' || container.type === 'parallel')
        for (const step of container.steps) assert.notEqual(step.type, 'mapping')
    top.forEach((entry, index) => {
      if (entry.type !== 'tool' || entry.id === 'conferir') return
      const before = top[index - 1]
      assert.equal(before?.type, 'mapping', `${def.id}: ${entry.id}`)
      assert.equal(before && 'id' in before && before.id, `${entry.id}-in`)
    })
  }
})

test('todo mapConfig sai como texto JSON e a validação do Mastra não acusa invalid-map-config', () => {
  const frozen = frozenOf([
    read(1, { codigo: '{{gatilho.dia}}', total: '{{gatilho.total}}' }),
    ifBalloon(2, 'total', [notify(3, '{{b1.resultado}} {{gatilho.dia}}')], [notify(4, 'y')]),
  ])
  for (const def of compile(frozen)) {
    for (const entry of inside(def.graph))
      if (entry.type === 'mapping') assert.equal(typeof entry.mapConfig, 'string', entry.id)
    const codes = validateDynamicWorkflow(def).map((issue) => issue.code)
    assert.equal(codes.includes('invalid-map-config'), false, def.id)
  }
})

test('um valor que é só um campo do gatilho guarda o tipo, e {{gatilho.dia}} vem do conferir', () => {
  const defs = compile(frozenOf([read(1, { total: '{{gatilho.total}}', dia: '{{gatilho.dia}}' })]))
  const mapping = mainOf(defs).graph.find((entry) => entry.type === 'mapping')
  assert.ok(mapping && mapping.type === 'mapping')
  assert.deepEqual(JSON.parse(mapping.mapConfig), {
    total: { initData: true, path: 'total' },
    dia: { template: '${stepResults.conferir.dia}' },
    balloon: { value: 'b1' },
  })
})

test('Ao mesmo tempo, Para cada e Repetir são aceitos pelo Mastra com as ferramentas de teste', async () => {
  const mastra = testMastra()
  await mastra.addDynamicWorkflows(
    compile(frozenOf([parallel(1, [[notify(2, 'a')], [notify(3, 'b')]])])),
  )
  const each = mastraWorkflowIdOf({ ...ID, workflowId: WORKFLOW_B })
  await mastra.addDynamicWorkflows(
    compiled(
      { ...ID, workflowId: WORKFLOW_B },
      frozenOf([read(1), foreach(2, [notify(3, 'a {{item.sku}}')])], { many: ['b1'] }),
      SHAPE,
    ),
  )
  assert.ok(Object.hasOwn(mastra.listWorkflows(), each))
  const third: MastraWorkflowId = { ...ID, workflowId: WORKFLOW_B, version: 3 }
  await mastra.addDynamicWorkflows(
    compiled(third, frozenOf([loop(1, 3, 'total', [notify(2, 'volta')])]), SHAPE),
  )
})

test('o Para cada compila logo depois do READ many, sem mapping entre os dois, sem concurrency e com o corpo que começa pelo mapping do item', () => {
  const defs = compile(
    frozenOf([read(1), foreach(2, [notify(3, 'sku {{item.sku}}')])], { many: ['b1'] }),
  )
  const main = mainOf(defs).graph
  const reading = main.findIndex((entry) => entry.type === 'tool' && entry.id === 'b1')
  const entry = main[reading]
  assert.ok(entry && entry.type === 'tool')
  assert.equal(entry.toolId, 'conexus-ler-lista')
  const each = main[reading + 1]
  assert.ok(each && each.type === 'foreach')
  assert.equal(each.opts, undefined)
  assert.equal(each.step.type === 'workflow' && each.step.id, 'b2_0')
  const body = pathOf(defs, 'b2_0')
  assert.equal(body.graph[0]?.type, 'mapping')
  assert.deepEqual(body.inputSchema, {
    type: 'object',
    properties: { sku: {} },
    additionalProperties: true,
  })
})

test('um READ many que não vem antes de um FOREACH compila para conexus-ler e devolve { resultado }', () => {
  const defs = compile(frozenOf([read(1), notify(2, 'x')], { many: ['b1'] }))
  const tool = mainOf(defs).graph.find((each) => each.type === 'tool' && each.id === 'b1')
  assert.ok(tool && tool.type === 'tool')
  assert.equal(tool.toolId, 'conexus-ler')
})

test('o fim: outputSchema {} só quando o último balão é um Para cada, e objeto nos outros', () => {
  const each = compile(frozenOf([read(1), foreach(2, [notify(3, 'a')])], { many: ['b1'] }))
  assert.deepEqual(mainOf(each).outputSchema, {})
  assert.deepEqual(pathOf(each, 'b2_0').outputSchema, { type: 'object' })
  const nested = compile(
    frozenOf([ifBalloon(2, 'total', [read(3), foreach(4, [notify(5, 'a')])], [notify(6, 'b')])], {
      many: ['b3'],
    }),
  )
  assert.deepEqual(pathOf(nested, 'b2_0').outputSchema, {})
  assert.deepEqual(pathOf(nested, 'b2_1').outputSchema, { type: 'object' })
  assert.deepEqual(mainOf(nested).outputSchema, { type: 'object' })
})

test('um Usar outro workflow compila o frozen do outro como o caminho b_0, com o seu conferir', () => {
  const other = frozenOf([notify(1, 'olá {{gatilho.nome}}')])
  const frozen = frozenOf([use(2, WORKFLOW_B, { nome: 'Ana' })], {
    uses: [
      { balloonId: use(2, WORKFLOW_B).id, workflowId: WORKFLOW_B, versionNumber: 1, frozen: other },
    ],
  })
  const defs = compile(frozen)
  const path = pathOf(defs, 'b2_0')
  const first = path.graph[0]
  assert.equal(first?.type === 'tool' && first.id, 'conferir')
  const step = mainOf(defs).graph.find((entry) => entry.type === 'workflow')
  assert.ok(step && step.type === 'workflow')
  assert.equal(step.workflowId, path.id)
  assert.equal(JSON.stringify(defs).includes(WORKFLOW_B), false)
})

test('a mesma versão compila sempre nas mesmas definições', () => {
  const frozen = frozenOf([read(1), ifBalloon(2, 'total', [notify(3, '{{b1.resultado}}')], [])])
  assert.deepEqual(compile(frozen), compile(frozen))
})

test('um mapping de 2.000 caracteres volta inteiro das definições guardadas', async () => {
  const text = `${'a'.repeat(1980)}{{gatilho.dia}}`
  const mastra: Mastra = testMastra()
  const defs = compile(frozenOf([notify(1, text)]))
  await mastra.addDynamicWorkflows(defs)
  const definitions = await mastra.getStorage()?.getStore('workflowDefinitions')
  const row = await definitions?.get(mastraWorkflowIdOf(ID))
  const stored = JSON.stringify(row?.graph)
  const written = defs.at(-1)?.graph.find((entry) => entry.type === 'mapping')
  assert.ok(written && written.type === 'mapping')
  assert.ok(written.mapConfig.length > 2000)
  assert.ok(stored.includes(JSON.stringify(written.mapConfig).slice(1, -1)))
})

test('o Para cada compilado roda: cada corpo recebe o item com o valor da sua linha, e não vazio', async () => {
  const seen: unknown[] = []
  const mastra = testMastra({
    'conexus-ler-lista': async () => [{ sku: 'A1' }, { sku: 'B2' }],
    'conexus-avisar': async (input) => {
      seen.push(input.message)
      return { avisados: [] }
    },
  })
  const frozen = frozenOf([read(1), foreach(2, [notify(3, 'sku {{item.sku}}')])], { many: ['b1'] })
  await mastra.addDynamicWorkflows(compile(frozen))
  const run = await mastra.listWorkflows()[mastraWorkflowIdOf(ID)]?.createRun()
  const result = await run?.start({ inputData: { total: 1 } })
  assert.equal(result?.status, 'success')
  assert.deepEqual(seen, ['sku A1', 'sku B2'])
})

/** The shape has `volta` as a number field only so a test can end a Repetir on the round it reached. */
const ROUNDS: TriggerShape = { fields: { volta: 'number' } }

test('o contador: o Repetir com max 3 e um predicado que nunca para falha com WORKFLOW_LOOP_LIMIT no balão do LOOP', async () => {
  let limited = 0
  const mastra = testMastra({}, async (address) => {
    limited += 1
    return address === 'b1' ? 3 : null
  })
  const never = {
    ...loop(1, 3, 'volta', [notify(2, 'volta')]),
    until: { field: 'volta', op: 'gt', than: 99 },
  } as const
  await mastra.addDynamicWorkflows(compiled(ID, frozenOf([never]), ROUNDS))
  const run = await mastra.listWorkflows()[mastraWorkflowIdOf(ID)]?.createRun()
  const result = await run?.start({ inputData: { volta: 0 } })
  assert.equal(result?.status, 'failed')
  assert.equal(
    result?.status === 'failed' && Reflect.get(result.error, 'code'),
    'WORKFLOW_LOOP_LIMIT',
  )
  assert.equal(result?.steps.b1_0?.status, 'failed')
  assert.equal(limited, 4)
})

test('o contador: com um predicado que para na segunda volta, a execução termina com volta 2', async () => {
  const mastra = testMastra({}, async () => 3)
  const twice = {
    ...loop(1, 3, 'volta', [notify(2, 'volta')]),
    until: { field: 'volta', op: 'gte', than: 2 },
  } as const
  await mastra.addDynamicWorkflows(compiled(ID, frozenOf([twice]), ROUNDS))
  const run = await mastra.listWorkflows()[mastraWorkflowIdOf(ID)]?.createRun()
  const result = await run?.start({ inputData: { volta: 0 } })
  assert.equal(result?.status, 'success')
  assert.equal(result?.status === 'success' && Reflect.get(Object(result.result), 'volta'), 2)
})
