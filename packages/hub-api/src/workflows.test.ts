import assert from 'node:assert/strict'
import { test } from 'node:test'
import { FAILURES } from './failures.ts'
import { ToolCallId } from './questions.ts'
import { WORKFLOW_FAILURES } from './workflow-failures.ts'
import { BalloonAddress, BalloonId, balloonCallKeyOf } from './workflow-ids.ts'
import {
  BALLOONS_SCHEMA_MAX,
  Balloon,
  Trigger,
  WorkflowDraft,
  WorkflowFailureCode,
} from './workflows.ts'

function leaf(id: string) {
  return { kind: 'NOTIFY', id, title: 'Avisar', people: [], message: 'oi' }
}

function draft(balloons: unknown[]) {
  return { name: 'Pedidos', trigger: { kind: 'MANUAL' }, balloons }
}

function ifBalloon(id: string, yes: unknown[], no: unknown[], than: number | null) {
  return {
    kind: 'IF',
    id,
    title: 'Se',
    when: { field: 'total', op: 'gt', than },
    // biome-ignore lint/suspicious/noThenProperty: `then` is the "se sim" path of the document under test
    then: yes,
    else: no,
  }
}

test('o documento é recursivo: um Se leva caminhos de balões, e um caminho leva outro Se', () => {
  const nested = ifBalloon(
    'b1',
    [leaf('b2'), ifBalloon('b3', [leaf('b4')], [], null)],
    [leaf('b5')],
    10,
  )
  const read = WorkflowDraft.parse(draft([nested]))
  assert.deepEqual(read.balloons, [nested])
})

test('o documento recusa o que o esquema não aceita, e aceita o balão incompleto do "+"', () => {
  assert.equal(Balloon.safeParse({ ...leaf('b1'), kind: 'OUTRO' }).success, false)
  assert.equal(Balloon.safeParse(leaf('balao')).success, false)
  assert.equal(
    WorkflowDraft.safeParse(draft([{ kind: 'PARALLEL', id: 'b1', title: 'P', paths: [[]] }]))
      .success,
    false,
  )
  assert.equal(
    Balloon.safeParse({
      kind: 'READ',
      id: 'b1',
      title: 'Ler',
      connectionId: null,
      operation: null,
      input: {},
    }).success,
    true,
  )
  assert.equal(
    WorkflowDraft.safeParse(
      draft(Array.from({ length: BALLOONS_SCHEMA_MAX + 1 }, (_, i) => leaf(`b${i}`))),
    ).success,
    false,
  )
})

test('o gatilho: a cadência é a da 24.2, e só há horário e manual', () => {
  assert.equal(
    Trigger.safeParse({ kind: 'SCHEDULE', cadence: { kind: 'DAILY', time: '08:00' } }).success,
    true,
  )
  assert.equal(
    Trigger.safeParse({ kind: 'SCHEDULE', cadence: { kind: 'DAILY', time: '25:00' } }).success,
    false,
  )
  assert.equal(Trigger.safeParse({ kind: 'MANUAL' }).success, true)
  assert.equal(Trigger.safeParse({ kind: 'CONNECTOR' }).success, false)
})

test('o Repetir tem só um inteiro positivo, sem teto e sem padrão', () => {
  function loop(max: unknown) {
    return {
      kind: 'LOOP',
      id: 'b1',
      title: 'Repetir',
      until: { field: 'x', op: 'eq', than: 1 },
      max,
      body: [],
    }
  }
  assert.equal(Balloon.safeParse(loop(100000)).success, true)
  assert.equal(Balloon.safeParse(loop(0)).success, false)
  assert.equal(Balloon.safeParse({ ...loop(1), max: undefined }).success, false)
})

test('as marcas de id: o endereço, a chave da escrita e a do agente', () => {
  const address = BalloonAddress.parse('b7_0.b3')
  assert.equal(balloonCallKeyOf(address, 1), 'b7_0.b3#1')
  assert.equal(
    balloonCallKeyOf(BalloonAddress.parse('b3'), 0, ToolCallId.parse('call_1')),
    'b3#0#call_1',
  )
  assert.equal(BalloonId.safeParse('b1000').success, false)
})

test('as falhas dos workflows estão no registro, e as de balão são códigos que ele conhece', () => {
  for (const code of Object.keys(WORKFLOW_FAILURES))
    assert.equal(Object.hasOwn(FAILURES, code), true, code)
  assert.equal(WorkflowFailureCode.safeParse('WORKFLOW_LOOP_LIMIT').success, true)
  assert.equal(WorkflowFailureCode.safeParse('OUTRA').success, false)
})
