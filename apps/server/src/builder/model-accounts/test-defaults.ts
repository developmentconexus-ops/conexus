import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import type { Hub, Person } from '../../hub/identity/test-hub.ts'
import { CARLA, call, memberOn, post } from '../../hub/identity/test-hub.ts'
import { queued, TEST_ORIGIN, withOwnerLock } from '../../platform/test-database.ts'
import { conversing } from '../conversation/test-conversation.ts'
import { sessionStateOf } from '../conversation/test-questions.ts'
import { listKeyProviders } from './providers.ts'

/** A Groq chat model the installed registry lists and has not retired, read from it. */
export const GROQ_MODEL = (() => {
  const model = listKeyProviders().find(({ id }) => id === 'groq')?.models[0]
  if (model === undefined) throw new Error('The registry lists no Groq chat model.')
  return model.id
})()

/** Resolves once `holds` is true, asked again every 50 ms; fails naming `what` past `ms`. */
export async function until(holds: () => boolean | Promise<boolean>, what: string, ms = 10_000) {
  const deadline = Date.now() + ms
  while (!(await holds())) {
    assert.ok(Date.now() < deadline, `${what} within ${ms} ms`)
    await sleep(50)
  }
}

/** The conversation's title once Mastra has stored it, which it does after the turn's end. */
export async function titleOf(hub: Hub, person: Person, url: string): Promise<unknown> {
  let title: unknown = null
  await until(async () => {
    title = Object((await call(hub, person, 'GET', url)).json()).conversation.title
    return title !== null
  }, 'the conversation has its title')
  return title
}

/** Locks account `label` until both `asks` queue on it: one renews, the other waits on its lease. */
export function bothOnTheLease<T>(hub: Hub, label: string, asks: () => Promise<T>): Promise<T> {
  const row = `select 1 from builder.model_account where label = $1 for update`
  return withOwnerLock(hub.test, row, [label], async (release) => {
    const both = asks()
    await queued(hub.test, 2, both)
    await release()
    return both
  })
}

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
  const { model, effort } = await sessionStateOf(hub, person, `${conversations}/${id}`)
  return { model, effort }
}

export async function startOf(hub: Hub, person: Person, accounts: string) {
  return Object((await call(hub, person, 'GET', accounts)).json()).defaults.start
}
