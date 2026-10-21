import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { CARLA, call, memberOn, post } from '../../hub/identity/test-hub.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import { conversing } from './test-conversation.ts'

/** Empresa Teste with Ana's Anthropic key and its default `MODEL`; Carla is a member. */
export async function company(t: TestContext) {
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

export async function connect(
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

export function patch(hub: Hub, person: Person, url: string, body: object) {
  return hub.app.inject({
    method: 'PATCH',
    url,
    headers: { origin: TEST_ORIGIN, cookie: person.cookie, 'content-type': 'application/json' },
    payload: JSON.stringify(body),
  })
}

export async function created(hub: Hub, person: Person, conversations: string, body: object = {}) {
  const made = await post(hub, person, conversations, body, randomUUID())
  const id = made.statusCode === 201 ? String(Object(made.json()).conversation.id) : undefined
  return { made, id }
}

export async function pairOf(
  hub: Hub,
  person: Person,
  conversations: string,
  id: string | undefined,
) {
  const read = await call(hub, person, 'GET', `${conversations}/${id}`)
  const { model, effort } = Object(read.json()).conversation
  return { model, effort }
}

export async function startOf(hub: Hub, person: Person, accounts: string) {
  return Object((await call(hub, person, 'GET', accounts)).json()).defaults.start
}
