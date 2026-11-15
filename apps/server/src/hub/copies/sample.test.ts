import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { CopySample } from '@conexus/hub-api'
import { call, codeOf, memberOn, personOn } from '../identity/test-hub.ts'
import type { CopiesOn } from './test-copies.ts'
import { asSync, copiesOn } from './test-copies.ts'
import { copiesUrl, enabled, firstEnded } from './test-routes.ts'

async function people(on: CopiesOn) {
  const { hub, companyId } = on
  return {
    admin: await memberOn(hub, companyId, { name: 'Bia Reis', email: 'bia@example.test' }, 'admin'),
    developer: await memberOn(
      hub,
      companyId,
      { name: 'Davi Costa', email: 'davi@example.test' },
      'developer',
    ),
    outsider: await personOn(hub, { name: 'Edu Lima', email: 'edu@example.test' }),
  }
}

function sample(on: CopiesOn, person: Parameters<typeof call>[1], copyId: string) {
  return call(on.hub, person, 'GET', `${copiesUrl(on)}/${copyId}/sample`)
}

test('a amostra: dono e administrador veem 5 linhas e a marca de que há mais', async (t) => {
  const on = await copiesOn(t)
  const others = await people(on)
  const copy = await enabled(on, 'vendas')
  await firstEnded(on, copy.id)
  for (const person of [on.ana, others.admin]) {
    const read = await sample(on, person, copy.id)
    assert.equal(read.statusCode, 200, read.body)
    const shown = CopySample.parse(Object(read.json()).sample)
    assert.equal(shown.rows.length, 5)
    assert.equal(shown.complete, false)
    assert.ok(shown.columns.length > 0)
    assert.ok(shown.columns.every((name) => !name.startsWith('_')))
    assert.ok(shown.rows.every((row) => row.length === shown.columns.length))
  }
})

test('a amostra: desenvolvedor, membro e quem é de fora recebem não encontrado', async (t) => {
  const on = await copiesOn(t)
  const others = await people(on)
  const copy = await enabled(on, 'vendas')
  await firstEnded(on, copy.id)
  for (const person of [others.developer, on.carla, others.outsider]) {
    const read = await sample(on, person, copy.id)
    assert.deepEqual([read.statusCode, codeOf(read)], [404, 'NOT_FOUND'])
  }
})

test('a amostra antes da primeira rodada', async (t) => {
  const on = await copiesOn(t)
  const copy = await enabled(on, 'vendas')
  await firstEnded(on, copy.id)
  await asSync(on.owner, (client) => client.query(`DROP TABLE sync.${copy.name}`))
  const read = await sample(on, on.ana, copy.id)
  assert.equal(read.statusCode, 200, read.body)
  const shown = CopySample.parse(Object(read.json()).sample)
  assert.deepEqual([shown.rows, shown.complete], [[], true])
  assert.ok(shown.columns.length > 0)
})

test('a amostra refaz o login de leitura', async (t) => {
  const on = await copiesOn(t)
  const copy = await enabled(on, 'vendas')
  await firstEnded(on, copy.id)
  const postgres = on.hub.postgres.companyPostgres
  const made = t.mock.method(postgres, 'ensureReader')
  const read = postgres.readCopies.bind(postgres)
  let first = true
  t.mock.method(
    postgres,
    'readCopies',
    (...args: Parameters<typeof read>): ReturnType<typeof read> => {
      if (!first) return read(...args)
      first = false
      return Promise.resolve({ kind: 'NO_LOGIN' })
    },
  )
  const answered = await sample(on, on.ana, copy.id)
  assert.equal(answered.statusCode, 200, answered.body)
  assert.equal(CopySample.parse(Object(answered.json()).sample).rows.length, 5)
  assert.equal(on.hub.lines.filter((line) => line.message === 'COPY_READER_MADE').length, 1)
  assert.equal(made.mock.callCount(), 1)
})

