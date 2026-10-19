import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { call, post } from '../../hub/identity/test-hub.ts'
import {
  asked,
  conversing,
  KEY,
  noticesOf,
  sent,
  started,
  streamOf,
} from '../conversation/test-conversation.ts'

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

test('a observação pede a conta antes do passo: uma escolha só, e a assinatura recusada ao abrir é dita no turno', async (t) => {
  const f = await subscribed(t, 1)
  const long = 'As encomendas da padaria chegam pelo telefone e pelo balcão. '.repeat(3000)
  f.anthropic.answer = (call) => {
    if (!call.stream) return { kind: 'text', text: 'Encomendas da padaria' }
    return { kind: 'text', text: call.texts.length > 2 ? 'Certo.' : long }
  }
  function claude(state: string) {
    const set = `update builder.model_account set state = $1 where label = 'Claude'`
    return f.hub.test.asOwner(set, [state])
  }
  await claude('paused')
  const url = `${f.conversations}/${await started(f.hub, f.ana, f.conversations)}`
  const stream = await streamOf(f.hub, f.ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(f.hub, f.ana, url, 'Como organizo as encomendas?')).statusCode, 202)
  assert.deepEqual((await stream.turn()).at(-1), { type: 'turnEnd', reason: 'complete' })
  await claude('ready')
  f.anthropic.refresh = () => ({ status: 400 })
  const begun = Date.now()
  assert.equal((await sent(f.hub, f.ana, url, 'E os pedidos do balcão?')).statusCode, 202)
  const events = await stream.turn()
  assert.ok(Date.now() - begun < 15_000, 'no wait on a lease')
  assert.equal(f.anthropic.refreshed.filter((token) => token === FIRST.refresh).length, 1)
  assert.deepEqual(noticesOf(events), [
    'Claude foi recusada. Ligue de novo; continuei pela Time 1.',
  ])
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.deepEqual(await f.listed(), { Claude: 'refused', 'Time 1': 'ready' })
})

test('renovação recusada com outra pergunta à espera: as duas seguem pela Time 1 e dizem a recusa, sem esperar o prazo', async (t) => {
  const f = await subscribed(t, 1)
  f.anthropic.refresh = () => ({ status: 400 })
  const planted = globalThis.fetch
  // The token endpoint answers late, so the other question waits on the lease.
  const slowed: typeof fetch = async (input, init) => {
    const url = input instanceof Request ? input.url : String(input)
    if (url.includes('/v1/oauth/token')) await sleep(1500)
    return planted(input, init)
  }
  globalThis.fetch = slowed
  t.after(() => {
    if (globalThis.fetch === slowed) globalThis.fetch = planted
  })
  const begun = Date.now()
  const turns = await Promise.all([asked(t, f.where), asked(t, f.where)])
  assert.ok(Date.now() - begun < 15_000, 'the waiting question stops with the refusal')
  assert.equal(f.anthropic.refreshed.filter((token) => token === FIRST.refresh).length, 1)
  for (const { events } of turns) {
    assert.deepEqual(noticesOf(events), [
      'Claude foi recusada. Ligue de novo; continuei pela Time 1.',
    ])
    assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  }
  assert.deepEqual(await f.listed(), { Claude: 'refused', 'Time 1': 'ready' })
})
