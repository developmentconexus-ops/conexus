import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Balloon, WorkflowDraft } from '@conexus/hub-api'
import { OperationId } from '@conexus/hub-api'
import { compiled } from './compile.ts'
import { graphProblems } from './graph-problems.ts'
import { registryIndexOf } from './index.ts'
import { problemsOf } from './problems.ts'
import {
  foreach,
  frozenOf,
  ifBalloon,
  notify,
  read,
  testMastra,
  WORKFLOW_A,
} from './test-workflows.ts'
import { PUBLISHER, testWorld } from './test-world.ts'

function draftOf(balloons: Balloon[]): WorkflowDraft {
  return { name: 'Fluxo', trigger: { kind: 'MANUAL' }, balloons }
}

function codes(balloons: Balloon[], over = {}) {
  return problemsOf(testWorld(over), WORKFLOW_A, draftOf(balloons), PUBLISHER).then((found) =>
    found.problems.map((each) => `${each.code}@${each.balloonId}`),
  )
}

test('a validação do Mastra: sem a ferramenta conexus-ler, o READ ganha GRAPH_MISSING_REFERENCE', async () => {
  const mastra = testMastra()
  const world = testWorld({
    registryOf: (bundle) => {
      const index = registryIndexOf(mastra, bundle)
      delete index.tools?.['conexus-ler']
      return index
    },
  })
  const found = await problemsOf(world, WORKFLOW_A, draftOf([read(1), notify(2, 'x')]), PUBLISHER)
  const [only, ...others] = found.problems
  assert.equal(others.length, 0)
  assert.equal(only?.code, 'GRAPH_MISSING_REFERENCE')
  assert.equal(only?.balloonId, 'b1')
  assert.equal(found.ready, null)
  assert.match(only?.message ?? '', /Ler 1/)
  assert.doesNotMatch(only?.message ?? '', /Step|toolId|conexus-/)
  assert.ok(only?.repair !== undefined)
})

test('a validação do Mastra: o READ do senão também, pelo balão de dentro do caminho', () => {
  const mastra = testMastra()
  const balloons = [read(1), ifBalloon(2, 'total', [notify(3, 'x')], [read(4)])]
  const frozen = frozenOf(balloons)
  const shape = { fields: { total: 'number' as const } }
  const defs = compiled({ kind: 'TEST', workflowId: WORKFLOW_A, path: [] }, frozen, shape)
  const index = registryIndexOf(mastra, defs)
  delete index.tools?.['conexus-ler']
  const graph = graphProblems(balloons, defs, index)
  assert.deepEqual(graph.map((each) => each.balloonId).sort(), ['b1', 'b4'])
  for (const each of graph) assert.equal(each.code, 'GRAPH_MISSING_REFERENCE')
  assert.deepEqual(graphProblems(balloons, defs, registryIndexOf(mastra, defs)), [])
})

test('a validação do Mastra: com o índice inteiro, o rascunho não tem problema GRAPH_*', async () => {
  const found = await problemsOf(
    testWorld(),
    WORKFLOW_A,
    draftOf([read(1), notify(2, 'oi {{b1.resultado}}')]),
    PUBLISHER,
  )
  assert.deepEqual(found.problems, [])
  assert.notEqual(found.ready, null)
})

test('as regras do Conexus: a ordem, o lugar e o campo de cada referência', async () => {
  const found = await codes([
    notify(1, '{{b9.texto}}'),
    ifBalloon(2, 'total', [read(3)], [notify(4, 'x')]),
    notify(5, '{{b3.resultado}} {{b2.x}} {{b1.nada}} {{gatilho.zzz}}'),
  ])
  assert.deepEqual(found.sort(), [
    'IF_FIELD_NOT_NUMBER@b2',
    'REF_BALLOON_UNKNOWN@b1',
    'REF_FIELD_UNKNOWN@b5',
    'REF_FIELD_UNKNOWN@b5',
    'REF_FIELD_UNKNOWN@b5',
    'REF_INSIDE_BRANCH@b5',
  ])
})

test('as regras do Conexus: id repetida, balão sem ligação, Se vazio e kinds que chegam depois', async () => {
  const empty = { ...read(1), connectionId: null, operation: null }
  const found = await codes([
    empty,
    read(1),
    ifBalloon(2, 'x', [], []),
    foreach(3, [notify(4, 'a')]),
  ])
  assert.ok(found.includes('BALLOON_INCOMPLETE@b1'))
  assert.ok(found.includes('DUPLICATE_ID@b1'))
  assert.ok(found.includes('IF_EMPTY@b2'))
  assert.ok(found.includes('BALLOON_KIND_LATER@b3'))
  assert.ok(found.includes('FOREACH_NOT_A_LIST@b3'))
  assert.deepEqual(await codes([]), ['NO_BALLOONS@null'])
})

test('as regras do mundo: a ligação, a classe da operação e o papel de quem publica', async () => {
  const write = { ...read(2), operation: OperationId.parse('lancar') }
  const unknown = { ...read(3), operation: OperationId.parse('nada') }
  assert.deepEqual((await codes([read(1), write, unknown])).sort(), [
    'OPERATION_UNKNOWN@b3',
    'OPERATION_WRONG_CLASS@b2',
  ])
  assert.deepEqual(await codes([read(1)], { offered: async () => [] }), [
    'CONNECTION_NOT_OFFERED@b1',
  ])
  assert.deepEqual(await codes([read(1)], { mayUse: async () => false }), [
    'OPERATION_NOT_IN_ROLE@b1',
  ])
  assert.deepEqual(await codes([read(1)], { speakerOf: async () => undefined }), [
    'OPERATION_NOT_IN_ROLE@b1',
  ])
})
