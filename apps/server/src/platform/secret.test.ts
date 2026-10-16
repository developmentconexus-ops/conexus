import assert from 'node:assert/strict'
import { test } from 'node:test'
import { inspect } from 'node:util'
import { Secret } from './secret.ts'

test('um segredo impresso, serializado ou inspecionado mostra só o nome', () => {
  const secret = new Secret('MailToken', 'valor-secreto')
  assert.equal(String(secret), '[MailToken]')
  assert.equal(`${secret}`, '[MailToken]')
  assert.equal(JSON.stringify({ token: secret }), '{"token":"[MailToken]"}')
  assert.doesNotMatch(inspect(secret), /valor-secreto/)
  assert.equal(secret.reveal(), 'valor-secreto')
})
