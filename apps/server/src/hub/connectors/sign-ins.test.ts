import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { REDIRECT_PATH } from '@conexus/hub-api'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import { call, codeOf, personOn, plantCompany } from '../identity/test-hub.ts'
import {
  completeOf,
  consentAt,
  linkMercadoLivre,
  mercadoLivreOn,
  startOf,
} from './test-connections.ts'

const MERCADO_LIVRE = { connector: 'mercado-livre', name: 'Loja 1' }
const OTHER_ACCOUNT = { ref: '987654321', label: 'OUTRALOJA' }

function failed(response: { statusCode: number; json(): unknown }) {
  return [response.statusCode, codeOf(response)]
}

test('começar: a dona recebe o endereço do dublê; as recusas não criam nada', async (t) => {
  const { hub, fake, served, ana, carla, companyId } = await mercadoLivreOn(t)
  const started = await startOf(hub, ana, companyId, MERCADO_LIVRE)
  assert.equal(started.statusCode, 201)
  const url = new URL(Object(started.json()).url)
  assert.equal(`${url.origin}${url.pathname}`, `${served.origin}/authorization`)
  assert.equal(url.searchParams.get('client_id'), fake.app.clientId)
  assert.equal(url.searchParams.get('redirect_uri'), `${TEST_ORIGIN}${REDIRECT_PATH}`)
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256')
  assert.match(url.searchParams.get('state') ?? '', new RegExp(`^${companyId}\\.[0-9a-f-]{36}$`))
  assert.equal(url.href.includes(fake.app.clientSecret), false)
  assert.deepEqual(Object.keys(Object(started.json())), ['url'])

  assert.deepEqual(failed(await startOf(hub, carla, companyId, MERCADO_LIVRE)), [404, 'NOT_FOUND'])
  const sankhya = { connector: 'sankhya', name: 'Matriz' }
  assert.deepEqual(failed(await startOf(hub, ana, companyId, sankhya)), [404, 'CONNECTOR_UNKNOWN'])
  const blank = { ...MERCADO_LIVRE, name: '   ' }
  assert.deepEqual(failed(await startOf(hub, ana, companyId, blank)), [
    422,
    'CONNECTION_NAME_INVALID',
  ])
  const gone = { connectionId: randomUUID() }
  assert.deepEqual(failed(await startOf(hub, ana, companyId, gone)), [404, 'CONNECTION_NOT_FOUND'])

  assert.equal((await linkMercadoLivre(hub, ana, companyId)).statusCode, 200)
  const before = await hub.test.asOwner('select id from connectors.connection_sign_in')
  const taken = { ...MERCADO_LIVRE, name: 'loja 1' }
  assert.deepEqual(failed(await startOf(hub, ana, companyId, taken)), [
    409,
    'CONNECTION_NAME_TAKEN',
  ])
  assert.deepEqual(await hub.test.asOwner('select id from connectors.connection_sign_in'), before)
})

test('começar: sem as chaves do app nesta instalação', async (t) => {
  const { hub, ana, companyId } = await mercadoLivreOn(t, {
    change: (config) => ({ ...config, connectorApps: undefined }),
  })
  assert.deepEqual(failed(await startOf(hub, ana, companyId, MERCADO_LIVRE)), [
    503,
    'CONNECTOR_NOT_CONFIGURED',
  ])
})

