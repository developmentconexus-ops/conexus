import assert from 'node:assert/strict'
import { test } from 'node:test'
import { APP_DATA_TOOL } from '@conexus/hub-api'
import { BUILDER_ROOM } from './room.ts'
import { presentTool, toolStatus } from './tool-registry.ts'

function row(toolName: string, result: unknown, args: object = { sql: 'select 1' }) {
  const tool = { toolName, args, result, state: 'result', isError: false } as const
  const status = toolStatus(tool, BUILDER_ROOM)
  return { status, presented: presentTool(tool, status, BUILDER_ROOM) }
}

test('as linhas de conferir e de ver: a contagem, a leitura sem linha e a recusa como falha', () => {
  const counted = row(APP_DATA_TOOL.check, {
    kind: 'COUNTED',
    rows: { kind: 'EXACT', rows: 38 },
    columns: [{ name: 'id', type: 'integer' }],
    ms: 40,
  })
  assert.equal(counted.status, 'done')
  assert.equal(counted.presented.sentence, 'Conferiu uma leitura do app')
  assert.equal(counted.presented.detail, '38 linhas')
  const over = row(APP_DATA_TOOL.check, {
    kind: 'COUNTED',
    rows: { kind: 'OVER' },
    columns: [],
    ms: 1,
  })
  assert.equal(over.presented.detail, 'mais de 10.000 linhas')
  const one = row(APP_DATA_TOOL.check, {
    kind: 'COUNTED',
    rows: { kind: 'EXACT', rows: 1 },
    columns: [],
    ms: 1,
  })
  assert.equal(one.presented.detail, '1 linha')
  const none = row(APP_DATA_TOOL.check, {
    kind: 'COUNTED',
    rows: { kind: 'EXACT', rows: 0 },
    columns: [],
    ms: 1,
  })
  assert.equal(none.presented.detail, 'Nenhuma linha.')

  const refused = row(APP_DATA_TOOL.check, {
    kind: 'REFUSED',
    code: 'APP_DATA_REFUSED',
    sqlstate: '42P01',
  })
  assert.equal(refused.status, 'error')
  assert.equal(refused.presented.sentence, 'Não conseguiu conferir a leitura')
  const notCount = row(APP_DATA_TOOL.check, { kind: 'FAILED', code: 'CHECK_NOT_A_COUNT' })
  assert.equal(notCount.status, 'error')

  const read = row(APP_DATA_TOOL.read, { kind: 'ROWS', columns: ['id'], rows: [], complete: true })
  assert.equal(read.status, 'done')
  assert.equal(read.presented.sentence, 'Consultou os dados do app')
  const readRefused = row(APP_DATA_TOOL.read, {
    kind: 'REFUSED',
    code: 'APP_DATA_REFUSED',
    sqlstate: '42P01',
  })
  assert.equal(readRefused.status, 'error')
  assert.equal(readRefused.presented.sentence, 'Não conseguiu consultar os dados do app')
})
