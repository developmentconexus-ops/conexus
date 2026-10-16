import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseLogLine } from './log-line.ts'

test('uma linha de registro com um level do pino e um msg código é aceita', () => {
  assert.deepEqual(parseLogLine('{"level":30,"msg":"LISTENING","port":1}'), {
    level: 30,
    msg: 'LISTENING',
    port: 1,
  })
})

test('um level ou msg aninhado não conta, e o espaço antes dos dois pontos também não', () => {
  assert.notEqual(
    parseLogLine('{"level":30,"msg":"A","err":{"level":"x","msg":["y"]},"s":"{\\"level\\":1}"}'),
    undefined,
  )
  assert.notEqual(parseLogLine('{"level" : 30,"msg" : "A"}'), undefined)
})

const REFUSED: Record<string, string> = {
  'texto que não é JSON': 'raw text',
  'um array': '[{"level":30,"msg":"A"}]',
  'level repetido': '{"level":30,"level":30,"msg":"A"}',
  'msg repetido': '{"level":30,"msg":"A","msg":"A"}',
  'sem level': '{"msg":"A"}',
  'sem msg': '{"level":30}',
  'level nulo': '{"level":null,"msg":"A"}',
  'level objeto': '{"level":{},"msg":"A"}',
  'level texto': '{"level":"info","msg":"A"}',
  'level fora da escala do pino': '{"level":35,"msg":"A"}',
  'msg lista': '{"level":30,"msg":["A"]}',
  'msg número': '{"level":30,"msg":1}',
  'msg que não é código': '{"level":30,"msg":"not a code"}',
}

for (const [name, text] of Object.entries(REFUSED)) {
  test(`recusa ${name}`, () => {
    assert.equal(parseLogLine(text), undefined)
  })
}
