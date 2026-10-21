import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { CARLA, call, codeOf, memberOn, plantCompany, post } from '../../hub/identity/test-hub.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import { conversing, MODEL } from './test-conversation.ts'

const GPT = 'openai/gpt-5'
const GROQ = 'groq/llama-3.3-70b-versatile'

/** Empresa Teste with Ana's Anthropic key and its default `MODEL`; Carla is a member. */
async function company(t: TestContext) {
  const made = await conversing(t, () => ({ kind: 'text', text: 'Resposta' }))
  const carla = await memberOn(made.hub, made.companyId, CARLA, 'member')
  const base = `/api/companies/${made.companyId}`
  return {
    ...made,
    carla,
    base,
    accounts: `${base}/model-accounts`,
    mine: `${base}/my-model-default`,
  }
}

async function connect(
  hub: Hub,
  person: Person,
  accounts: string,
  provider: string,
  owner = 'company',
) {
  const body = { owner, provider, label: provider, key: `sk-${provider}-${randomUUID()}` }
  const linked = await post(hub, person, accounts, body)
  assert.equal(linked.statusCode, 201, linked.body)
  return String(Object(linked.json()).account.id)
}

function patch(hub: Hub, person: Person, url: string, body: object) {
  return hub.app.inject({
    method: 'PATCH',
    url,
    headers: { origin: TEST_ORIGIN, cookie: person.cookie, 'content-type': 'application/json' },
    payload: JSON.stringify(body),
  })
}

async function created(hub: Hub, person: Person, conversations: string, body: object = {}) {
  const made = await post(hub, person, conversations, body, randomUUID())
  const id = made.statusCode === 201 ? String(Object(made.json()).conversation.id) : undefined
  return { made, id }
}

async function pairOf(hub: Hub, person: Person, conversations: string, id: string | undefined) {
  const read = await call(hub, person, 'GET', `${conversations}/${id}`)
  const { model, effort } = Object(read.json()).conversation
  return { model, effort }
}

async function startOf(hub: Hub, person: Person, accounts: string) {
  return Object((await call(hub, person, 'GET', accounts)).json()).defaults.start
}

test('uma conversa nova começa no padrão da pessoa, senão no da empresa, e copia o par ao nascer', async (t) => {
  const { hub, ana, carla, conversations, mine } = await company(t)
  const company_ = await created(hub, carla, conversations)
  assert.deepEqual(await pairOf(hub, carla, conversations, company_.id), {
    model: MODEL,
    effort: 'off',
  })
  const saved = { model: MODEL, effort: 'high' }
  assert.equal((await call(hub, carla, 'PUT', mine, saved)).statusCode, 200)
  const personal = await created(hub, carla, conversations)
  assert.deepEqual(await pairOf(hub, carla, conversations, personal.id), saved)
  // Another default later changes no conversation that exists (criterion 5).
  assert.equal(
    (await call(hub, carla, 'PUT', mine, { model: MODEL, effort: 'low' })).statusCode,
    200,
  )
  assert.deepEqual(await pairOf(hub, carla, conversations, personal.id), saved)
  assert.deepEqual(await pairOf(hub, carla, conversations, company_.id), {
    model: MODEL,
    effort: 'off',
  })
  // The default of one person is not the default of another.
  const owners = await created(hub, ana, conversations)
  assert.deepEqual(await pairOf(hub, ana, conversations, owners.id), {
    model: MODEL,
    effort: 'off',
  })
  assert.equal((await call(hub, carla, 'DELETE', mine)).statusCode, 204)
  const cleared = await created(hub, carla, conversations)
  assert.deepEqual(await pairOf(hub, carla, conversations, cleared.id), {
    model: MODEL,
    effort: 'off',
  })
})

