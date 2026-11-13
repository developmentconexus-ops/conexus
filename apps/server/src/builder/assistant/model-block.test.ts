import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { ATTEMPT_KEY_HEADER } from '@conexus/hub-api'
import { post } from '../../hub/identity/test-hub.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import { plantCodex } from '../../platform/test-openai-codex.ts'
import { assisting, created, talking } from './test-assistant.ts'

const BLOCK = /<autonomy_and_persistence>[\s\S]*check each part of it against what you found/
const AGENT_RULE = /autonomy_and_persistence|Reading is always allowed|failed read|ask the person/i

type On = Awaited<ReturnType<typeof assisting>>

/** The company's ChatGPT subscription, signed in through the double's device flow. */
async function subscribed(on: On) {
  await on.hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'openai_codex')`,
    [on.companyId],
  )
  const signIns = `${on.company}/model-account-sign-ins`
  const begun = await post(on.hub, on.ana, signIns, {
    owner: 'company',
    kind: 'openai_codex',
    label: 'Assinatura',
  })
  assert.equal(begun.statusCode, 201, begun.body)
  const polled = await on.hub.app.inject({
    method: 'POST',
    url: `${signIns}/${String(Object(begun.json()).signInId)}/poll`,
    headers: { origin: TEST_ORIGIN, cookie: on.ana.cookie, [ATTEMPT_KEY_HEADER]: randomUUID() },
  })
  assert.equal(polled.statusCode, 200, polled.body)
}

/** One Assistant turn on `model`; the model's double refuses it, so only what was sent counts. */
async function askedOn(t: TestContext, on: On, model: string) {
  const url = await created(on.hub, on.ana, on.assistant, { connections: [], model, effort: 'low' })
  await (await talking(t, on.hub, on.ana, url)).say('Oi')
}

/** The bodies the turn sent to the Responses API with an OpenAI key, each refused. */
function plantResponses(t: TestContext): unknown[] {
  const bodies: unknown[] = []
  const real = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input)
    if (url !== 'https://api.openai.com/v1/responses') return real(input, init)
    bodies.push(JSON.parse(String(init?.body)))
    return Response.json({ error: { message: 'planted' } }, { status: 500 })
  }
  t.after(() => {
    globalThis.fetch = real
  })
  return bodies
}

test('o bloco do Luna vai no prompt do Assistente pela assinatura do ChatGPT, e o transporte leva só o texto fixo curto', async (t) => {
  const codex = plantCodex(t)
  codex.typed = true
  const on = await assisting(t)
  await subscribed(on)

  await askedOn(t, on, 'openai/gpt-6-luna')
  const luna = codex.calls.filter((made) => made.endpoint === 'responses')
  assert.ok(luna.length > 0)
  for (const made of luna) {
    const body = Object(JSON.parse(made.body))
    assert.match(JSON.stringify(body.input), BLOCK)
    assert.doesNotMatch(String(body.instructions), AGENT_RULE)
  }

  const before = codex.calls.length
  await askedOn(t, on, 'openai/gpt-5.2')
  const other = codex.calls.slice(before).filter((made) => made.endpoint === 'responses')
  assert.ok(other.length > 0)
  for (const made of other) {
    const body = Object(JSON.parse(made.body))
    assert.doesNotMatch(JSON.stringify(body.input), /autonomy_and_persistence/)
    assert.equal(body.instructions, Object(JSON.parse(luna[0]?.body ?? '{}')).instructions)
  }
})

test('o bloco do Luna vai no prompt do Assistente também por uma chave da OpenAI', async (t) => {
  const bodies = plantResponses(t)
  const on = await assisting(t)
  const key = 'sk-openai-planted'
  on.hub.test.lists.served.set(key, ['gpt-5.6-luna'])
  const openai = { owner: 'company', provider: 'openai', label: 'OpenAI', key }
  const linked = await post(on.hub, on.ana, `${on.company}/model-accounts`, openai)
  assert.equal(linked.statusCode, 201, linked.body)

  await askedOn(t, on, 'openai/gpt-5.6-luna')
  assert.ok(bodies.length > 0)
  for (const body of bodies) assert.match(JSON.stringify(Object(body).input), BLOCK)
})

test('um modelo sem bloco não leva o bloco do Luna', async (t) => {
  const on = await assisting(t)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  await (await talking(t, on.hub, on.ana, url)).say('Oi')
  assert.ok(on.calls.length > 0)
  for (const asked of on.calls) assert.doesNotMatch(asked.system, /autonomy_and_persistence/)
})