test('completar: cria a ligação uma vez; a autorização gasta, alheia ou vencida', async (t) => {
  const { hub, ana, bruno, companyId, base } = await mercadoLivreOn(t)
  const started = await startOf(hub, ana, companyId, MERCADO_LIVRE)
  const back = await consentAt(Object(started.json()).url)
  assert.equal(back.companyId, companyId)
  const answer = { code: back.code }
  const byBruno = await completeOf(hub, bruno, companyId, back.signInId, answer)
  assert.deepEqual(failed(byBruno), [410, 'CONNECTION_SIGN_IN_EXPIRED'])
  const elsewhere = await plantCompany(hub.test, ana.id, 'Outra Empresa')
  const inOther = await completeOf(hub, ana, elsewhere, back.signInId, answer)
  assert.deepEqual(failed(inOther), [410, 'CONNECTION_SIGN_IN_EXPIRED'])

  const linked = await completeOf(hub, ana, companyId, back.signInId, answer)
  assert.equal(linked.statusCode, 200)
  const { result, connection } = Object(linked.json())
  assert.equal(result, 'LINKED')
  assert.deepEqual(
    [connection.connector, connection.name, connection.state, connection.account],
    ['mercado-livre', 'Loja 1', 'NEW', { label: 'PADARIASOL' }],
  )
  assert.deepEqual(connection.linkedBy, { id: ana.id, name: 'Ana Lima' })
  const list = Object((await call(hub, ana, 'GET', base)).json())
  const auths = list.connectors.map((each: { id: string; auth: string; fields: unknown[] }) => [
    each.id,
    each.auth,
    each.fields.length > 0,
  ])
  assert.deepEqual(auths, [
    ['sankhya', 'client_credentials', true],
    ['mercado-livre', 'oauth2_code', false],
  ])
  assert.deepEqual(list.connections[0].account, { label: 'PADARIASOL' })
  const again = await completeOf(hub, ana, companyId, back.signInId, answer)
  assert.deepEqual(failed(again), [410, 'CONNECTION_SIGN_IN_EXPIRED'])

  const late = await startOf(hub, ana, companyId, { ...MERCADO_LIVRE, name: 'Loja 2' })
  const lateBack = await consentAt(Object(late.json()).url)
  await hub.test.asOwner(
    `update connectors.connection_sign_in set expires_at = now() - interval '1 second'`,
  )
  const expired = await completeOf(hub, ana, companyId, lateBack.signInId, { code: lateBack.code })
  assert.deepEqual(failed(expired), [410, 'CONNECTION_SIGN_IN_EXPIRED'])
  assert.deepEqual(await hub.test.asOwner('select id from connectors.connection_sign_in'), [])
  const rows = await hub.test.asOwner('select name from connectors.connection')
  assert.deepEqual(rows, [{ name: 'Loja 1' }])
})

test('recusada: pela pessoa ou pelo Mercado Livre, nada se cria', async (t) => {
  const { hub, fake, ana, companyId } = await mercadoLivreOn(t)
  fake.switches.refuse = true
  const started = await startOf(hub, ana, companyId, MERCADO_LIVRE)
  const refused = await consentAt(Object(started.json()).url)
  assert.deepEqual([refused.error, refused.code], ['access_denied', null])
  const cancelled = await completeOf(hub, ana, companyId, refused.signInId, { refused: true })
  assert.deepEqual(cancelled.json(), { result: 'CANCELLED', connector: 'mercado-livre' })
  const spent = await completeOf(hub, ana, companyId, refused.signInId, { refused: true })
  assert.deepEqual(failed(spent), [410, 'CONNECTION_SIGN_IN_EXPIRED'])

  fake.switches.operator = true
  const answered = await linkMercadoLivre(hub, ana, companyId)
  assert.equal(answered.statusCode, 200)
  const body = Object(answered.json())
  assert.deepEqual(
    [body.result, body.connector, body.native.status],
    ['REFUSED', 'mercado-livre', 400],
  )
  assert.equal(JSON.stringify(body).includes('invalid_operator_user_id'), true)
  assert.deepEqual(await hub.test.asOwner('select id from connectors.connection'), [])
})

async function sentBack(
  of: Awaited<ReturnType<typeof mercadoLivreOn>>,
  error: string,
  description?: string,
) {
  const { hub, ana, companyId } = of
  const started = await startOf(hub, ana, companyId, MERCADO_LIVRE)
  const { signInId } = await consentAt(Object(started.json()).url)
  return Object((await completeOf(hub, ana, companyId, signInId, { error, description })).json())
}

test('a volta com error: REFUSED com o que veio, APP_REFUSED se o app, nada se cria', async (t) => {
  const on = await mercadoLivreOn(t)
  const { hub } = on
  const refused = await sentBack(on, 'invalid_operator_user_id', 'colaborador sem acesso')
  assert.deepEqual(refused, {
    result: 'REFUSED',
    connector: 'mercado-livre',
    native: {
      status: 302,
      code: 'invalid_operator_user_id',
      message: 'colaborador sem acesso',
      body: null,
    },
  })
  const app = await sentBack(on, 'unauthorized_application')
  assert.deepEqual(
    [app.result, app.native.code, app.native.message],
    ['APP_REFUSED', 'unauthorized_application', null],
  )
  assert.deepEqual(await hub.test.asOwner('select id from connectors.connection'), [])
})

