import assert from 'node:assert/strict'
import { test } from 'node:test'
import { APP_CALL_LIMITS } from '@conexus/app-contract'
import type { Place } from '../access/public.ts'
import { readerAt } from '../access/test-principal.ts'
import type { CopiesOn } from '../copies/test-copies.ts'
import { copiesOn } from '../copies/test-copies.ts'

function scopeOf(on: CopiesOn, place: Place) {
  return readerAt({ companyId: on.companyId, personId: on.anaId, place })
}

function inCompany(on: CopiesOn) {
  return on.hub.data(scopeOf(on, { kind: 'COMPANY' }), { thread: null })
}

async function withCopies(t: Parameters<typeof copiesOn>[0]) {
  const on = await copiesOn(t)
  const sales = await on.enable('vendas')
  const sellers = await on.enable('vendedores')
  for (const copyId of [sales, sellers]) assert.equal((await on.run(copyId)).kind, 'ENDED')
  return { on, sellers }
}

async function queried(on: CopiesOn, sql: string) {
  return inCompany(on).read({ kind: 'QUERY', sql })
}

function queryOf(answer: Awaited<ReturnType<typeof queried>>) {
  assert.equal(answer.kind, 'QUERY', JSON.stringify(answer))
}

function silentUntilAborted(t: Parameters<typeof copiesOn>[0], on: CopiesOn) {
  t.mock.method(
    on.hub.postgres.companyPostgres,
    'readCopies',
    (_reader: unknown, _statements: unknown, signal: AbortSignal) =>
      new Promise<{ kind: 'TIMEOUT' }>((resolve) =>
        signal.addEventListener('abort', () => resolve({ kind: 'TIMEOUT' })),
      ),
  )
}

test('o prazo da chamada corta um banco que não responde', async (t) => {
  const { on } = await withCopies(t)
  silentUntilAborted(t, on)
  const started = Date.now()
  assert.deepEqual(await queried(on, 'select 1'), { kind: 'DEADLINE' })
  const waited = Date.now() - started
  assert.ok(waited >= APP_CALL_LIMITS.callDeadlineMs - 500, `cortou cedo: ${waited} ms`)
  assert.ok(waited < APP_CALL_LIMITS.callDeadlineMs + 3000, `cortou tarde: ${waited} ms`)
})

test('a conversa cancelada cancela a consulta', async (t) => {
  const { on } = await withCopies(t)
  silentUntilAborted(t, on)
  const conversation = new AbortController()
  setTimeout(() => conversation.abort(), 100)
  const started = Date.now()
  const answer = await inCompany(on).read({
    ...{ kind: 'QUERY', sql: 'select 1' },
    signal: conversation.signal,
  })
  assert.deepEqual(answer, { kind: 'DEADLINE' })
  assert.ok(Date.now() - started < APP_CALL_LIMITS.callDeadlineMs / 2)
})

test('o banco calado dá TABLE_UNAVAILABLE e não lê ao vivo', async (t) => {
  const { on } = await withCopies(t)
  t.mock.method(on.hub.postgres.companyPostgres, 'readCopies', async () => ({
    kind: 'UNAVAILABLE' as const,
    cause: 'DOWN',
  }))
  const before = on.gate.pages
  assert.deepEqual(await queried(on, 'select 1'), { kind: 'TABLE_UNAVAILABLE' })
  const failed = on.hub.lines.find(({ message }) => message === 'DATA_QUERY_FAILED')
  assert.equal(failed?.fields.cause, 'DOWN')
  assert.equal(on.gate.pages, before)
})

test('o plano ilegível falha com INTERNAL_UNEXPECTED depois do log DATA_PLAN_UNREAD', async (t) => {
  const { on } = await withCopies(t)
  t.mock.method(on.hub.postgres.companyPostgres, 'readCopies', async () => ({
    kind: 'ROWS' as const,
    results: [
      { columns: [{ name: 'QUERY PLAN', typeId: 114 }], rows: [['não é plano']] },
      { columns: [{ name: 'n', typeId: 23 }], rows: [[1]] },
    ],
  }))
  await assert.rejects(
    () => queried(on, 'select 1'),
    (error: unknown) => Object(error).code === 'INTERNAL_UNEXPECTED',
  )
  assert.ok(on.hub.lines.some(({ message }) => message === 'DATA_PLAN_UNREAD'))
})

function readingAfterNoLogin(t: Parameters<typeof copiesOn>[0], on: CopiesOn) {
  const postgres = on.hub.postgres.companyPostgres
  const original = postgres.readCopies.bind(postgres)
  let asked = 0
  t.mock.method(postgres, 'readCopies', async (...args: Parameters<typeof original>) =>
    asked++ === 0 ? { kind: 'NO_LOGIN' as const } : original(...args),
  )
  return {
    asked: () => asked,
    reader: t.mock.method(postgres, 'ensureReader'),
    readLogin: t.mock.method(postgres, 'ensureReadLogin'),
  }
}

test('NO_LOGIN no Início: o login é feito como o dono e a consulta lida de novo uma vez', async (t) => {
  const { on } = await withCopies(t)
  const spies = readingAfterNoLogin(t, on)
  queryOf(await queried(on, 'select generate_series(1, 2) as n'))
  assert.equal(spies.asked(), 2)
  assert.equal(spies.reader.mock.callCount(), 1)
  assert.equal(spies.readLogin.mock.callCount(), 0)
})

test('NO_LOGIN num Projeto: o login do Projeto é feito e a consulta lida de novo uma vez', async (t) => {
  const { on, sellers } = await withCopies(t)
  await on.copies.grant({
    ...{ companyId: on.companyId, personId: on.anaId },
    ...{ copyId: sellers, projectId: on.projectId },
  })
  const spies = readingAfterNoLogin(t, on)
  const project = on.hub.data(scopeOf(on, { kind: 'PROJECT', projectId: on.projectId }), {
    thread: null,
  })
  const sql = 'select * from sync.sankhya_vendedores limit 1'
  queryOf(await project.read({ kind: 'QUERY', sql }))
  assert.equal(spies.asked(), 2)
  assert.equal(spies.reader.mock.callCount(), 0)
  assert.equal(spies.readLogin.mock.callCount(), 1)
})

test('NO_LOGIN e o dono sem resposta dá TABLE_UNAVAILABLE com a causa', async (t) => {
  const { on } = await withCopies(t)
  readingAfterNoLogin(t, on)
  t.mock.method(on.hub.neon.neon, 'ownerConnection', async () => ({ kind: 'NO_ANSWER' as const }))
  assert.deepEqual(await queried(on, 'select 1'), { kind: 'TABLE_UNAVAILABLE' })
  const failed = on.hub.lines.find(({ message }) => message === 'DATA_QUERY_FAILED')
  assert.equal(failed?.fields.cause, 'NO_OWNER')
  const owner = on.hub.lines.find(({ message }) => message === 'COPY_DATABASE_FAILED')
  assert.equal(owner?.fields.reason, 'OWNER_NO_ANSWER')
})

test('NO_LOGIN e o login não feito dá TABLE_UNAVAILABLE com o código da recusa', async (t) => {
  const { on } = await withCopies(t)
  readingAfterNoLogin(t, on)
  t.mock.method(on.hub.postgres.companyPostgres, 'ensureReader', async () => ({
    kind: 'REFUSED' as const,
    code: '42501',
  }))
  assert.deepEqual(await queried(on, 'select 1'), { kind: 'TABLE_UNAVAILABLE' })
  const failed = on.hub.lines.find(({ message }) => message === 'DATA_QUERY_FAILED')
  assert.equal(failed?.fields.cause, 'READER_42501')
})
