import assert from 'node:assert/strict'
import { test } from 'node:test'
import { answerOf } from './company-postgres.ts'

test('um erro do banco recusa só com os nomes; sem código ou com a conexão perdida é silêncio', () => {
  const error = {
    code: '23505',
    table: 'encomenda',
    constraint: 'k',
    detail: 'Key (whatsapp)=((11) 99999-0000) is duplicated.',
  }
  const refused = answerOf(error)
  assert.equal(refused.kind, 'REFUSED')
  assert.ok(!JSON.stringify(refused).includes('99999'))
  assert.deepEqual(answerOf(undefined), { kind: 'NO_ANSWER' })
  assert.deepEqual(answerOf({}), { kind: 'NO_ANSWER' })
  assert.deepEqual(answerOf({ code: '08006' }), { kind: 'NO_ANSWER' })
})
