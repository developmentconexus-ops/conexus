import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import pg from 'pg'
import { codeOf } from '../identity/test-hub.ts'
import type { RolesWorld } from './test-readers.ts'
import { erred, hubNames, idsOf, put, rolesWorld, waitingOnLocks } from './test-readers.ts'

function codesOf(w: RolesWorld, message: string) {
  return erred(w, message).map(({ code }) => code)
}

/** The failures the routes log while the test runs, through the child logger of each request. */
function routeErrors(t: TestContext, w: RolesWorld) {
  const errors: Record<string, unknown>[] = []
  const log = w.on.hub.app.log
  const child = log.child.bind(log)
  t.mock.method(log, 'child', (...args: Parameters<typeof log.child>) => {
    const made = child(...args)
    const error = made.error.bind(made)
    return Object.assign(made, {
      error: (fields: Record<string, unknown>, message: string) => {
        errors.push(fields)
        error(fields, message)
      },
    })
  })
  return errors
}

test('com a reconciliação lançando e a reposição falhando, o log mostra os dois erros', async (t) => {
  const w = await rolesWorld(t, 'NONE')
  assert.equal(
    (await put(w, w.on.ana, w.financeiro.role, idsOf(w, ['sankhya_clientes']))).statusCode,
    200,
  )
  const asOwner = w.on.hub.test.asOwner.bind(w.on.hub.test)
  t.mock.method(w.on.hub.postgres.companyPostgres, 'reconcileReaders', async () => {
    await asOwner('revoke insert on copies.copy_reader from hub_company')
    throw Object.assign(new Error('reconcile threw'), { code: 'XX001' })
  })
  const served = routeErrors(t, w)
  const taken = await put(w, w.on.ana, w.financeiro.role, [])
  await asOwner('grant insert on copies.copy_reader to hub_company')
  assert.deepEqual([taken.statusCode, codeOf(taken)], [503, 'COPY_DATABASE_UNAVAILABLE'])
  assert.deepEqual(codesOf(w, 'COPY_READERS_PENDING'), ['INTERNAL_UNEXPECTED'])
  assert.deepEqual(
    served.map(({ code }) => code),
    ['XX001'],
  )
})

test('a reposição espera a vez da empresa antes de reler a vez do papel', async (t) => {
  const w = await rolesWorld(t, 'NONE')
  const clientes = idsOf(w, ['sankhya_clientes'])
  assert.equal((await put(w, w.on.ana, w.financeiro.role, clientes)).statusCode, 200)
  const holder = new pg.Client({ connectionString: w.on.hub.test.ownerUrl.reveal() })
  await holder.connect()
  const { seen, taken } = await (async () => {
    try {
      const locked = Promise.withResolvers<void>()
      t.mock.method(w.on.hub.postgres.companyPostgres, 'reconcileReaders', async () => {
        await holder.query('begin')
        await holder.query('select id from auth.company where id = $1 for no key update', [
          w.on.companyId,
        ])
        locked.resolve()
        return { kind: 'NO_ANSWER' as const }
      })
      let early = false
      const asked = put(w, w.on.ana, w.financeiro.role, [])
      void asked.then(() => {
        early = true
      })
      await locked.promise
      const waited = { waited: await waitingOnLocks(holder, 1), early }
      await holder.query('commit')
      return { seen: waited, taken: await asked }
    } finally {
      await holder.end()
    }
  })()
  assert.deepEqual([seen, taken.statusCode], [{ waited: true, early: false }, 503])
  assert.deepEqual(await hubNames(w, w.financeiro.id), ['sankhya_clientes'])
})
