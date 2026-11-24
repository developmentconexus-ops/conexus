import assert from 'node:assert/strict'
import { test } from 'node:test'
import { TASK_TOOLS } from '@conexus/hub-api'
import { invocationToItem, waitsOnPerson } from './rows.ts'
import { PLAN_DENIED, QUESTION_ABORTED, QUESTION_DENIED } from './tool-fixtures.ts'

test('pergunta ou plano fechado pelo Mastra fica fechado, nunca aberto', () => {
  for (const denied of [QUESTION_DENIED, PLAN_DENIED]) {
    const closed = invocationToItem(denied, undefined)
    assert.equal(closed?.kind, 'card')
    assert.equal(closed.state, 'closed')
    assert.equal(waitsOnPerson([closed]), false)
  }
})

test('uma chamada sem o que espera não desenha cartão; com o que espera, abre', () => {
  const calling = { ...QUESTION_DENIED, state: 'call' } as const
  assert.equal(invocationToItem(calling, undefined), null)
  const open = invocationToItem(calling, {
    toolCallId: calling.toolCallId,
    toolName: calling.toolName,
    args: calling.args,
    suspendPayload: calling.args,
  })
  assert.equal(open?.kind, 'card')
  assert.equal(open.state, 'open')
  assert.equal(waitsOnPerson([open]), true)
})

test('as ferramentas de tarefas não desenham linha: o painel as mostra', () => {
  for (const toolName of TASK_TOOLS) {
    const call = { state: 'result', toolCallId: 'toolu_task', toolName, args: {} } as const
    assert.equal(invocationToItem(call, undefined), null, toolName)
  }
})

test('pergunta que o Mastra fechou porque a pessoa parou fica parada, relida ou ao vivo; a vencida fica fechada', () => {
  const stopped = invocationToItem(QUESTION_ABORTED, undefined)
  assert.equal(stopped?.kind, 'card')
  assert.equal(stopped.state, 'stopped')
  assert.equal(waitsOnPerson([stopped]), false)
})