test('completar: o Mercado Livre limita a chamada da conta, nada se cria e a pessoa tenta de novo', async (t) => {
  const { hub, fake, ana, companyId } = await mercadoLivreOn(t)
  fake.switches.accountRateLimited = true
  const limited = await linkMercadoLivre(hub, ana, companyId)
  assert.equal(limited.statusCode, 200)
  const body = Object(limited.json())
  assert.deepEqual(
    [body.result, body.connector, body.native.status],
    ['UNREACHABLE', 'mercado-livre', 429],
  )
  assert.deepEqual(await hub.test.asOwner('select id from connectors.connection'), [])
  fake.switches.accountRateLimited = false
  assert.equal((await linkMercadoLivre(hub, ana, companyId)).statusCode, 200)
})

test('conectar de novo: a mesma ligação, outra conta; a conta já ligada em outra', async (t) => {
  const { hub, fake, ana, companyId, base } = await mercadoLivreOn(t)
  const first = Object((await linkMercadoLivre(hub, ana, companyId)).json()).connection
  await hub.test.asOwner(
    `update connectors.connection set state = 'NEEDS_REAUTH', tested_at = now(), tested_by = $1`,
    [ana.id],
  )
  const [before] = await hub.test.asOwner('select sealed, revision from connectors.connection')
  fake.switches.account = { ...OTHER_ACCOUNT }
  const again = await linkMercadoLivre(hub, ana, companyId, { connectionId: first.id })
  assert.equal(again.statusCode, 200)
  const { connection } = Object(again.json())
  assert.deepEqual(
    [connection.id, connection.name, connection.state, connection.account, connection.testedAt],
    [first.id, 'Loja 1', 'NEW', { label: 'OUTRALOJA' }, null],
  )
  const pasted = await call(hub, ana, 'PUT', `${base}/${first.id}/credential`, { credential: {} })
  assert.deepEqual(failed(pasted), [404, 'CONNECTOR_UNKNOWN'])
  const [after] = await hub.test.asOwner('select sealed, revision from connectors.connection')
  assert.equal(after?.revision, Number(before?.revision) + 1)
  assert.notDeepEqual(after?.sealed, before?.sealed)

  fake.switches.account = { ref: '555000111', label: 'TERCEIRA' }
  const second = await linkMercadoLivre(hub, ana, companyId, { ...MERCADO_LIVRE, name: 'Loja 2' })
  assert.equal(Object(second.json()).result, 'LINKED')
  fake.switches.account = { ...OTHER_ACCOUNT }
  const onSecond = Object(second.json()).connection.id
  const elsewhere = await linkMercadoLivre(hub, ana, companyId, { connectionId: onSecond })
  assert.deepEqual(failed(elsewhere), [409, 'CONNECTION_ACCOUNT_ELSEWHERE'])
  const labels = await hub.test.asOwner(
    'select name, account_label from connectors.connection order by name',
  )
  assert.deepEqual(labels, [
    { name: 'Loja 1', account_label: 'OUTRALOJA' },
    { name: 'Loja 2', account_label: 'TERCEIRA' },
  ])
})

test('outra empresa: a mesma conta, sem nomear quem a tem', async (t) => {
  const { hub, ana, companyId } = await mercadoLivreOn(t)
  assert.equal(Object((await linkMercadoLivre(hub, ana, companyId)).json()).result, 'LINKED')
  const twice = await linkMercadoLivre(hub, ana, companyId, { ...MERCADO_LIVRE, name: 'Loja 2' })
  assert.deepEqual(failed(twice), [409, 'CONNECTION_ACCOUNT_ELSEWHERE'])
  const davi = await personOn(hub, { name: 'Davi Souza', email: 'davi@example.test' })
  const other = await plantCompany(hub.test, davi.id, 'Mercearia Lua')
  const refused = await linkMercadoLivre(hub, davi, other)
  assert.deepEqual(failed(refused), [409, 'CONNECTION_ACCOUNT_ELSEWHERE'])
  assert.equal(refused.body.includes('Empresa Teste'), false)
  assert.equal((await hub.test.asOwner('select id from connectors.connection')).length, 1)
})
