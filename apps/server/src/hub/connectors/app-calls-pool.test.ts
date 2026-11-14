import assert from 'node:assert/strict'
import { test } from 'node:test'
import { APP_SESSION_HEADER } from '@conexus/hub-api'
import { appCalls, HOST, sankhyaDoor } from './test-app-calls.ts'

test('vinte leituras ao mesmo tempo, cada uma numa ligação, não prendem o banco: a sessão do app responde com as vinte ainda abertas e as vinte dão OK', async (t) => {
  const door = sankhyaDoor(t)
  const on = await appCalls(t, { through: door.through })
  const names = Array.from({ length: 20 }, (_, n) => `Filial ${n + 1}`)
  for (const name of names) await on.connect(name, false)
  // A Projeto reads one Sankhya (perProject); the test releases twenty straight in the table so the queue cannot tell them apart.
  await on.hub.test.asOwner(
    `insert into connectors.project_connection
       (project_id, company_id, connector_id, connection_id, exclusive, granted_by, granted_at)
     select $1, company_id, connector_id, id, false, linked_by, now() from connectors.connection`,
    [on.projectId],
  )
  const release = door.hold()
  let ended = 0
  const reads = names.map((name) =>
    on.read({ connection: name, deadlineMs: 10_000 }).finally(() => {
      ended += 1
    }),
  )
  await door.reached(20)
  const current = await on.hub.edge.inject({
    method: 'GET',
    url: `/api/app-sessions/current?host=${HOST}`,
    headers: { [APP_SESSION_HEADER]: on.session },
  })
  assert.equal(current.statusCode, 200)
  assert.equal(ended, 0, 'the session answered while the twenty were still open')
  release()
  const answers = await Promise.all(reads)
  assert.deepEqual(
    answers.map((response) => Object(response.json()).kind),
    Array(20).fill('OK'),
  )
})
