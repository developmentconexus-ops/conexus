import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { call, post } from '../../hub/identity/test-hub.ts'
import {
  asked,
  beside,
  conversing,
  endOf,
  KEY,
  sent,
  started,
  streamOf,
  turnNotices,
} from '../conversation/test-conversation.ts'
import { failuresOf } from '../conversation/test-parts.ts'

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
  const { url, events } = await asked(t, f.where)
  assert.deepEqual(
    f.anthropic.sent.filter((each) => each.stream).map((each) => each.bearer ?? each.key),
    [FIRST.access, SECOND.access, KEY],
  )
  assert.equal(f.anthropic.refreshed.filter((token) => token === FIRST.refresh).length, 1)
  assert.deepEqual(await turnNotices(f.hub, f.ana, url), [
    'Claude foi recusada. Ligue de novo; continuei pela Time 1.',
  ])
  assert.equal(endOf(events), 'complete')
  assert.deepEqual(await f.listed(), { Claude: 'refused', 'Time 1': 'ready' })
})

test('token recusado e renovado: a chamada com o token novo passa e a conta segue pronta', async (t) => {
  const f = await subscribed(t, 3600)
  f.refused.status = undefined
  f.anthropic.answer = (call) =>
    call.bearer === FIRST.access
      ? { kind: 'refuse', status: 401 }
      : { kind: 'text', text: 'Pronto.' }
  const { url } = await asked(t, f.where)
  assert.deepEqual(
    f.anthropic.sent.filter((each) => each.stream).map((each) => each.bearer),
    [FIRST.access, SECOND.access],
  )
  for (const each of f.anthropic.sent.filter((one) => one.stream))
    assert.deepEqual(each.cached, [
      { at: 'system', ttl: '1h' },
      { at: 'message', ttl: '1h' },
    ])
  assert.deepEqual(await turnNotices(f.hub, f.ana, url), [])
  assert.deepEqual(await f.listed(), { Claude: 'ready', 'Time 1': 'ready' })
})

test('duas perguntas com o token vencido: uma só chamada ao endpoint de renovação', async (t) => {
  const f = await subscribed(t, 1)
  f.refused.status = undefined
  f.anthropic.answer = () => ({ kind: 'text', text: 'Pronto.' })
  const [one, two] = await Promise.all([
    asked(t, f.where),
    asked(t, await beside(f.where, 'Estoque')),
  ])
  for (const { events } of [one, two]) assert.equal(endOf(events), 'complete')
  assert.equal(f.anthropic.refreshed.filter((token) => token === FIRST.refresh).length, 1)
  const bearers = f.anthropic.sent.filter((each) => each.stream).map((each) => each.bearer)
  assert.deepEqual(bearers, [SECOND.access, SECOND.access])
})

test('renovação recusada pela Anthropic: a conta fica recusada, o turno avisa e a Time 1 responde', async (t) => {
  const f = await subscribed(t, 1)
  f.anthropic.refresh = () => ({ status: 400 })
  const { url, events } = await asked(t, f.where)
  assert.deepEqual(
    f.anthropic.sent.filter((each) => each.stream).map((each) => each.bearer ?? each.key),
    [KEY],
  )
  assert.deepEqual(await turnNotices(f.hub, f.ana, url), [
    'Claude foi recusada. Ligue de novo; continuei pela Time 1.',
  ])
  assert.equal(endOf(events), 'complete')
  assert.deepEqual(await f.listed(), { Claude: 'refused', 'Time 1': 'ready' })
  // The queue says in the log why it skipped the account, with the failure's own fields.
  const skipped = f.lines.find(
    (line) => line.message === 'MODEL_ACCOUNT_REFUSED' && line.fields.category === 'USER',
  )
  assert.equal(typeof skipped?.fields.accountId, 'string')
  assert.equal(skipped?.fields.companyId, f.companyId)
})

test('renovação recusada e nenhuma outra conta: o turno acaba dizendo que a assinatura foi recusada, não que as contas estão indisponíveis', async (t) => {
  const f = await subscribed(t, 1)
  f.anthropic.refresh = () => ({ status: 400 })
  await f.hub.test.asOwner(
    `update builder.model_account set state = 'paused' where label = 'Time 1'`,
  )
  const { url, events } = await asked(t, f.where)
  assert.deepEqual(await turnNotices(f.hub, f.ana, url), ['Claude foi recusada. Ligue de novo.'])
  assert.deepEqual(failuresOf(events), ['MODEL_NO_ACCOUNT'])
  assert.equal(endOf(events), 'error')
  assert.deepEqual(await f.listed(), { Claude: 'refused', 'Time 1': 'paused' })
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
  assert.equal((await sent(f.hub, f.ana, url, 'Como organizo as encomendas?')).statusCode, 200)
  assert.equal(endOf(await stream.turn()), 'complete')
  await claude('ready')
  f.anthropic.refresh = () => ({ status: 400 })
  const begun = Date.now()
  assert.equal((await sent(f.hub, f.ana, url, 'E os pedidos do balcão?')).statusCode, 200)
  const events = await stream.turn()
  assert.ok(Date.now() - begun < 15_000, 'no wait on a lease')
  assert.equal(f.anthropic.refreshed.filter((token) => token === FIRST.refresh).length, 1)
  assert.deepEqual(await turnNotices(f.hub, f.ana, url), [
    'Claude foi recusada. Ligue de novo; continuei pela Time 1.',
  ])
  assert.equal(endOf(events), 'complete')
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
  const turns = await Promise.all([asked(t, f.where), asked(t, await beside(f.where, 'Estoque'))])
  assert.ok(Date.now() - begun < 15_000, 'the waiting question stops with the refusal')
  assert.equal(f.anthropic.refreshed.filter((token) => token === FIRST.refresh).length, 1)
  for (const { url, events } of turns) {
    assert.deepEqual(await turnNotices(f.hub, f.ana, url), [
      'Claude foi recusada. Ligue de novo; continuei pela Time 1.',
    ])
    assert.equal(endOf(events), 'complete')
  }
  assert.deepEqual(await f.listed(), { Claude: 'refused', 'Time 1': 'ready' })
})

