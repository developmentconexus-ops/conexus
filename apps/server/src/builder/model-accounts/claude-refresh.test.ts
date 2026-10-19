import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { call, post } from '../../hub/identity/test-hub.ts'
import { asked, conversing, KEY, noticesOf } from '../conversation/test-conversation.ts'

const FIRST = { access: 'sk-ant-oat01-first-access', refresh: 'sk-ant-ort01-first-refresh' }
const SECOND = { access: 'sk-ant-oat01-second-access', refresh: 'sk-ant-ort01-second-refresh' }

/**
 * Empresa Teste with the Claude subscription "Claude" ahead of the key "Time 1" in the Anthropic
 * queue; `refused` is the status the Messages API gives the subscription's bearer tokens.
 */
async function subscribed(t: TestContext, expiresIn: number) {
  const refused: { status: 401 | undefined } = { status: 401 }
  const base = await conversing(t, (call) =>
    call.bearer !== null && refused.status !== undefined
      ? { kind: 'refuse', status: refused.status }
      : { kind: 'text', text: 'Pronto.' },
  )
  const { hub, ana, companyId, anthropic } = base
  anthropic.refresh = (token) =>
    token === FIRST.refresh
      ? { status: 200, tokens: { ...SECOND, expiresIn: 3600 } }
      : { status: 400 }
  await hub.test.asOwner(
    `insert into builder.company_account_kind (company_id, kind) values ($1, 'claude_subscription')`,
    [companyId],
  )
  const signIns = `/api/companies/${companyId}/model-account-sign-ins`
  const body = { owner: 'company', kind: 'claude_subscription', label: 'Claude' }
  const started = Object((await post(hub, ana, signIns, body)).json())
  const verifier = String(new URL(started.url).searchParams.get('state'))
  const original = anthropic.refresh
  anthropic.refresh = () => ({ status: 200, tokens: { ...FIRST, expiresIn } })
  const linked = await post(hub, ana, `${signIns}/${started.signInId}`, { code: `c#${verifier}` })
  assert.equal(linked.statusCode, 201, linked.body)
  anthropic.refresh = original
  await hub.test.asOwner(`update builder.model_account set position = 5 where label = 'Time 1'`)
  const accounts = `/api/companies/${companyId}/model-accounts`
  async function listed() {
    const read = Object((await call(hub, ana, 'GET', accounts)).json())
    return Object.fromEntries(
      read.company.map((each: { label: string; state: string }) => [each.label, each.state]),
    )
  }
  const where = { hub, person: ana, conversations: base.conversations }
  return { ...base, listed, where, refused }
}

test('token recusado: renova uma vez, e se ainda recusa marca recusada, avisa no turno e segue pela Time 1', async (t) => {
  const f = await subscribed(t, 3600)
  const { events } = await asked(t, f.where)
  assert.deepEqual(
    f.anthropic.sent.filter((each) => each.stream).map((each) => each.bearer ?? each.key),
    [FIRST.access, SECOND.access, KEY],
  )
  assert.equal(f.anthropic.refreshed.filter((token) => token === FIRST.refresh).length, 1)
  assert.deepEqual(noticesOf(events), [
    'Claude foi recusada. Ligue de novo; continuei pela Time 1.',
  ])
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.deepEqual(await f.listed(), { Claude: 'refused', 'Time 1': 'ready' })
})

test('token recusado e renovado: a chamada com o token novo passa e a conta segue pronta', async (t) => {
  const f = await subscribed(t, 3600)
  f.refused.status = undefined
  f.anthropic.answer = (call) =>
    call.bearer === FIRST.access
      ? { kind: 'refuse', status: 401 }
      : { kind: 'text', text: 'Pronto.' }
  const { events } = await asked(t, f.where)
  assert.deepEqual(
    f.anthropic.sent.filter((each) => each.stream).map((each) => each.bearer),
    [FIRST.access, SECOND.access],
  )
  assert.deepEqual(noticesOf(events), [])
  assert.deepEqual(await f.listed(), { Claude: 'ready', 'Time 1': 'ready' })
})

test('duas perguntas com o token vencido: uma só chamada ao endpoint de renovação', async (t) => {
  const f = await subscribed(t, 1)
  f.refused.status = undefined
  f.anthropic.answer = () => ({ kind: 'text', text: 'Pronto.' })
  const [one, two] = await Promise.all([asked(t, f.where), asked(t, f.where)])
  for (const { events } of [one, two])
    assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal(f.anthropic.refreshed.filter((token) => token === FIRST.refresh).length, 1)
  const bearers = f.anthropic.sent.filter((each) => each.stream).map((each) => each.bearer)
  assert.deepEqual(bearers, [SECOND.access, SECOND.access])
})

test('renovação recusada pela Anthropic: a conta fica recusada, o turno avisa e a Time 1 responde', async (t) => {
  const f = await subscribed(t, 1)
  f.anthropic.refresh = () => ({ status: 400 })
  const { events } = await asked(t, f.where)
  assert.deepEqual(
    f.anthropic.sent.filter((each) => each.stream).map((each) => each.bearer ?? each.key),
    [KEY],
  )
  assert.deepEqual(noticesOf(events), [
    'Claude foi recusada. Ligue de novo; continuei pela Time 1.',
  ])
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.deepEqual(await f.listed(), { Claude: 'refused', 'Time 1': 'ready' })
})
