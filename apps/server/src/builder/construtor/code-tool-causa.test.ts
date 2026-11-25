import assert from 'node:assert/strict'
import { test } from 'node:test'
import { endOf } from '../../harness/routes/test-conversation.ts'
import { tool } from '../../harness/routes/test-questions.ts'
import { call } from '../../hub/identity/test-hub.ts'
import { answerOf, saving, searching } from './test-code-tool.ts'
import { building, keeping } from './test-construtor.ts'

test('sem connectionId o Construtor recebe a causa em palavras: precisa de connectionId e de leituras em reads, e onde liberar uma ligação', async (t) => {
  const answers: Record<string, unknown>[] = []
  const { connectionId: _omitted, ...withoutConnection } = saving('')
  const on = await building(t, [
    () => [tool('tool_code_save', withoutConnection)],
    keeping(answers),
  ])
  assert.equal(
    endOf(await on.conversation.say('Crie uma ferramenta que formata datas')),
    'complete',
  )

  const refused = answerOf(answers)
  assert.equal(refused.kind, 'REFUSED')
  if (refused.kind !== 'REFUSED') return
  assert.equal(refused.code, 'REQUEST_MALFORMED')
  assert.equal(refused.field, 'connectionId')
  assert.match(String(refused.output), /connectionId/)
  assert.match(String(refused.output), /reads/)
  assert.match(String(refused.output), /Integrações do Projeto.*Liberar para ler/)
  const listed = await call(on.hub, on.ana, 'GET', on.tools)
  assert.deepEqual(Object(listed.json()).tools, [])
})

test('a leitura que a fonte recusa no teste leva ao Construtor a resposta da fonte, e a pessoa não a vê', async (t) => {
  const answers: Record<string, unknown>[] = []
  const known = { matriz: '' }
  const on = await building(t, [
    ...searching(known, { samples: { pedidos: { codigoEmpresa: 'não é número', page: 1 } } }),
    keeping(answers),
  ])
  assert.equal(endOf(await on.conversation.say('Crie')), 'complete')

  const refused = answerOf(answers)
  assert.equal(refused.kind, 'REFUSED', JSON.stringify(answers))
  if (refused.kind !== 'REFUSED') return
  assert.equal(refused.code, 'TOOL_TEST_FAILED')
  assert.match(String(refused.output), /READ_FAILED/)
  assert.match(String(refused.output), /codigoEmpresa: Invalid input: expected number/)
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
  assert.match(String(Object(refused).output), /Integrações do Projeto.*Liberar para ler/)
  const listed = await call(on.hub, on.ana, 'GET', on.tools)
  assert.deepEqual(Object(listed.json()).tools, [])
})