test('a amostra de uma empresa cuja cópia veio antes do login de leitura', async (t) => {
  const on = await copiesOn(t)
  const copy = await enabled(on, 'vendas')
  await firstEnded(on, copy.id)
  await asSync(on.owner, (client) => client.query('REVOKE USAGE ON SCHEMA sync FROM conexus_read'))
  const before = await sample(on, on.ana, copy.id)
  assert.deepEqual([before.statusCode, codeOf(before)], [503, 'COPY_DATABASE_UNAVAILABLE'])
  await on.run(copy.id)
  const answered = await sample(on, on.ana, copy.id)
  assert.equal(answered.statusCode, 200, answered.body)
  assert.equal(CopySample.parse(Object(answered.json()).sample).rows.length, 5)
  assert.equal(on.hub.lines.filter((line) => line.message === 'COPY_READER_MADE').length, 0)
})

test('a amostra, com a leitura calada até o login existir, é atendida depois da rodada', async (t) => {
  const on = await copiesOn(t)
  const copy = await enabled(on, 'vendas')
  await firstEnded(on, copy.id)
  const postgres = on.hub.postgres.companyPostgres
  const made = t.mock.method(postgres, 'ensureReader')
  const read = postgres.readCopies.bind(postgres)
  t.mock.method(postgres, 'readCopies', async (...args: Parameters<typeof read>) =>
    made.mock.callCount() === 0 ? { kind: 'UNAVAILABLE' as const } : read(...args),
  )
  await on.run(copy.id)
  const answered = await sample(on, on.ana, copy.id)
  assert.equal(answered.statusCode, 200, answered.body)
})

test('a amostra com o banco calado', async (t) => {
  const on = await copiesOn(t)
  const copy = await enabled(on, 'vendas')
  await firstEnded(on, copy.id)
  t.mock.method(on.hub.postgres.companyPostgres, 'readCopies', async () => ({
    kind: 'UNAVAILABLE' as const,
  }))
  const read = await sample(on, on.ana, copy.id)
  assert.deepEqual([read.statusCode, codeOf(read)], [503, 'COPY_DATABASE_UNAVAILABLE'])
  assert.ok(on.hub.lines.some((line) => line.message === 'COPY_SAMPLE_FAILED'))
})

test('a amostra de uma cópia que não existe', async (t) => {
  const on = await copiesOn(t)
  const read = await sample(on, on.ana, randomUUID())
  assert.deepEqual([read.statusCode, codeOf(read)], [404, 'COPY_NOT_FOUND'])
})

test('a amostra de uma tabela com até 5 linhas está completa', async (t) => {
  const on = await copiesOn(t)
  const copy = await enabled(on, 'vendas')
  await firstEnded(on, copy.id)
  for (const kept of [5, 3]) {
    await asSync(on.owner, (client) =>
      client.query(
        `DELETE FROM sync.${copy.name} WHERE ctid NOT IN (SELECT ctid FROM sync.${copy.name} LIMIT ${kept})`,
      ),
    )
    const read = await sample(on, on.ana, copy.id)
    assert.equal(read.statusCode, 200, read.body)
    const shown = CopySample.parse(Object(read.json()).sample)
    assert.deepEqual([shown.rows.length, shown.complete], [kept, true])
  }
})

test('a amostra do modelo clientes mostra o CPF ou CNPJ que o Sankhya mandou', async (t) => {
  const on = await copiesOn(t)
  const copy = await enabled(on, 'clientes')
  await firstEnded(on, copy.id)
  const read = await sample(on, on.ana, copy.id)
  assert.equal(read.statusCode, 200, read.body)
  const shown = CopySample.parse(Object(read.json()).sample)
  const at = shown.columns.indexOf('CGC_CPF')
  assert.notEqual(at, -1, shown.columns.join(','))
  assert.ok(
    shown.rows.some((row) => /^\d{11,14}$/.test(String(row[at] ?? ''))),
    JSON.stringify(shown.rows),
  )
})
