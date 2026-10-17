import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { serveEnvironment, spawnHub, TEST_ORIGIN } from '../../platform/test-database.ts'
import type { Hub, Person } from '../identity/test-hub.ts'
import { ANA, BRUNO, codeOf, hubWithMail, PASSWORD, personOn, post } from '../identity/test-hub.ts'

const OWNER = 'davi@example.test'
const BODY = {
  cnpj: '12.ABC.345/01DE-35',
  legalName: 'Empresa Teste Ltda',
  name: 'Empresa Teste',
  ownerEmail: OWNER,
}

function register(hub: Hub, person: Person, body: object = BODY, key?: string) {
  return post(hub, person, '/api/clients', body, key)
}

function call(
  hub: Hub,
  person: Person | undefined,
  method: 'GET' | 'PUT',
  url: string,
  body?: object,
) {
  return hub.app.inject({
    method,
    url,
    headers: {
      origin: TEST_ORIGIN,
      ...(person ? { cookie: person.cookie } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    ...(body ? { payload: JSON.stringify(body) } : {}),
  })
}

async function counts(hub: Hub) {
  const [row] = await hub.test.asOwner(`select
    (select count(*)::int from auth.company) as companies,
    (select count(*)::int from auth.invitation) as invitations,
    (select count(*)::int from auth.member) as members,
    (select count(*)::int from operations.client) as clients`)
  return row
}

test('sem membro: o cadastro cria a empresa sem membro, um convite owner pendente do operador e o cliente; o e-mail sai de Conexus', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA)
  const response = await register(hub, ana)
  assert.equal(response.statusCode, 201)
  const { client } = Object(response.json())
  const invitation = client.state.ownerInvitation
  assert.deepEqual(client, {
    companyId: client.companyId,
    cnpj: '12ABC34501DE35',
    legalName: 'Empresa Teste Ltda',
    name: 'Empresa Teste',
    registeredAt: client.registeredAt,
    revision: 0,
    state: {
      kind: 'AWAITING_OWNER',
      ownerInvitation: {
        id: invitation.id,
        email: OWNER,
        state: 'PENDING',
        expiresAt: invitation.expiresAt,
        revision: 0,
      },
    },
  })
  assert.match(client.companyId, /^[A-Za-z0-9]{32}$/)
  assert.deepEqual(
    await hub.test.asOwner(
      `select company_id, email, role, status, inviter_id from auth.invitation`,
    ),
    [
      {
        company_id: client.companyId,
        email: OWNER,
        role: 'owner',
        status: 'pending',
        inviter_id: ana.id,
      },
    ],
  )
  assert.deepEqual(await counts(hub), { companies: 1, invitations: 1, members: 0, clients: 1 })
  assert.deepEqual(
    hub.mail.sent.map((mail) => [mail.to, mail.subject]),
    [[OWNER, 'Conexus convidou você para ser o primeiro dono de Empresa Teste']],
  )
  assert.match(hub.mail.sent[0]?.text ?? '', new RegExp(`/invitations/${invitation.id}`))
  assert.match(hub.mail.sent[0]?.text ?? '', /^Conexus convidou você/m)
  const listed = await call(hub, ana, 'GET', '/api/companies')
  assert.deepEqual(Object(listed.json()).companies, [])
})

test('a chave: mesma chave e corpo dão a mesma empresa e um convite, também duas juntas; outro corpo, 409 IDEMPOTENCY_CONFLICT', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA)
  const key = randomUUID()
  const first = await register(hub, ana, BODY, key)
  const again = await register(hub, ana, BODY, key)
  assert.deepEqual([first.statusCode, again.statusCode], [201, 201])
  assert.equal(again.body, first.body)
  // The replay of a mailed invitation sends nothing again.
  assert.equal(hub.mail.sent.length, 1)
  const pairKey = randomUUID()
  const pair = { ...BODY, cnpj: '11.222.333/0001-81' }
  const twice = await Promise.all([
    register(hub, ana, pair, pairKey),
    register(hub, ana, pair, pairKey),
  ])
  assert.deepEqual(
    twice.map((response) => response.statusCode),
    [201, 201],
  )
  assert.equal(twice[0]?.body, twice[1]?.body)
  assert.deepEqual(await counts(hub), { companies: 2, invitations: 2, members: 0, clients: 2 })
  for (const changed of [
    { ...BODY, legalName: 'Outra Razão' },
    { ...BODY, name: 'Outro Nome' },
    { ...BODY, ownerEmail: 'edu@example.test' },
    { ...BODY, cnpj: '06.990.590/0001-23' },
  ]) {
    const conflict = await register(hub, ana, changed, key)
    assert.deepEqual([conflict.statusCode, codeOf(conflict)], [409, 'IDEMPOTENCY_CONFLICT'])
  }
  assert.deepEqual(await counts(hub), { companies: 2, invitations: 2, members: 0, clients: 2 })
})

