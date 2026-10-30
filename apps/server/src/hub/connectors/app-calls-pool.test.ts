import assert from 'node:assert/strict'
import { test } from 'node:test'
import { APP_SESSION_HEADER } from '@conexus/hub-api'
import { appCalls, HOST } from './test-app-calls.ts'

test('vinte leituras ao mesmo tempo, cada uma numa ligação, não prendem o banco: a sessão do app responde em menos de 500 ms e as vinte dão OK', async (t) => {
  const on = await appCalls(t)
  const names = Array.from({ length: 20 }, (_, n) => `Filial ${n + 1}`)
  for (const name of names) await on.connect(name, false)
  // A Projeto reads one Sankhya (perProject); the test releases twenty straight in the table so the queue cannot tell them apart.
  await on.hub.test.asOwner(
    `insert into connectors.project_connection
       (project_id, company_id, connector_id, connection_id, exclusive, granted_by, granted_at)
     select $1, company_id, connector_id, id, false, linked_by, now() from connectors.connection`,
    [on.projectId],
  )
  on.fake.switches.delayMilliseconds = 5000
  const reads = names.map((name) => on.read({ connection: name, deadlineMs: 10_000 }))
  await new Promise((resolve) => setTimeout(resolve, 300))
  const started = performance.now()
  const current = await on.hub.edge.inject({
    method: 'GET',
    url: `/api/app-sessions/current?host=${HOST}`,
    headers: { [APP_SESSION_HEADER]: on.session },
  })
  const elapsed = performance.now() - started
  assert.equal(current.statusCode, 200)
  assert.ok(elapsed < 500, `${elapsed} ms`)
  const answers = await Promise.all(reads)
  assert.deepEqual(
    answers.map((response) => Object(response.json()).kind),
    Array(20).fill('OK'),
  )
})
