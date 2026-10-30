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