const IDENTITY = "You are Claude Code, Anthropic's official CLI for Claude."
const OBSERVER = /You are the memory consciousness/

/** The conversation's title once Mastra has stored it, which it does after the turn's end. */
async function titleOf(f: Awaited<ReturnType<typeof subscribed>>, url: string) {
  for (let wait = 0; wait < 30; wait++) {
    const read = await call(f.hub, f.ana, 'GET', url)
    const title = Object(read.json()).conversation.title
    if (title !== null) return title
    await sleep(100)
  }
  return null
}

test('assinatura: o título vem pela conta do turno, sem erro, e toda chamada abre com a linha de identidade', async (t) => {
  const f = await subscribed(t, 3600)
  f.refused.status = undefined
  f.anthropic.answer = (each) => ({ kind: 'text', text: each.stream ? 'Pronto.' : 'Padarias' })
  const { url, events } = await asked(t, f.where)
  assert.equal(endOf(events), 'complete')
  assert.equal(await titleOf(f, url), 'Padarias')
  const bearer = f.anthropic.sent.filter((each) => each.bearer !== null)
  assert.deepEqual(
    bearer.map((each) => each.stream),
    [true, false],
    'the turn and the title both went through the subscription',
  )
  for (const each of bearer) assert.ok(each.system.startsWith(IDENTITY), each.system.slice(0, 40))
  assert.ok(!f.lines.some((line) => line.message === 'MASTRA_ERROR'))
})

test('assinatura: o observador também abre com a linha, e a falha dele diz a chamada e a conta no log', async (t) => {
  const f = await subscribed(t, 3600)
  f.refused.status = undefined
  const long = 'As encomendas da padaria chegam pelo telefone e pelo balcão. '.repeat(3000)
  f.anthropic.answer = (each) => {
    if (OBSERVER.test(each.system)) return { kind: 'refuse', status: 500 }
    return { kind: 'text', text: each.stream ? long : 'Padarias' }
  }
  const url = `${f.conversations}/${await started(f.hub, f.ana, f.conversations)}`
  const stream = await streamOf(f.hub, f.ana, url)
  t.after(() => stream.close())
  for (const question of ['Como organizo as encomendas?', 'E os pedidos do balcão?']) {
    assert.equal((await sent(f.hub, f.ana, url, question)).statusCode, 200)
    const events = await stream.turn()
    assert.equal(endOf(events), 'complete')
  }
  const observed = f.anthropic.sent.filter((each) => OBSERVER.test(each.system))
  assert.ok(observed.length > 0, 'the observer was called')
  for (const each of observed) {
    assert.ok(each.bearer !== null, 'on the subscription')
    assert.ok(each.system.startsWith(IDENTITY), each.system.slice(0, 40))
  }
  const failed = f.lines.find(
    (line) => line.message === 'MODEL_SIDE_CALL_FAILED' && line.fields.call === 'observer',
  )
  assert.equal(failed?.fields.companyId, f.companyId)
  assert.equal(typeof failed?.fields.accountId, 'string')
  assert.equal(failed?.fields.failure, 'unknown')
})

test('assinatura: o título que falha diz no log a chamada e a conta, sem texto da pessoa', async (t) => {
  const f = await subscribed(t, 3600)
  f.refused.status = undefined
  f.anthropic.answer = (each) =>
    each.stream ? { kind: 'text', text: 'Pronto.' } : { kind: 'refuse', status: 500 }
  const { url } = await asked(t, f.where, 'SEGREDO-DA-PESSOA')
  await sleep(1000)
  const read = await call(f.hub, f.ana, 'GET', url)
  assert.equal(Object(read.json()).conversation.title, null)
  const failed = f.lines.filter((line) => line.message === 'MODEL_SIDE_CALL_FAILED')
  assert.equal(failed.length, 1)
  assert.equal(failed[0]?.fields.call, 'title')
  assert.equal(typeof failed[0]?.fields.accountId, 'string')
  assert.doesNotMatch(JSON.stringify(f.lines), /SEGREDO-DA-PESSOA|SECRET-PLANTED-TEXT/)
})
