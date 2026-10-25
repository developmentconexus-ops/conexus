import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Person } from '../../hub/identity/test-hub.ts'
import { call, codeOf, post } from '../../hub/identity/test-hub.ts'
import { asked, conversing, endOf, KEY, turnNotices } from '../conversation/test-conversation.ts'
import { company, connect, created, GROQ_MODEL, pairOf, patch } from './test-defaults.ts'

const SONNET_NEW = 'anthropic/claude-sonnet-5-5'
const SONNET_OLD = 'anthropic/claude-sonnet-4-5'
const GPT = 'openai/gpt-5'
const GROQ = GROQ_MODEL

/** The models the pickers offer the company, read from the Hub. */
async function offered(
  hub: Parameters<typeof call>[0],
  who: Parameters<typeof call>[1],
  url: string,
) {
  const { choices } = Object((await call(hub, who, 'GET', url)).json())
  return choices.company.flatMap((one: { models: { id: string }[] }) =>
    one.models.map((model) => model.id),
  )
}

test('a lista do fornecedor decide o que o seletor oferece e o que vale como padrão ou como início', async (t) => {
  const { hub, ana, carla, conversations, accounts, mine, base } = await company(t)
  await hub.test.asOwner(`delete from builder.model_account`)
  await connect(hub, ana, accounts, 'anthropic', 'company', ['claude-sonnet-5-5'])
  assert.deepEqual(await offered(hub, ana, accounts), [SONNET_NEW])
  for (const url of [mine, `${base}/default-model`]) {
    const refused = await call(hub, url === mine ? carla : ana, 'PUT', url, {
      model: SONNET_OLD,
      effort: 'off',
    })
    assert.deepEqual([refused.statusCode, codeOf(refused)], [422, 'MODEL_NO_ACCOUNT'])
  }
  const asked = await created(hub, carla, conversations, { model: SONNET_OLD })
  assert.deepEqual([asked.made.statusCode, codeOf(asked.made)], [422, 'MODEL_NO_ACCOUNT'])
  const saved = await call(hub, carla, 'PUT', mine, { model: SONNET_NEW, effort: 'low' })
  assert.equal(saved.statusCode, 200)
})

test('uma conta que atende ao modelo vale ao lado de uma que não atende: o início e a conta são as dela', async (t) => {
  const { hub, ana, carla, conversations, accounts, base } = await company(t)
  await hub.test.asOwner(`delete from builder.model_account`)
  await connect(hub, ana, accounts, 'anthropic', 'company', ['claude-sonnet-5-5'])
  await hub.test.asOwner(`update builder.model_account set label = 'Sem o 4.5'`)
  await connect(hub, ana, accounts, 'anthropic', 'company', ['claude-sonnet-4-5'])
  await hub.test.asOwner(
    `update builder.model_account set label = 'Com o 4.5' where label = 'anthropic'`,
  )
  const chosen = await call(hub, ana, 'PUT', `${base}/default-model`, {
    model: SONNET_OLD,
    effort: 'off',
  })
  assert.equal(chosen.statusCode, 200, chosen.body)
  const read = Object((await call(hub, carla, 'GET', accounts)).json())
  assert.deepEqual(read.defaults.start, {
    model: SONNET_OLD,
    effort: 'off',
    from: 'company',
    account: 'Com o 4.5',
  })
  const made = await created(hub, carla, conversations)
  assert.deepEqual(await pairOf(hub, carla, conversations, made.id), {
    model: SONNET_OLD,
    effort: 'off',
  })
  // The only account that served it leaves: the default is skipped, the starter takes over.
  await hub.test.asOwner(`delete from builder.model_account where label = 'Com o 4.5'`)
  const after = Object((await call(hub, carla, 'GET', accounts)).json())
  assert.deepEqual([after.defaults.start.model, after.defaults.start.from], [SONNET_NEW, 'starter'])
})

test('a lista que não veio na ligação deixa o modelo do registro; a lista em páginas vem inteira; OpenAI e Google valem', async (t) => {
  const { hub, ana, accounts } = await company(t)
  await hub.test.asOwner(`delete from builder.model_account`)
  await connect(hub, ana, accounts, 'anthropic')
  const [unread] = await hub.test.asOwner(
    `select served_models, served_at from builder.model_account`,
  )
  assert.deepEqual(unread, { served_models: null, served_at: null })
  assert.ok((await offered(hub, ana, accounts)).includes(SONNET_OLD))
  await hub.test.asOwner(`delete from builder.model_account`)
  hub.test.lists.pageSize = 2
  const ids = [
    'claude-sonnet-5-5',
    'claude-opus-4-5-20251101',
    'claude-haiku-4-5-20251001',
    'x',
    'y',
  ]
  await connect(hub, ana, accounts, 'anthropic', 'company', ids)
  const [paged] = await hub.test.asOwner(`select served_models from builder.model_account`)
  assert.deepEqual(Object(paged).served_models, ids)
  await connect(hub, ana, accounts, 'openai', 'company', [
    'gpt-5',
    'gpt-image-1',
    'text-embedding-3',
  ])
  await connect(hub, ana, accounts, 'google', 'company', ['gemini-2.5-pro'])
  const models = await offered(hub, ana, accounts)
  assert.deepEqual(
    models.filter((id: string) => !id.startsWith('anthropic/')),
    ['google/gemini-2.5-pro', 'openai/gpt-5'],
  )
})

test('o fornecedor responde 404 ao modelo: a lista da conta é lida de novo e o turno segue na conta que atende', async (t) => {
  const other = 'sk-ant-served-other-key-0001'
  const base = await conversing(t, (sent) =>
    sent.stream && sent.key === KEY
      ? { kind: 'refuse', status: 404 }
      : { kind: 'text', text: 'Pronto.' },
  )
  const { hub, ana, companyId, conversations, anthropic } = base
  hub.test.lists.served.set(KEY, ['claude-sonnet-5-5'])
  hub.test.lists.served.set(other, ['claude-sonnet-4-6'])
  const body = { owner: 'company', provider: 'anthropic', label: 'Dois', key: other }
  const linked = await post(hub, ana, `/api/companies/${companyId}/model-accounts`, body)
  assert.equal(linked.statusCode, 201)
  const { url, events } = await asked(t, { hub, person: ana, conversations })
  const streamed = anthropic.sent.filter((each) => each.stream).map((each) => each.key)
  assert.deepEqual(streamed, [KEY, other])
  assert.equal(endOf(events), 'complete')
  assert.deepEqual(await turnNotices(hub, ana, url), [
    'Time 1 não atende a este modelo; continuei pela Dois.',
  ])
  const rows = await hub.test.asOwner(
    `select label, served_models from builder.model_account order by position`,
  )
  assert.deepEqual(rows, [
    { label: 'Time 1', served_models: ['claude-sonnet-5-5'] },
    { label: 'Dois', served_models: ['claude-sonnet-4-6'] },
  ])
})

test('os fornecedores conectados: em qualquer estado, os da pessoa ou dados a ela, e os da empresa; salvar fora deles é 422', async (t) => {
  const { hub, ana, carla, accounts, mine, base } = await company(t)
  async function connectedOf(who: Person) {
    const { choices } = Object((await call(hub, who, 'GET', accounts)).json())
    return {
      mine: choices.mine.map((one: { id: string }) => one.id),
      company: choices.company.map((one: { id: string }) => one.id),
    }
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
