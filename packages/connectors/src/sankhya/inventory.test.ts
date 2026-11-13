import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { readToken, tokenRequest } from '../kernel/auth.ts'
import { SENT_AT } from '../kernel/conformance-declared.ts'
import type { InventoryEntry, InventoryPage } from '../kernel/inventory.ts'
import { declaredInventory } from '../kernel/inventory.ts'
import { requestOf } from '../kernel/operation.ts'
import { toRequest } from '../kernel/request.ts'
import { sankhya } from './definition.ts'
import { sankhyaFake } from './fake.ts'
import { inventoryStatement, lerInventario } from './inventory.ts'
import { isOneReadStatement } from './read-only-sql.ts'

/** Every page of the double's dictionary, `limit` rows each. */
async function dictionary(limit: number): Promise<{ entries: InventoryEntry[]; pages: number }> {
  const fake = sankhyaFake()
  const login = await fake.handle(
    toRequest(sankhya, tokenRequest(sankhya.auth, fake.credential), null),
  )
  const token = readToken(sankhya.auth, { status: login.status, body: await login.json() })
  assert.equal(token.kind, 'OK')
  if (token.kind !== 'OK') throw new Error('no token')
  const entries: InventoryEntry[] = []
  let cursor: string | null = null
  let pages = 0
  do {
    const request = requestOf(lerInventario, { cursor, limit }, { ref: null }, SENT_AT)
    assert.ok(isOneReadStatement(inventoryStatement({ cursor, limit })))
    const response = await fake.handle(toRequest(sankhya, request, token.accessToken))
    const answered = lerInventario.answer({
      status: response.status,
      body: z.unknown().parse(await response.json()),
    })
    assert.equal(answered.kind, 'OK', JSON.stringify(answered))
    if (answered.kind !== 'OK') throw new Error('not OK')
    const page: InventoryPage = answered.value
    entries.push(...page.entries)
    cursor = page.next
    pages += 1
  } while (cursor !== null && pages < 50)
  return { entries, pages }
}

test('o dicionário do dublê, em fases e em ordem de chave', async () => {
  const whole = await dictionary(500)
  const split = await dictionary(2)
  assert.deepEqual(split.entries, whole.entries, 'o tamanho da página não muda o que se lê')
  assert.ok(split.pages > whole.pages)
  function kinds(kind: string) {
    return whole.entries.filter((entry) => entry.kind === kind)
  }
  assert.equal(kinds('TABLE').length, 6)
  assert.equal(kinds('FIELD').length, 7)
  assert.equal(kinds('CODE').length, 7)
  assert.deepEqual(
    kinds('FIELD')
      .filter((entry) => entry.custom)
      .map((entry) => entry.name),
    ['AD_METAS.META', 'TGFCAB.AD_CANAL'],
  )
  assert.deepEqual(
    kinds('CODE').find((entry) => entry.name === 'TGFCAB.TIPMOV=V'),
    {
      kind: 'CODE',
      name: 'TGFCAB.TIPMOV=V',
      type: null,
      label: 'Venda',
      custom: false,
    },
  )
})

test('o conector sem dicionário declara só as suas operações', () => {
  const entries = declaredInventory({ ...sankhya, inventory: undefined })
  assert.ok(entries.length > 0)
  assert.ok(entries.every((entry) => entry.kind === 'OPERATION' && !entry.custom))
})

test('um cursor que não é o do kit é recusado antes de virar SQL', () => {
  assert.equal(lerInventario.input.safeParse({ cursor: 'x', limit: 5 }).success, false)
  assert.equal(
    lerInventario.input.safeParse({ cursor: '{"phase":"FIELD","after":["A"]}', limit: 5 }).success,
    true,
  )
})
