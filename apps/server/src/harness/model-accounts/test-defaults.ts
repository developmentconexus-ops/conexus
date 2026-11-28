import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import {
  ANA_OWNER,
  CARLA,
  call,
  hubWithLog,
  memberOn,
  personOn,
  plantCompany,
  post,
} from '../../hub/identity/test-hub.ts'
import { plantAnthropic } from '../../platform/test-anthropic.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import { listKeyProviders } from './providers.ts'

/** A Groq chat model the installed registry lists and has not retired, read from it. */
export const GROQ_MODEL = (() => {
  const model = listKeyProviders().find(({ id }) => id === 'groq')?.models[0]
  if (model === undefined) throw new Error('The registry lists no Groq chat model.')
  return model.id
})()

/** Empresa Teste with Ana's Anthropic key and its default `MODEL`; Carla is a member. */
export async function company(t: TestContext) {
  plantAnthropic(t, () => ({ kind: 'text', text: 'Resposta' }))
  const hub = await hubWithLog(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id)
  const base = `/api/companies/${companyId}`
  const accounts = `${base}/model-accounts`
  const linked = await post(hub, ana, accounts, {
    owner: 'company',
    provider: 'anthropic',
    label: 'Time 1',
    key: 'sk-ant-conversation-key-0001',
  })
  assert.equal(linked.statusCode, 201)
  const model = { model: 'anthropic/claude-sonnet-4-6', effort: 'off' }
  assert.equal((await call(hub, ana, 'PUT', `${base}/default-model`, model)).statusCode, 200)
  const carla = await memberOn(hub, companyId, CARLA, 'member')
  return { hub, ana, companyId, carla, base, accounts, mine: `${base}/my-model-default` }
}

export async function connect(
  hub: Hub,
  person: Person,
  accounts: string,
  provider: string,
  owner = 'company',
  served?: string[],
) {
  const key = `sk-${provider}-${randomUUID()}`
  if (served !== undefined) hub.test.lists.served.set(key, served)
  const body = { owner, provider, label: provider, key }
  const linked = await post(hub, person, accounts, body)
  assert.equal(linked.statusCode, 201, linked.body)
  return String(Object(linked.json()).account.id)
}

export function patch(hub: Hub, person: Person, url: string, body: object) {
  return hub.app.inject({
    method: 'PATCH',
    url,
    headers: { origin: TEST_ORIGIN, cookie: person.cookie, 'content-type': 'application/json' },
    payload: JSON.stringify(body),
  })
}