test('o padrão sem conta usável é pulado: pausada, no limite, de outra pessoa; nenhum degrau usável é 422 e nada nasce', async (t) => {
  const { hub, ana, carla, conversations, accounts, mine } = await company(t)
  const companyAccount = await connect(hub, ana, accounts, 'openai')
  assert.equal(
    (await call(hub, carla, 'PUT', mine, { model: GPT, effort: 'high' })).statusCode,
    200,
  )
  const first = await created(hub, carla, conversations)
  assert.deepEqual(await pairOf(hub, carla, conversations, first.id), {
    model: GPT,
    effort: 'high',
  })

  // Paused: the person's default is skipped and the company's takes over.
  const paused = await patch(hub, ana, `${accounts}/${companyAccount}`, {
    revision: 1,
    state: 'paused',
  })
  assert.equal(paused.statusCode, 200)
  const skipped = await created(hub, carla, conversations)
  assert.deepEqual(await pairOf(hub, carla, conversations, skipped.id), {
    model: MODEL,
    effort: 'off',
  })
  assert.deepEqual((await startOf(hub, carla, accounts)).from, 'company')

  // In its limit.
  await patch(hub, ana, `${accounts}/${companyAccount}`, { revision: 2, state: 'ready' })
  await hub.test.asOwner(
    `update builder.model_account set limited_until = now() + interval '1 hour' where provider = 'openai'`,
  )
  const limited = await created(hub, carla, conversations)
  assert.deepEqual(await pairOf(hub, carla, conversations, limited.id), {
    model: MODEL,
    effort: 'off',
  })

  // The only OpenAI account is Ana's own: it is not Carla's.
  await call(hub, ana, 'DELETE', `${accounts}/${companyAccount}`)
  await connect(hub, ana, accounts, 'openai', 'me')
  const other = await created(hub, carla, conversations)
  assert.deepEqual(await pairOf(hub, carla, conversations, other.id), {
    model: MODEL,
    effort: 'off',
  })

  // No step has an account: 422, and no conversation is created.
  const before = await hub.test.asOwner(`select id from builder.conversation`)
  await hub.test.asOwner(`delete from builder.model_account where provider = 'anthropic'`)
  const refused = await created(hub, carla, conversations)
  assert.deepEqual([refused.made.statusCode, codeOf(refused.made)], [422, 'MODEL_NO_ACCOUNT'])
  assert.deepEqual(await hub.test.asOwner(`select id from builder.conversation`), before)
  assert.equal(await startOf(hub, carla, accounts), null)
})

test('a conversa com modelo pedido: o nível do padrão da pessoa nesse modelo, depois o da empresa, senão Desligado', async (t) => {
  const { hub, ana, carla, conversations, accounts, mine } = await company(t)
  await connect(hub, ana, accounts, 'openai')
  async function ask(who: Person, model: string) {
    const { id, made } = await created(hub, who, conversations, { model })
    return id === undefined ? [made.statusCode, codeOf(made)] : pairOf(hub, who, conversations, id)
  }
  assert.deepEqual(await ask(carla, MODEL), { model: MODEL, effort: 'off' })
  assert.equal(
    (await call(hub, carla, 'PUT', mine, { model: GPT, effort: 'high' })).statusCode,
    200,
  )
  assert.deepEqual(await ask(carla, GPT), { model: GPT, effort: 'high' })
  assert.deepEqual(await ask(carla, MODEL), { model: MODEL, effort: 'off' })
  assert.deepEqual(await ask(ana, MODEL), { model: MODEL, effort: 'off' })
  // A model with no account the person may use, and one off the registry.
  assert.deepEqual(await ask(carla, 'google/gemini-2.5-pro'), [422, 'MODEL_NO_ACCOUNT'])
  assert.deepEqual(await ask(carla, 'nenhum/x'), [422, 'MODEL_UNKNOWN'])
})

test('o nível guardado que o modelo não aceita desce ao mais alto aceito abaixo, senão ao mais baixo', async (t) => {
  const { hub, ana, carla, conversations, accounts } = await company(t)
  await connect(hub, ana, accounts, 'openai')
  await connect(hub, ana, accounts, 'groq')
  async function keep(model: string, effort: string) {
    await hub.test.asOwner(`delete from builder.person_model_default`)
    await hub.test.asOwner(
      `insert into builder.person_model_default (company_id, person_id, model, effort) select company_id, user_id, '${model}', '${effort}' from auth.member where user_id = '${carla.id}'`,
    )
    const { id } = await created(hub, carla, conversations, { model })
    return pairOf(hub, carla, conversations, id)
  }
  // Groq's model takes no level at all; GPT-5 takes low, medium and high, and cannot be off.
  assert.deepEqual(await keep(GROQ, 'high'), { model: GROQ, effort: 'off' })
  assert.deepEqual(await keep(GPT, 'max'), { model: GPT, effort: 'high' })
  assert.deepEqual(await keep(GPT, 'off'), { model: GPT, effort: 'low' })
  assert.deepEqual(await keep(GPT, 'xhigh'), { model: GPT, effort: 'high' })
  // The same rule when the default itself starts a conversation.
  await hub.test.asOwner(`update builder.person_model_default set effort = 'max'`)
  const { id } = await created(hub, carla, conversations)
  assert.deepEqual(await pairOf(hub, carla, conversations, id), { model: GPT, effort: 'high' })
})

test('o modelo inicial: sem padrão a empresa só com chave OpenAI abre em GPT-5; com Claude e OpenAI, no Claude; só com Gemini, no Gemini', async (t) => {
  const { hub, ana, carla, conversations, accounts } = await company(t)
  await hub.test.asOwner(`delete from builder.company_model`)
  assert.deepEqual(await startOf(hub, carla, accounts), {
    model: MODEL,
    effort: 'off',
    from: 'starter',
  })
  await connect(hub, ana, accounts, 'openai')
  const both = await created(hub, carla, conversations)
  assert.deepEqual(await pairOf(hub, carla, conversations, both.id), {
    model: MODEL,
    effort: 'off',
  })
  await hub.test.asOwner(`delete from builder.model_account where provider = 'anthropic'`)
  // GPT-5 cannot be off, so the starter's `off` becomes the lowest level it takes.
  const expected = { model: GPT, effort: 'low' }
  assert.deepEqual(await startOf(hub, carla, accounts), { ...expected, from: 'starter' })
  const alone = await created(hub, carla, conversations)
  assert.deepEqual(await pairOf(hub, carla, conversations, alone.id), expected)
  // Gemini is the last starter, and a model of the registry like the others.
  await hub.test.asOwner(`delete from builder.model_account`)
  await connect(hub, ana, accounts, 'google')
  assert.deepEqual(await startOf(hub, carla, accounts), {
    model: 'google/gemini-2.5-pro',
    effort: 'low',
    from: 'starter',
  })
})

