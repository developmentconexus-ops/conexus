import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { test } from 'node:test'
import type { SealContext } from './seal.ts'
import { open, parseSealKeys, seal } from './seal.ts'
import { Secret } from './secret.ts'

const PLANTED = 'sk-ant-planted-0001'
const ROW: SealContext = {
  purpose: 'model-account',
  rowId: '7f9c2a10-0000-4000-8000-000000000001',
  companyId: 'company-a',
  personId: null,
  kind: 'api_key',
  provider: 'anthropic',
}

function keyLine(id: string): string {
  return `${id}:${randomBytes(32).toString('base64')}`
}

function refused(work: () => unknown) {
  assert.throws(work, (error: unknown) => {
    assert.equal(Reflect.get(Object(error), 'code'), 'SEAL_REFUSED')
    return true
  })
}

test('lacre: abre na mesma linha e não se imprime', () => {
  const keys = parseSealKeys(keyLine('k1'))
  const sealed = seal(keys, ROW, new Secret('Credential', PLANTED))
  assert.equal(sealed.keyId, 'k1')
  assert.ok(!Buffer.from(sealed.blob).toString('latin1').includes(PLANTED))
  const opened = open(keys, ROW, sealed)
  assert.equal(opened.reveal(), PLANTED)
  assert.equal(JSON.stringify({ opened }), '{"opened":"[Credential]"}')
})

test('lacre: outra linha, empresa, dono, tipo, fornecedor ou propósito não abre', () => {
  const keys = parseSealKeys(keyLine('k1'))
  const sealed = seal(keys, ROW, new Secret('Credential', PLANTED))
  const others: SealContext[] = [
    { ...ROW, rowId: '7f9c2a10-0000-4000-8000-000000000002' },
    { ...ROW, companyId: 'company-b' },
    { ...ROW, personId: 'person-a' },
    { ...ROW, kind: 'claude_subscription' },
    { ...ROW, provider: 'openai' },
    { ...ROW, purpose: 'model-account-sign-in' },
  ]
  for (const other of others) refused(() => open(keys, other, sealed))
})

test('lacre: um bit virado em qualquer parte é recusado', () => {
  const keys = parseSealKeys(keyLine('k1'))
  const sealed = seal(keys, ROW, new Secret('Credential', PLANTED))
  for (const at of [0, 12, 28, sealed.blob.length - 1]) {
    const blob = Buffer.from(sealed.blob)
    blob[at] = (blob[at] ?? 0) ^ 1
    refused(() => open(keys, ROW, { keyId: 'k1', blob }))
  }
  refused(() => open(keys, ROW, { keyId: 'k1', blob: Buffer.from(sealed.blob).subarray(0, 27) }))
})

test('lacre: a chave aposentada abre; relacrado, a antiga sai sem perda', () => {
  const old = keyLine('k1')
  const current = keyLine('k2')
  const before = seal(parseSealKeys(old), ROW, new Secret('Credential', PLANTED))
  // Phase two: the new key is the last line, the old one only opens.
  const both = parseSealKeys(`${old}\n${current}\n`)
  assert.equal(open(both, ROW, before).reveal(), PLANTED)
  const resealed = seal(both, ROW, open(both, ROW, before))
  assert.equal(resealed.keyId, 'k2')
  // Phase three: the old line leaves; what was resealed opens, what was not is refused.
  const after = parseSealKeys(current)
  assert.equal(open(after, ROW, resealed).reveal(), PLANTED)
  refused(() => open(after, ROW, before))
})

test('lacre: o arquivo de chaves só aceita linhas id:base64 de 32 bytes, sem id repetido', () => {
  for (const text of [
    '',
    'k1',
    `k1:${randomBytes(31).toString('base64')}`,
    `k1:${randomBytes(33).toString('base64')}`,
    `k 1:${randomBytes(32).toString('base64')}`,
    `${keyLine('k1')}\n${keyLine('k1')}`,
    `k1:${randomBytes(32).toString('base64url')}x`,
  ]) {
    assert.throws(() => parseSealKeys(text), TypeError)
  }
  assert.equal(parseSealKeys(`${keyLine('a')}\n\n${keyLine('b')}\n`).sealingId, 'b')
})
