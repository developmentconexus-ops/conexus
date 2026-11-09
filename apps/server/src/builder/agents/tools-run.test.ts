import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BalloonCallKey } from '@conexus/hub-api'
import { markOf } from '../../hub/connectors/public.ts'
import { writingInARun } from './test-run-write.ts'

test('o agente num workflow: com a chamada da execução a escrita vai ao livro da execução com a chave b3#0#<toolCallId>, e sem ela, ao da conversa', async (t) => {
  const { on, call } = await writingInARun(t)
  assert.equal(Object(await call(0, 'call-a')).kind, 'OK')
  assert.equal(Object(await call(undefined, 'call-b')).kind, 'OK')
  const [run, conversation] = await on.ledger()
  assert.equal(run?.thread_id, on.runId)
  assert.equal(run?.tool_call_id, 'b3#0#call-a')
  assert.equal(conversation?.tool_call_id, 'call-b')
  assert.notEqual(conversation?.thread_id, on.runId)
  assert.equal(
    on.fake.orders()[0]?.observacao,
    markOf(on.runId, BalloonCallKey.parse('b3#0#call-a')),
  )
})

test('o agente num workflow: uma segunda conversa do mesmo balão na tentativa 1 encontra a linha incerta da tentativa 0 e pergunta, sem enviar', async (t) => {
  const { on, call, asks } = await writingInARun(t)
  await call(0, 'call-a')
  await on.hub.test.asOwner(
    "update connectors.connector_write set state = 'UNCERTAIN', answer = null",
  )
  const posts = on.mode.posts
  assert.equal(await asks(1), true)
  const second = Object(await call(1, 'call-b'))
  assert.equal(second.kind, 'WRITE_OPEN')
  assert.equal(second.mark, markOf(on.runId, BalloonCallKey.parse('b3#0#call-a')))
  assert.equal(on.mode.posts, posts)
})

test('o portão da escrita do agente numa execução: pergunta com a linha aberta da tentativa 0, e não pergunta na execução sem linha aberta', async (t) => {
  const { on, call, asks } = await writingInARun(t)
  assert.equal(await asks(0), false)
  await call(0, 'call-a')
  await on.hub.test.asOwner(
    "update connectors.connector_write set state = 'SENDING', answer = null",
  )
  assert.equal(await asks(1), true)
  assert.equal(await asks(undefined), true)
})

test('o agente num workflow, como versão publicada: grava no livro da execução com o autor VERSION, e o portão lê a execução', async (t) => {
  const { on, call, asks } = await writingInARun(t, 'VERSION')
  assert.equal(await asks(0), false)
  assert.equal(Object(await call(0, 'call-a')).kind, 'OK')
  const [row] = await on.ledger()
  assert.equal(row?.thread_id, on.runId)
  assert.equal(row?.tool_call_id, 'b3#0#call-a')
  assert.equal(row?.agent_id, on.agentId)
  assert.equal(row?.workflow_id, null)
  await on.hub.test.asOwner(
    "update connectors.connector_write set state = 'UNCERTAIN', answer = null",
  )
  assert.equal(await asks(1), true)
})

test('a chamada da execução malformada não vira escrita da conversa: a ferramenta falha e nada é gravado', async (t) => {
  const { on, callMalformed } = await writingInARun(t)
  await assert.rejects(Promise.resolve(callMalformed()))
  assert.deepEqual(await on.ledger(), [])
})
