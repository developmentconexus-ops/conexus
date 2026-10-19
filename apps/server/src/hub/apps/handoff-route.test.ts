import assert from 'node:assert/strict'
import { test } from 'node:test'
import { queued, TEST_ORIGIN, TEST_PAGE, withOwnerLock } from '../../platform/test-database.ts'
import { CARLA, call, codeOf, personOn, plantCompany } from '../identity/test-hub.ts'
import {
  browser,
  companyWithApps,
  ESTOQUE,
  FROM_THE_APP,
  handoff,
  openPath,
  PEDIDOS,
  passes,
} from './test-handoff.ts'

// The handoff's GET of security S48: a navigation from the app's host gets a 303 to it with a pass,
// and nothing else makes a pass or reads JSON.
/** The screens' page with the status: the router there says the app is not there (security S10). */
function assertPage(
  response: { statusCode: number; headers: object; body: string },
  status: number,
) {
  assert.equal(response.statusCode, status)
  assert.match(String(Object(response.headers)['content-type']), /^text\/html/)
  assert.equal(response.body, TEST_PAGE)
}

test('passagem: a navegação do membro vinda do app, ou sem Fetch Metadata, 303 ao host do app com o passe', async (t) => {
  const { hub, bruno } = await companyWithApps(t)
  const { hash } = browser()
  const made = await handoff(hub, bruno, { host: PEDIDOS, binding: hash })
  assert.equal(made.statusCode, 303)
  assert.equal(made.headers['referrer-policy'], 'no-referrer')
  const location = new URL(String(made.headers.location))
  assert.equal(location.origin, `https://${PEDIDOS}.apps.example.test`)
  assert.equal(location.pathname, '/__conexus/passagem')
  assert.match(String(location.searchParams.get('code')), /^[A-Za-z0-9_-]{43}$/)
  const [row] = await hub.test.asOwner(
    `select code_hash, binding_hash,
      extract(epoch from expires_at - statement_timestamp())::int between 55 and 60 as lasts
      from apps.handoff`,
  )
  assert.equal(row?.binding_hash, hash)
  assert.equal(row?.lasts, true)
  assert.notEqual(row?.code_hash, location.searchParams.get('code'))
  const bare = await handoff(hub, bruno, { host: PEDIDOS, binding: hash }, {})
  assert.equal(bare.statusCode, 303)
  assert.equal(await passes(hub), 2)
})

test('passagem: um fetch ou uma moldura de outro site 403, nenhum passe; HEAD e POST, nenhum passe', async (t) => {
  const { hub, bruno } = await companyWithApps(t)
  const body = { host: PEDIDOS, binding: browser().hash }
  const foreign: Record<string, string>[] = [
    { ...FROM_THE_APP, 'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'empty' },
    { ...FROM_THE_APP, 'sec-fetch-mode': 'no-cors' },
    { ...FROM_THE_APP, 'sec-fetch-dest': 'iframe' },
    { 'sec-fetch-mode': 'cors' },
    { 'sec-fetch-dest': 'empty' },
  ]
  for (const headers of foreign) {
    const refused = await handoff(hub, bruno, body, headers)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [403, 'REQUEST_ORIGIN_REFUSED'])
  }
  const head = await hub.app.inject({
    method: 'HEAD',
    url: openPath(body),
    headers: { ...FROM_THE_APP, cookie: bruno.cookie },
  })
  assert.equal(head.statusCode, 404)
  assert.match(String(head.headers['content-type']), /^text\/html/)
  const post = await hub.app.inject({
    method: 'POST',
    url: openPath(body),
    headers: { ...FROM_THE_APP, origin: TEST_ORIGIN, cookie: bruno.cookie },
  })
  assert.deepEqual([post.statusCode, codeOf(post)], [404, 'NOT_FOUND'])
  const old = await hub.app.inject({
    method: 'POST',
    url: '/api/apps/handoffs',
    headers: { origin: TEST_ORIGIN, 'content-type': 'application/json', cookie: bruno.cookie },
    payload: JSON.stringify(body),
  })
  assert.deepEqual([old.statusCode, codeOf(old)], [404, 'NOT_FOUND'])
  assert.equal(await passes(hub), 0)
})

test('passagem: sem sessão, ou sessão saída, 303 a Entrar com o endereço de volta; nenhum passe', async (t) => {
  const { hub, bruno } = await companyWithApps(t)
  const body = { host: PEDIDOS, binding: browser().hash }
  const back = `/login?${new URLSearchParams({ redirect: openPath(body) })}`
  const anonymous = await handoff(hub, undefined, body)
  assert.deepEqual([anonymous.statusCode, anonymous.headers.location], [303, back])
  const signedOut = await call(hub, bruno, 'DELETE', '/api/sessions/current')
  assert.equal(signedOut.statusCode, 204)
  const ended = await handoff(hub, bruno, body)
  assert.deepEqual([ended.statusCode, ended.headers.location], [303, back])
  assert.equal(await passes(hub), 0)
})

// The Projetos are held, so the pass waits after the session was read and before it is written,
// and the session ends in between: the write finds it gone (code C65).
test('passagem: a sessão que sai entre a leitura e a gravação, 303 a Entrar; nenhum passe', async (t) => {
  const { hub, bruno } = await companyWithApps(t)
  const body = { host: PEDIDOS, binding: browser().hash }
  const holdProjects = 'lock table projects.project in access exclusive mode'
  const raced = await withOwnerLock(hub.test, holdProjects, [], async (release) => {
    const pending = handoff(hub, bruno, body)
    await queued(hub.test, 1, pending)
    await hub.test.asOwner(`delete from auth.session where user_id = $1`, [bruno.id])
    await release()
    return pending
  })
  assert.equal(raced.statusCode, 303)
  assert.match(String(raced.headers.location), /^\/login\?redirect=/)
  assert.equal(await passes(hub), 0)
})

test('passagem: host desconhecido, de fora, empresa marcada, Projeto apagado ou busca fora da forma: a página com 404, nenhum passe', async (t) => {
  const { hub, ana, bruno, companyId, project } = await companyWithApps(t)
  const { hash } = browser()
  const carla = await personOn(hub, CARLA)
  await plantCompany(hub.test, carla.id, 'Empresa C', 'empresa-c')
  const refused = [
    await handoff(hub, bruno, { host: 'nada--empresa-a', binding: hash }),
    await handoff(hub, carla, { host: PEDIDOS, binding: hash }),
    await handoff(hub, bruno, { host: 'Pedidos', binding: hash }),
    await handoff(hub, bruno, { host: PEDIDOS, binding: 'curto' }),
    await hub.app.inject({
      method: 'GET',
      url: `/apps/open?host=${PEDIDOS}`,
      headers: { ...FROM_THE_APP, cookie: bruno.cookie },
    }),
  ]
  assert.equal((await call(hub, ana, 'DELETE', project, { name: 'Pedidos' })).statusCode, 204)
  refused.push(await handoff(hub, bruno, { host: PEDIDOS, binding: hash }))
  await hub.test.asOwner(`update auth.company set deleting_since = now() where id = $1`, [
    companyId,
  ])
  refused.push(await handoff(hub, bruno, { host: ESTOQUE, binding: hash }))
  for (const response of refused) assertPage(response, 404)
  assert.equal(await passes(hub), 0)
})
