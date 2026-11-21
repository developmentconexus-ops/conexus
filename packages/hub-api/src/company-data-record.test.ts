import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CompanyData } from './company-data.ts'
import { companyData } from './company-data.ts'
import { LAWS_AT } from './company-data-conformance.ts'
import {
  recordsEveryReadOnce,
  returnsNothingUnrecorded,
} from './company-data-record-conformance.ts'
import type { DataWorld } from './company-data-world.ts'
import { fakeWorld } from './test-company-data-world.ts'

function boundOf(world: DataWorld): CompanyData {
  assert.ok(world.data, 'the fake world binds its contract')
  return world.data
}

test('a lei de uma linha por leitura falha com o Registro que não grava ou que guarda uma célula', async () => {
  const silent: DataWorld = { ...fakeWorld(), reads: async () => [] }
  await assert.rejects(recordsEveryReadOnce(silent, boundOf(silent)), /one row/)
  const world = fakeWorld()
  const leaky: DataWorld = {
    ...world,
    async reads() {
      return (await world.reads()).map((row) => ({ ...row, guardado: 'o total foi 10.00' }))
    },
  }
  await assert.rejects(recordsEveryReadOnce(leaky, boundOf(leaky)), /a row holds the value 10\.00/)
})

test('a lei da gravação derrubada falha com o contrato que devolve sem gravar', async () => {
  const world = fakeWorld()
  const careless: DataWorld = {
    ...world,
    data: companyData({ sources: world.sources, now: () => LAWS_AT }),
  }
  await assert.rejects(returnsNothingUnrecorded(careless, boundOf(careless)), assert.AssertionError)
})