test('o CNPJ: alfanumérico e numérico válidos entram, com máscara ou minúsculas; dígito errado, 13 posições e zeros dão 400; repetido, 409 CLIENT_EXISTS sem nada criado, também dois juntos', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA)
  const accepted = [
    ['12abc34501de35', '12ABC34501DE35'],
    ['11.222.333/0001-81', '11222333000181'],
  ]
  for (const [typed, stored] of accepted) {
    const response = await register(hub, ana, {
      ...BODY,
      cnpj: typed,
      ownerEmail: `${stored}@example.test`,
    })
    assert.equal(response.statusCode, 201, typed)
    assert.equal(Object(response.json()).client.cnpj, stored)
  }
  for (const refused of ['12ABC34501DE36', '1222333000181', '00000000000000', '12ABC34501DE3X']) {
    const response = await register(hub, ana, { ...BODY, cnpj: refused })
    assert.deepEqual([response.statusCode, codeOf(response)], [400, 'REQUEST_MALFORMED'], refused)
  }
  const repeated = await register(hub, ana, { ...BODY, cnpj: '12.ABC.345/01DE-35' })
  assert.deepEqual([repeated.statusCode, codeOf(repeated)], [409, 'CLIENT_EXISTS'])
  assert.deepEqual(await counts(hub), { companies: 2, invitations: 2, members: 0, clients: 2 })
  const pair = { ...BODY, cnpj: '06.990.590/0001-23' }
  const together = await Promise.all([register(hub, ana, pair), register(hub, ana, pair)])
  assert.deepEqual(together.map((response) => [response.statusCode, codeOf(response)]).sort(), [
    [201, undefined],
    [409, 'CLIENT_EXISTS'],
  ])
  assert.deepEqual(await counts(hub), { companies: 3, invitations: 3, members: 0, clients: 3 })
})

test('recusas: o e-mail de um operador dá 422 CLIENT_OWNER_IS_OPERATOR; uma recusa plantada depois de cada escrita não deixa linha alguma', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA)
  const operator = await register(hub, ana, { ...BODY, ownerEmail: 'ANA@example.test' })
  assert.deepEqual([operator.statusCode, codeOf(operator)], [422, 'CLIENT_OWNER_IS_OPERATOR'])
  await hub.test.asOwner(`create function public.refuse_write() returns trigger
    language plpgsql as $$ begin raise exception 'refused'; end $$`)
  for (const table of ['auth.company', 'auth.invitation', 'operations.client']) {
    await hub.test.asOwner(`create trigger refuse_write after insert on ${table}
      for each row execute function public.refuse_write()`)
    const refused = await register(hub, ana)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [500, 'INTERNAL_UNEXPECTED'], table)
    await hub.test.asOwner(`drop trigger refuse_write on ${table}`)
  }
  assert.deepEqual(await counts(hub), { companies: 0, invitations: 0, members: 0, clients: 0 })
  assert.equal(hub.mail.sent.length, 0)
})

test('fora: o membro, quem não é operador, recebe 404 nas quatro rotas /api/clients; sem sessão, 401', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA)
  const bruno = await personOn(hub, BRUNO)
  const { client } = Object((await register(hub, ana)).json())
  const url = `/api/clients/${client.companyId}`
  const correction = { ...BODY, revision: 0 }
  const refused = [
    await call(hub, bruno, 'GET', '/api/clients'),
    await call(hub, bruno, 'GET', url),
    await register(hub, bruno, { ...BODY, cnpj: '11.222.333/0001-81' }),
    await call(hub, bruno, 'PUT', url, correction),
  ]
  for (const response of refused) {
    assert.deepEqual([response.statusCode, codeOf(response)], [404, 'NOT_FOUND'])
  }
  assert.equal((await call(hub, undefined, 'GET', '/api/clients')).statusCode, 401)
  assert.deepEqual(await counts(hub), { companies: 1, invitations: 1, members: 0, clients: 1 })
})

test('log: CLIENT_REGISTERED e CLIENT_CORRECTED levam o trace e os ids, nunca o CNPJ, a razão social, o nome ou o e-mail', async (t) => {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA)
  const environment = {
    ...serveEnvironment(t, hub.test.runtimeUrl),
    HUB_MAIL_API_URL: hub.mail.url,
  }
  const { port, lines, stop } = await spawnHub(t, environment)
  const base = `http://127.0.0.1:${port}`
  const json = { origin: TEST_ORIGIN, 'content-type': 'application/json' }
  try {
    const signedIn = await fetch(`${base}/api/sessions/current`, {
      method: 'PUT',
      headers: { ...json, 'cf-connecting-ip': '203.0.113.9' },
      body: JSON.stringify({ email: ANA.email, password: PASSWORD }),
    })
    assert.equal(signedIn.status, 200)
    const cookie = (signedIn.headers.get('set-cookie') ?? '').split(';')[0] ?? ''
    const headers = { ...json, cookie }
    const created = await fetch(`${base}/api/clients`, {
      method: 'POST',
      headers: { ...headers, 'Idempotency-Key': randomUUID() },
      body: JSON.stringify(BODY),
    })
    assert.equal(created.status, 201)
    const { client } = Object(await created.json())
    const corrected = await fetch(`${base}/api/clients/${client.companyId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ ...BODY, legalName: 'Razão Corrigida', revision: 0 }),
    })
    assert.equal(corrected.status, 200)
    for (const code of ['CLIENT_REGISTERED', 'CLIENT_CORRECTED']) {
      const line = lines.find((logged) => logged.msg === code)
      assert.equal(line?.companyId, client.companyId, code)
      assert.equal(line?.personId, ana.id, code)
      assert.match(String(line?.traceId), /^[0-9a-f-]{36}$/, code)
    }
  } finally {
    await stop()
  }
  const output = JSON.stringify(lines)
  for (const kept of ['12ABC34501DE35', '12.ABC', 'Empresa Teste', 'Razão', OWNER, ANA.email]) {
    assert.doesNotMatch(output, new RegExp(kept))
  }
})
