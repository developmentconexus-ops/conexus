import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import { queued, withOwnerLock } from '../../platform/test-database.ts'
import { post } from '../identity/test-hub.ts'
import { companyForVersions, folder, send } from './test-versions.ts'

function idOf(response: { json(): unknown }): string {
  return String(Object(Object(response.json()).version).id)
}

function color(n: number) {
  return `#00000${n}`
}

test('poda: com a 5 no ar ficam 2 a 5; a 1 sai com Worker e arquivos; "falhou" sai no próximo envio certo', async (t) => {
  const { hub, ana, versions } = await companyForVersions(t)
  const ids = [idOf(await send(hub, ana, versions, folder({}, color(1))))]
  hub.cloudflare.script('upload', 'NO_ANSWER')
  assert.equal((await send(hub, ana, versions, folder({}, color(9)))).statusCode, 502)
  for (const n of [2, 3, 4]) ids.push(idOf(await send(hub, ana, versions, folder({}, color(n)))))
  const failed = await hub.test.asOwner(
    `select number from apps.app_version where state = 'failed'`,
  )
  assert.deepEqual(failed, [], 'the failed one left with the next send that entered')
  ids.push(idOf(await send(hub, ana, versions, folder({}, color(5)))))
  const kept = await hub.test.asOwner('select id from apps.app_version order by number')
  assert.deepEqual(
    kept.map((row) => row.id),
    ids.slice(1),
  )
  assert.deepEqual(
    hub.cloudflare.workers(),
    ids
      .slice(1)
      .map((id) => `v-${id}`)
      .sort(),
  )
  const files = await hub.test.asOwner(
    'select count(*)::int as n from apps.version_file where version_id = $1',
    [ids[0]],
  )
  assert.deepEqual(files, [{ n: 0 }])
  // Color 1's stylesheet was the first version's alone, so its bytes left with it.
  const sheets = await hub.test.asOwner(
    `select count(*)::int as n from apps.blob where convert_from(bytes, 'UTF8') like '%${color(1)}%'`,
  )
  assert.deepEqual(sheets, [{ n: 0 }])
})

test('poda: o arquivo que outro Projeto nomeia no mesmo instante fica', async (t) => {
  const { hub, ana, projects, versions } = await companyForVersions(t)
  const estoque = Object((await post(hub, ana, projects, { name: 'Estoque' })).json()).project
  for (const n of [7, 2, 3, 4]) await send(hub, ana, versions, folder({}, color(n)))
  const sheet = createHash('sha256')
    .update(`:root{--cor:${color(7)}}`)
    .digest('hex')
  // Estoque names color 7's stylesheet in a transaction held open while Pedidos' next send prunes
  // the version that held it: the prune's delete of the blob waits, then finds it named.
  const answer = await withOwnerLock(
    hub.test,
    `with made as (
       insert into apps.app (project_id, company_id)
       select $1, company_id from apps.app limit 1 returning project_id, company_id),
     version as (
       insert into apps.app_version (id, company_id, project_id, number, state, manifest, digest,
         sent_by, attempt_key, created_at)
       select $2, company_id, project_id, 1, 'ready', '{}', repeat('0', 64), 'x', 'k', now()
         from made returning id, company_id)
     insert into apps.version_file (version_id, company_id, path, sha256, size, media_type)
     select id, company_id, 'assets/style.css', $3, 1, 'text/css' from version`,
    [estoque.id, 'e'.repeat(32), sheet],
    async (release) => {
      const sent = send(hub, ana, versions, folder({}, color(5)))
      await queued(hub.test, 1, sent)
      await release()
      return sent
    },
  )
  assert.equal(answer.statusCode, 201)
  const versionsLeft = await hub.test.asOwner(
    `select count(*)::int as n from apps.version_file where sha256 = $1`,
    [sheet],
  )
  assert.deepEqual(versionsLeft, [{ n: 1 }])
  const bytes = await hub.test.asOwner(
    'select count(*)::int as n from apps.blob where sha256 = $1',
    [sheet],
  )
  assert.deepEqual(bytes, [{ n: 1 }])
})
