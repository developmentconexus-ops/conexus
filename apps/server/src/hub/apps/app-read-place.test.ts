import assert from 'node:assert/strict'
import { test } from 'node:test'
import { appLogin, appLoginPassword } from '@conexus/hub-api'
import pg from 'pg'
import { principalFor } from '../access/public.ts'
import { TEST_APP_LOGIN_KEY } from '../copies/test-copies.ts'
import type { RolesWorld } from '../copies/test-readers.ts'
import { copyOf, rolesWorld } from '../copies/test-readers.ts'

const RELEASED = ['sankhya_clientes', 'sankhya_vendas']

/** The rows the app's run login counts in a table, as the edge reaches the company's database. */
async function asTheApp(w: RolesWorld, table: string) {
  const { runLogin } = appLogin(w.on.projectId)
  const url = new URL(w.on.owner.reveal())
  url.username = runLogin
  url.password = await appLoginPassword({ key: TEST_APP_LOGIN_KEY, login: runLogin })
  const client = new pg.Client({ connectionString: url.toString() })
  await client.connect()
  try {
    return (await client.query(`select * from sync.${table}`)).rowCount
  } finally {
    await client.end()
  }
}

// The handoff gives the published app this run login (app-handoff.test.ts, "checagem com versão").
test('o app lê pela liberação do Projeto', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  for (const name of RELEASED) {
    await w.on.copies.grant({
      ...{ companyId: w.on.companyId, personId: w.on.anaId },
      ...{ projectId: w.on.projectId, copyId: copyOf(w.copies, name) },
    })
  }
  for (const table of RELEASED) assert.ok(((await asTheApp(w, table)) ?? 0) > 0, table)
  const bruno = principalFor({
    ...{ consumer: 'assistant', companyId: w.on.companyId, personId: w.brunoId },
    ...{ place: { kind: 'PROJECT', projectId: w.on.projectId }, choice: { kind: 'ANY' } },
  })
  const read = await w.on.hub
    .data(bruno, { thread: null })
    .read({ kind: 'TABLE', table: 'sankhya_clientes' })
  assert.deepEqual(read, { kind: 'NOT_IN_CATALOG' }, 'the conversation still reads by the role')
})
