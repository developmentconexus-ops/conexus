import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseExact, parseJson } from '../index.ts'

const BODY = Buffer.from(
  '{"grande":12345678901234567890,"nota":1234567890123.123456,"inteiro":201,"negativo":-7,"exp":1e3,"texto":"9.5","lista":[0.1,null,true]}',
)

test('o número grande e a fração chegam como o texto que vieram; o inteiro que cabe fica número', () => {
  const text = BODY.toString('utf8')
  assert.equal(JSON.parse(text).grande, 12345678901234567000, 'JSON.parse cuts it')
  assert.deepEqual(parseExact(text), {
    grande: '12345678901234567890',
    nota: '1234567890123.123456',
    inteiro: 201,
    negativo: -7,
    exp: '1e3',
    texto: '9.5',
    lista: ['0.1', null, true],
  })
  assert.deepEqual(parseJson(text, 'DOUBLE'), JSON.parse(text))
  assert.deepEqual(parseJson(text, 'EXACT'), parseExact(text))
  assert.throws(() => parseExact('{"a":'), SyntaxError)
})
