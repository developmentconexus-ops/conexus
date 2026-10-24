import assert from 'node:assert/strict'
import { test } from 'node:test'
import { call, codeOf } from '../../hub/identity/test-hub.ts'
import { company, connect, created } from './test-defaults.ts'

const GPT = 'openai/gpt-5'

test('o início da empresa vem da mesma ordem, sem o degrau da pessoa: o padrão pulado cai no modelo inicial', async (t) => {
  const { hub, ana, accounts, base } = await company(t)
  async function companyStart() {
    return Object((await call(hub, ana, 'GET', accounts)).json()).defaults.companyStart
  }
  const gpt = { model: GPT, effort: 'high' }
  await connect(hub, ana, accounts, 'openai')
  assert.equal((await call(hub, ana, 'PUT', `${base}/default-model`, gpt)).statusCode, 200)
  assert.deepEqual(await companyStart(), { ...gpt, from: 'company', account: 'openai' })
  // Ana's own account is not the company's: it never starts the company's people.
  await hub.test.asOwner(`delete from builder.model_account where provider = 'openai'`)
  await connect(hub, ana, accounts, 'openai', 'me')
  assert.deepEqual(await companyStart(), {
    model: 'anthropic/claude-sonnet-5-5',
    effort: 'low',
    from: 'starter',
    account: 'Time 1',
  })
  await hub.test.asOwner(`delete from builder.model_account`)
  assert.equal(await companyStart(), null)
})

test('um modelo que o seletor não oferece não vira padrão nem começa conversa: de imagem ou aposentado é MODEL_UNKNOWN', async (t) => {
  const { hub, ana, carla, conversations, accounts, mine, base } = await company(t)
  await connect(hub, ana, accounts, 'openai')
  for (const model of ['openai/gpt-image-1', 'openai/o1']) {
    const body = { model, effort: 'off' }
    for (const url of [mine, `${base}/default-model`]) {
      const refused = await call(hub, carla, 'PUT', url, body)
      assert.deepEqual(
        [refused.statusCode, codeOf(refused)],
        [url === mine ? 422 : 404, url === mine ? 'MODEL_UNKNOWN' : 'NOT_FOUND'],
      )
    }
    const asked = await created(hub, carla, conversations, { model })
    assert.deepEqual([asked.made.statusCode, codeOf(asked.made)], [422, 'MODEL_UNKNOWN'])
  }
})