test('padrão pessoal: todo membro grava o seu, relê, limpa duas vezes; as recusas são as do padrão da empresa', async (t) => {
  const { hub, ana, carla, accounts, mine } = await company(t)
  const saved = { model: MODEL, effort: 'medium' }
  const set = await call(hub, carla, 'PUT', mine, saved)
  assert.deepEqual([set.statusCode, set.json()], [200, { mine: saved }])
  assert.equal((await call(hub, carla, 'PUT', mine, saved)).statusCode, 200)
  const read = Object((await call(hub, carla, 'GET', accounts)).json())
  assert.deepEqual(
    [read.defaults.mine, read.defaults.company],
    [saved, { model: MODEL, effort: 'off' }],
  )
  assert.deepEqual(read.defaults.start, { ...saved, from: 'mine' })
  const others = Object((await call(hub, ana, 'GET', accounts)).json())
  assert.equal(others.defaults.mine, null)
  const refusals: [object, string][] = [
    [{ model: 'nenhum/x', effort: 'off' }, 'MODEL_UNKNOWN'],
    [{ model: MODEL, effort: 'max' }, 'EFFORT_UNSUPPORTED'],
    [{ model: GPT, effort: 'low' }, 'MODEL_NO_ACCOUNT'],
  ]
  for (const [body, code] of refusals) {
    const refused = await call(hub, carla, 'PUT', mine, body)
    assert.deepEqual([refused.statusCode, codeOf(refused)], [422, code])
  }
  // Another company, which Carla is not in, and one that does not exist, answer alike (S10).
  const elsewhere = await plantCompany(hub.test, ana.id)
  for (const id of [elsewhere, 'desconhecida']) {
    const url = `/api/companies/${id}/my-model-default`
    assert.equal((await call(hub, carla, 'PUT', url, saved)).statusCode, 404)
    assert.equal((await call(hub, carla, 'DELETE', url)).statusCode, 404)
  }
  assert.equal((await call(hub, carla, 'DELETE', mine)).statusCode, 204)
  assert.equal((await call(hub, carla, 'DELETE', mine)).statusCode, 204)
  const cleared = Object((await call(hub, carla, 'GET', accounts)).json())
  assert.equal(cleared.defaults.mine, null)
})

test('os fornecedores conectados: em qualquer estado, os da pessoa ou dados a ela, e os da empresa; salvar fora deles é 422', async (t) => {
  const { hub, ana, carla, accounts, mine, base } = await company(t)
  async function connectedOf(who: Person) {
    return Object((await call(hub, who, 'GET', accounts)).json()).connected
  }
  assert.deepEqual(await connectedOf(carla), { mine: ['anthropic'], company: ['anthropic'] })
  // A paused account is still connected; one given only to Ana is not Carla's.
  const openai = await connect(hub, ana, accounts, 'openai')
  await call(hub, ana, 'PUT', `${accounts}/${openai}/assignees`, { personIds: [ana.id] })
  await patch(hub, ana, `${accounts}/${openai}`, { revision: 2, state: 'paused' })
  assert.deepEqual(await connectedOf(carla), {
    mine: ['anthropic'],
    company: ['anthropic', 'openai'],
  })
  assert.deepEqual(await connectedOf(ana), {
    mine: ['anthropic', 'openai'],
    company: ['anthropic', 'openai'],
  })
  const refused = await call(hub, carla, 'PUT', mine, { model: GPT, effort: 'low' })
  assert.deepEqual([refused.statusCode, codeOf(refused)], [422, 'MODEL_NO_ACCOUNT'])
  // Carla's own key makes the provider hers, not the company's.
  await connect(hub, carla, accounts, 'groq', 'me')
  assert.deepEqual(await connectedOf(carla), {
    mine: ['anthropic', 'groq'],
    company: ['anthropic', 'openai'],
  })
  assert.equal(
    (await call(hub, carla, 'PUT', mine, { model: GROQ, effort: 'off' })).statusCode,
    200,
  )
  const company_ = await call(hub, ana, 'PUT', `${base}/default-model`, {
    model: GROQ,
    effort: 'off',
  })
  assert.deepEqual([company_.statusCode, codeOf(company_)], [422, 'MODEL_NO_ACCOUNT'])
})
