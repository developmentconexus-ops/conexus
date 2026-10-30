import assert from 'node:assert/strict'
import { test } from 'node:test'
import { appCalls } from './test-app-calls.ts'

test('cada chamada deixa uma linha CONNECTOR_CALLED com escalares; um valor da entrada e da resposta não está no registro', async (t) => {
  const on = await appCalls(t)
  await on.connect('Matriz')
  const answer = Object((await on.read({ input: { page: 0 } })).json())
  const values = answer.value.linhas.flatMap((linha: object) => Object.values(linha).map(String))
  const lines = on.hub.lines.filter((line) => line.message === 'CONNECTOR_CALLED')
  assert.equal(lines.length, 1)
  const [line] = lines
  assert.deepEqual(Object.keys(line?.fields ?? {}).sort(), [
    'by',
    'bytes',
    'companyId',
    'connectionId',
    'connector',
    'ms',
    'operation',
    'projectId',
    'queuedMs',
    'result',
  ])
  assert.deepEqual(
    [line?.fields.by, line?.fields.connector, line?.fields.operation, line?.fields.result],
    ['app', 'sankhya', 'empresas', 'OK'],
  )
  const logged = JSON.stringify(on.hub.lines)
  for (const value of values.filter((each: string) => each.length > 3))
    assert.ok(!logged.includes(value), `${value} is in the log`)
})

test('a linha da segunda chamada em fila diz quanto esperou, e a primeira não esperou', async (t) => {
  const on = await appCalls(t)
  await on.connect('Matriz')
  on.fake.switches.delayMilliseconds = 150
  await Promise.all([on.read(), on.read()])
  const waits = on.hub.lines
    .filter((line) => line.message === 'CONNECTOR_CALLED')
    .map((line) => Number(line.fields.queuedMs))
    .sort((x, y) => x - y)
  assert.equal(waits.length, 2)
  assert.ok((waits[0] ?? 1) < 50, `${waits[0]} ms: the first call did not wait`)
  assert.ok((waits[1] ?? 0) >= 100, `${waits[1]} ms: the second waited for the first`)
})
