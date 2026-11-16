import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { ProjectId } from '@conexus/hub-api'
import type { DatabaseUrl } from './test-role-readers.ts'
import {
  applied,
  companyOf,
  grantsOf,
  ledgerOf,
  libraryRole,
  loginExists,
  loginOf,
  postgres,
  ticketOf,
} from './test-role-readers.ts'

type Wanted = Parameters<typeof postgres.reconcileReaders>[2]

const LAPS = 20

async function crossed(owner: DatabaseUrl, older: Wanted, newer: Wanted, lap: number) {
  const [t1, t2] = [await ticketOf(owner), await ticketOf(owner)]
  const [first, second] = await Promise.all([
    postgres.reconcileReaders(owner, t1, older),
    postgres.reconcileReaders(owner, t2, newer),
  ])
  assert.ok(
    second.kind === 'DONE' && ['DONE', 'SUPERSEDED'].includes(first.kind),
    `volta ${lap}: ${JSON.stringify([first, second])}`,
  )
  assert.deepEqual(await ledgerOf(owner), [{ single: true, ticket: t2.toString() }])
}

async function heldBy(owner: DatabaseUrl, login: string) {
  return (await grantsOf(owner)).tables.filter((row) => JSON.stringify(row).includes(login))
}

async function project(t: TestContext) {
  const { owner, sync } = await companyOf(t)
  const projectId = ProjectId.parse(randomBytes(16).toString('hex').replace(/^./, 'P'))
  assert.equal((await postgres.ensureApp(owner, projectId)).kind, 'DONE')
  return { owner, sync, projectId }
}

test('duas reconciliações, grantCopy e revokeCopy ao mesmo tempo terminam sem erro', async (t) => {
  const { owner, sync, projectId } = await project(t)
  for (let lap = 0; lap < LAPS; lap++) {
    const vendas = libraryRole()
    const a = [{ roleId: vendas, tables: ['a'] }]
    const b = [{ roleId: vendas, tables: ['a', 'b'] }]
    const [t1, t2] = [await ticketOf(owner), await ticketOf(owner)]
    const [first, second, granted, revoked] = await Promise.all([
      postgres.reconcileReaders(owner, t1, a),
      postgres.reconcileReaders(owner, t2, b),
      Array.fromAsync({ length: 5 }, () => postgres.grantCopy(sync, { name: 'a', projectId })),
      Array.fromAsync({ length: 6 }, (_, i) =>
        postgres.revokeCopy(sync, { copy: i % 2 === 0 ? 'a' : 'ALL', projectId }),
      ),
    ])
    assert.ok(
      second.kind === 'DONE' &&
        ['DONE', 'SUPERSEDED'].includes(first.kind) &&
        [...granted, ...revoked].every((answer) => answer.kind === 'DONE'),
      `volta ${lap}: ${JSON.stringify([first, second, granted, revoked])}`,
    )
    const login = loginOf(vendas)
    assert.deepEqual(await heldBy(owner, login), [
      { relname: 'a', rolname: login },
      { relname: 'b', rolname: login },
    ])
  }
})

test('as duas apagam o mesmo login: a de bilhete maior termina sem 42704', async (t) => {
  const { owner } = await companyOf(t)
  for (let lap = 0; lap < LAPS; lap++) {
    const [vendas, saindo] = [libraryRole(), libraryRole()]
    await applied(owner, [
      { roleId: vendas, tables: ['a'] },
      { roleId: saindo, tables: ['b'] },
    ])
    const wanted = [{ roleId: vendas, tables: ['a'] }]
    await crossed(owner, wanted, wanted, lap)
    assert.equal(await loginExists(owner, loginOf(saindo)), false, `volta ${lap}`)
    assert.deepEqual(await heldBy(owner, loginOf(vendas)), [
      { relname: 'a', rolname: loginOf(vendas) },
    ])
  }
})

test('a mais velha cria um login que a mais nova não pede: ele não fica', async (t) => {
  const { owner } = await companyOf(t)
  for (let lap = 0; lap < LAPS; lap++) {
    const [vendas, novo] = [libraryRole(), libraryRole()]
    const newer = [{ roleId: vendas, tables: ['a'] }]
    await applied(owner, newer)
    await crossed(owner, [...newer, { roleId: novo, tables: ['a'] }], newer, lap)
    assert.equal(await loginExists(owner, loginOf(novo)), false, `volta ${lap}`)
    assert.deepEqual(await heldBy(owner, loginOf(novo)), [], `volta ${lap}`)
  }
})

test('a mais velha apaga um login que a mais nova pede: a mais nova termina sem 42704', async (t) => {
  const { owner } = await companyOf(t)
  for (let lap = 0; lap < LAPS; lap++) {
    const [vendas, pedido] = [libraryRole(), libraryRole()]
    const newer = [
      { roleId: vendas, tables: ['a'] },
      { roleId: pedido, tables: ['b'] },
    ]
    await applied(owner, newer)
    await crossed(owner, [{ roleId: vendas, tables: ['a'] }], newer, lap)
    assert.deepEqual(await heldBy(owner, loginOf(pedido)), [
      { relname: 'b', rolname: loginOf(pedido) },
    ])
  }
})
