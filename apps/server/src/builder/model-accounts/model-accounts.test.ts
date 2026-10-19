import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import {
  BRUNO,
  CARLA,
  call,
  codeOf,
  companyOn,
  memberOn,
  post,
} from '../../hub/identity/test-hub.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'

const KEY = 'sk-ant-api03-planted-key-for-tests-x7Qa'

/** Empresa Teste: Ana its owner, Bruno an administrator, Carla a member. */
async function company(t: Parameters<typeof companyOn>[0]) {
  const { hub, ana, companyId } = await companyOn(t)
  const bruno = await memberOn(hub, companyId, BRUNO, 'admin')
  const carla = await memberOn(hub, companyId, CARLA, 'member')
  const base = `/api/companies/${companyId}`
  return { hub, ana, bruno, carla, companyId, base, accounts: `${base}/model-accounts` }
}

function link(hub: Hub, person: Person, url: string, body: object, key?: string) {
  return post(
    hub,
    person,
    url,
    { owner: 'company', provider: 'anthropic', label: 'Time 1', key: KEY, ...body },
    key,
  )
}

function patch(hub: Hub, person: Person, url: string, body: object) {
  return hub.app.inject({
    method: 'PATCH',
    url,
    headers: { origin: TEST_ORIGIN, cookie: person.cookie, 'content-type': 'application/json' },
    payload: JSON.stringify(body),
  })
}

test('ligar por chave: lacra e grava no fim da fila do fornecedor, sem chamada, e a chave nunca volta', async (t) => {
  const { hub, ana, accounts } = await company(t)
  const calls: unknown[] = []
  const original = globalThis.fetch
  globalThis.fetch = async (...args) => {
    calls.push(args[0])
    return original(...args)
  }
  t.after(() => {
    globalThis.fetch = original
  })
  const first = await link(hub, ana, accounts, {})
  assert.equal(first.statusCode, 201)
  const { account } = Object(first.json())
  assert.deepEqual(account, {
    id: account.id,
    owner: 'company',
    kind: 'api_key',
    provider: 'anthropic',
    label: 'Time 1',
    position: 0,
    state: 'ready',
    limitedUntil: null,
    kindOff: false,
    hint: 'x7Qa',
    linkedBy: 'Ana Lima',
    linkedAt: account.linkedAt,
    assignees: [],
    revision: 1,
  })
  const second = await link(hub, ana, accounts, { label: ' Time 2 ' })
  assert.equal(Object(second.json()).account.position, 1)
  const other = await link(hub, ana, accounts, { provider: 'openai', label: 'OpenAI' })
  assert.equal(Object(other.json()).account.position, 0)
  assert.deepEqual(calls, [])
  const rows = await hub.test.asOwner(`select sealed, key_id from builder.model_account`)
  for (const row of rows) {
    assert.equal(Buffer.from(Object(row).sealed).includes(KEY), false)
    assert.equal(Object(row).key_id, 'k1')
  }
  const listed = await call(hub, ana, 'GET', accounts)
  assert.equal(JSON.stringify(listed.json()).includes(KEY), false)
  assert.deepEqual(
    Object(listed.json()).company.map(({ label }: { label: string }) => label),
    ['Time 1', 'Time 2', 'OpenAI'],
  )
})

test('a lista diz até quando a conta está no limite, pelo relógio do banco; passado o limite, nulo', async (t) => {
  const { hub, ana, accounts } = await company(t)
  await link(hub, ana, accounts, { label: 'Futuro' })
  await link(hub, ana, accounts, { label: 'Passado' })
  await link(hub, ana, accounts, { label: 'Livre' })
  await hub.test.asOwner(
    `update builder.model_account set limited_until = now() + interval '1 hour' where label = 'Futuro'`,
  )
  await hub.test.asOwner(
    `update builder.model_account set limited_until = now() - interval '1 hour' where label = 'Passado'`,
  )
  const listed = Object((await call(hub, ana, 'GET', accounts)).json())
  const until = new Map<string, unknown>(
    listed.company.map(({ label, limitedUntil }: Record<string, unknown>) => [
      String(label),
      limitedUntil,
    ]),
  )
  const future = until.get('Futuro')
  assert.equal(typeof future, 'string')
  assert.ok(Date.parse(String(future)) > Date.now())
  assert.equal(until.get('Passado'), null)
  assert.equal(until.get('Livre'), null)
})

test('provedores usáveis: os da fila que a pessoa chamaria; pausada, recusada, em limite e dada a outro não contam', async (t) => {
  const { hub, ana, bruno, carla, accounts } = await company(t)
  async function linked(provider: string, label: string, owner = 'company', who = ana) {
    const answer = await link(hub, who, accounts, { provider, label, owner })
    assert.equal(answer.statusCode, 201, answer.body)
    return String(Object(answer.json()).account.id)
  }
  async function usable(who = ana) {
    return Object((await call(hub, who, 'GET', accounts)).json()).usableProviders
  }
  assert.deepEqual(await usable(), [])
  await linked('anthropic', 'Pausada')
  await linked('groq', 'Recusada')
  await linked('openai', 'Limitada')
  const given = await linked('mistral', 'Dada')
  await linked('deepseek', 'Da Carla', 'me', carla)
  function sql(set: string, label: string) {
    return hub.test.asOwner(`update builder.model_account set ${set} where label = $1`, [label])
  }
  await sql(`state = 'paused'`, 'Pausada')
  await sql(`state = 'refused'`, 'Recusada')
  await sql(`limited_until = now() + interval '1 hour'`, 'Limitada')
  const gift = await call(hub, ana, 'PUT', `${accounts}/${given}/assignees`, {
    personIds: [bruno.id],
  })
  assert.equal(gift.statusCode, 200)
  assert.deepEqual(await usable(), [])
  assert.deepEqual(await usable(bruno), ['mistral'])
  assert.deepEqual(await usable(carla), ['deepseek'])
  await sql(`limited_until = now() - interval '1 hour'`, 'Limitada')
  assert.deepEqual(await usable(), ['openai'])
})

test('ligar por chave: chave vazia, nome vazio ou fornecedor fora da lista dão 422, cada um do seu campo', async (t) => {
  const { hub, ana, accounts } = await company(t)
  for (const [body, code] of [
    [{ key: '' }, 'MODEL_ACCOUNT_INVALID'],
    [{ key: '   ' }, 'MODEL_ACCOUNT_INVALID'],
    [{ label: ' ' }, 'MODEL_ACCOUNT_LABEL_INVALID'],
    [{ provider: 'cloudflare-workers-ai' }, 'MODEL_PROVIDER_UNKNOWN'],
    [{ provider: 'nenhum' }, 'MODEL_PROVIDER_UNKNOWN'],
  ] as const) {
    const refused = await link(hub, ana, accounts, body)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [422, code], JSON.stringify(body))
  }
  assert.deepEqual(await hub.test.asOwner(`select id from builder.model_account`), [])
})

test('ligar por chave: o mesmo Idempotency-Key dá uma conta; outro corpo, IDEMPOTENCY_CONFLICT', async (t) => {
  const { hub, ana, accounts } = await company(t)
  const key = crypto.randomUUID()
  const [one, two] = await Promise.all([
    link(hub, ana, accounts, {}, key),
    link(hub, ana, accounts, {}, key),
  ])
  assert.deepEqual([one.statusCode, two.statusCode], [201, 201])
  assert.equal(Object(one.json()).account.id, Object(two.json()).account.id)
  for (const body of [{ key: `${KEY}-outra` }, { label: 'Outra' }, { owner: 'me' }]) {
    const conflict = await link(hub, ana, accounts, body, key)
    assert.equal(conflict.statusCode, 409)
    assert.equal(codeOf(conflict), 'IDEMPOTENCY_CONFLICT')
  }
  assert.equal((await hub.test.asOwner(`select id from builder.model_account`)).length, 1)
})

test('o membro lê a fila da empresa e não a muda (404); ninguém vê conta pessoal alheia', async (t) => {
  const { hub, ana, carla, base, accounts } = await company(t)
  const companyAccount = Object((await link(hub, ana, accounts, {})).json()).account
  const anas = Object(
    (await link(hub, ana, accounts, { owner: 'me', label: 'Minha' })).json(),
  ).account
  const read = Object((await call(hub, carla, 'GET', accounts)).json())
  assert.deepEqual(
    read.company.map(({ id }: { id: string }) => id),
    [companyAccount.id],
  )
  assert.deepEqual(read.mine, [])
  assert.equal(read.mayManage, false)
  const url = `${accounts}/${companyAccount.id}`
  const answers = await Promise.all([
    link(hub, carla, accounts, {}),
    link(hub, carla, accounts, { provider: 'nenhum', key: '' }),
    patch(hub, carla, url, { revision: 1, state: 'paused' }),
    call(hub, carla, 'PUT', `${url}/assignees`, { personIds: [carla.id] }),
    call(hub, carla, 'PUT', `${base}/model-account-orders/company/anthropic`, {
      ids: [companyAccount.id],
    }),
    call(hub, carla, 'PUT', `${base}/default-model`, { model: 'anthropic/claude-haiku-4-5' }),
    call(hub, carla, 'DELETE', url),
  ])
  assert.deepEqual(
    answers.map((answer) => answer.statusCode),
    Array(7).fill(404),
  )
  assert.deepEqual(answers.map(codeOf).slice(0, 6), Array(6).fill('NOT_FOUND'))
  const asAna = Object((await call(hub, ana, 'GET', accounts)).json())
  assert.deepEqual(
    asAna.mine.map(({ id }: { id: string }) => id),
    [anas.id],
  )
  assert.equal(asAna.mayManage, true)
  // Carla's own account is hers alone: Ana, the owner, neither sees nor changes it.
  const carlas = Object(
    (await link(hub, carla, accounts, { owner: 'me', label: 'Da Carla' })).json(),
  ).account
  assert.equal(
    JSON.stringify((await call(hub, ana, 'GET', accounts)).json()).includes(carlas.id),
    false,
  )
  assert.equal(
    (await patch(hub, ana, `${accounts}/${carlas.id}`, { revision: 1, label: 'X' })).statusCode,
    404,
  )
  assert.equal((await call(hub, ana, 'DELETE', `${accounts}/${carlas.id}`)).statusCode, 204)
  assert.equal(
    (await hub.test.asOwner(`select id from builder.model_account where id = $1`, [carlas.id]))
      .length,
    1,
  )
})

test('pausar e retomar com a revisão lida; velha dá 412; remover só quem pode, e o segundo dá 204', async (t) => {
  const { hub, ana, bruno, carla, accounts } = await company(t)
  const account = Object((await link(hub, ana, accounts, {})).json()).account
  const url = `${accounts}/${account.id}`
  const paused = await patch(hub, bruno, url, { revision: 1, state: 'paused' })
  assert.equal(paused.statusCode, 200)
  assert.deepEqual(
    [Object(paused.json()).account.state, Object(paused.json()).account.revision],
    ['paused', 2],
  )
  const stale = await patch(hub, ana, url, { revision: 1, state: 'ready' })
  assert.equal(stale.statusCode, 412)
  assert.equal(codeOf(stale), 'MODEL_ACCOUNT_STALE')
  const resumed = await patch(hub, ana, url, { revision: 2, state: 'ready', label: 'Time Um' })
  assert.deepEqual(
    [Object(resumed.json()).account.state, Object(resumed.json()).account.label],
    ['ready', 'Time Um'],
  )
  // Step 12 writes `refused`; such an account is linked again, never paused or resumed.
  await hub.test.asOwner(`update builder.model_account set state = 'refused'`)
  const refused = await patch(hub, ana, url, { revision: 3, state: 'paused' })
  assert.deepEqual([refused.statusCode, codeOf(refused)], [409, 'MODEL_ACCOUNT_LINK_AGAIN'])
  const renamed = await patch(hub, ana, url, { revision: 3, label: 'Time 1' })
  assert.equal(Object(renamed.json()).account.state, 'refused')
  const unnamed = await patch(hub, ana, url, { revision: 4, label: ' ' })
  assert.deepEqual([unnamed.statusCode, codeOf(unnamed)], [422, 'MODEL_ACCOUNT_LABEL_INVALID'])
  assert.equal((await call(hub, carla, 'DELETE', url)).statusCode, 404)
  assert.equal((await call(hub, bruno, 'DELETE', url)).statusCode, 204)
  assert.equal((await call(hub, bruno, 'DELETE', url)).statusCode, 204)
  const own = Object((await link(hub, carla, accounts, { owner: 'me' })).json()).account
  assert.equal((await call(hub, carla, 'DELETE', `${accounts}/${own.id}`)).statusCode, 204)
  assert.deepEqual(await hub.test.asOwner(`select id from builder.model_account`), [])
})

test('modelo padrão: dono e administrador, qualquer do registro; membro 404; fora 422 MODEL_UNKNOWN', async (t) => {
  const { hub, ana, bruno, carla, base, accounts } = await company(t)
  const url = `${base}/default-model`
  const set = await call(hub, ana, 'PUT', url, { model: 'anthropic/claude-sonnet-4-5' })
  assert.deepEqual(
    [set.statusCode, set.json()],
    [200, { defaultModel: 'anthropic/claude-sonnet-4-5' }],
  )
  // A model of a provider that links by more than a key is still the registry's (founder, C4).
  assert.equal(
    (await call(hub, bruno, 'PUT', url, { model: 'google/gemini-2.5-flash' })).statusCode,
    200,
  )
  assert.equal(
    (await call(hub, carla, 'PUT', url, { model: 'openai/gpt-4o-mini' })).statusCode,
    404,
  )
  // The admission comes before the model's check: a member learns nothing from a wrong model.
  assert.equal((await call(hub, carla, 'PUT', url, { model: 'nenhum/x' })).statusCode, 404)
  for (const model of ['anthropic/claude-nenhum', 'claude-sonnet-4-5', 'nenhum/x']) {
    const refused = await call(hub, ana, 'PUT', url, { model })
    assert.deepEqual([refused.statusCode, codeOf(refused)], [422, 'MODEL_UNKNOWN'])
  }
  assert.equal(
    Object((await call(hub, carla, 'GET', accounts)).json()).defaultModel,
    'google/gemini-2.5-flash',
  )
})
