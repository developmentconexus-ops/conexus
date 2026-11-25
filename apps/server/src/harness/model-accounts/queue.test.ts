import assert from 'node:assert/strict'
import { env } from 'node:process'
import { test } from 'node:test'
import { BRUNO, call, memberOn } from '../../hub/identity/test-hub.ts'
import type { Reply } from '../../platform/test-anthropic.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import { answeredOf, endOf, turnNotices } from '../routes/test-conversation.ts'
import { failuresOf } from '../routes/test-parts.ts'
import { EXHAUSTED, fleet, saidLive } from './test-fleet.ts'

const MINUTE = 60_000
/** Mastra's wait before the retry of an unknown error (`StreamErrorRetryProcessor`, 1.79). */
const RETRY_DELAY_MS = 3000

test('a ordem: a própria, a dada à pessoa, a da empresa; a dada a outro não entra', async (t) => {
  const plan: Record<string, Reply> = {
    Minha: { kind: 'refuse', status: 401 },
    Dada: { kind: 'refuse', status: 401 },
    'Time 1': { kind: 'refuse', status: 401 },
  }
  const f = await fleet(t, plan)
  const bruno = await memberOn(f.hub, f.companyId, BRUNO, 'member')
  const dada = await f.add('Dada')
  await f.add('Empresa')
  await f.add('Minha', 'me')
  const alheia = await f.add('Alheia')
  function give(id: string, personId: string) {
    return call(f.hub, f.ana, 'PUT', `${f.accounts}/${id}/assignees`, { personIds: [personId] })
  }
  assert.equal((await give(dada.id, f.ana.id)).statusCode, 200)
  assert.equal((await give(alheia.id, bruno.id)).statusCode, 200)
  const { url, events } = await f.ask()
  assert.deepEqual(f.calls(), ['Minha', 'Dada', 'Time 1', 'Empresa'])
  assert.deepEqual(await turnNotices(f.hub, f.ana, url), [
    'Minha foi recusada. Ligue de novo; continuei pela Dada.',
    'Dada foi recusada. Ligue de novo; continuei pela Time 1.',
    'Time 1 foi recusada. Ligue de novo; continuei pela Empresa.',
  ])
  assert.equal(endOf(events), 'complete')
})

test('pausada, recusada, de tipo desligado e em limite são puladas', async (t) => {
  const f = await fleet(t)
  const pausada = await f.add('Pausada')
  await f.add('Recusada')
  await f.add('Desligada')
  await f.add('Limitada')
  await f.add('Livre')
  const paused = await f.hub.app.inject({
    method: 'PATCH',
    url: `${f.accounts}/${pausada.id}`,
    headers: { origin: TEST_ORIGIN, cookie: f.ana.cookie, 'content-type': 'application/json' },
    payload: JSON.stringify({ state: 'paused', revision: pausada.revision }),
  })
  assert.equal(paused.statusCode, 200)
  function sql(set: string, label: string) {
    return f.hub.test.asOwner(`update builder.model_account set ${set} where label = $1`, [label])
  }
  await sql(`state = 'refused'`, 'Recusada')
  await sql(`kind = 'claude_subscription', hint = null`, 'Desligada')
  await sql(`limited_until = now() + interval '1 hour'`, 'Limitada')
  await sql(`state = 'paused'`, 'Time 1')
  const { url, events } = await f.ask()
  assert.deepEqual(f.calls(), ['Livre'])
  assert.deepEqual(await turnNotices(f.hub, f.ana, url), [])
  assert.equal(endOf(events), 'complete')
})

test('sem conta: nenhuma chamada ao fornecedor, nem com chave no ambiente', async (t) => {
  const f = await fleet(t)
  const name = 'ANTHROPIC_API_KEY'
  const before = Reflect.get(env, name)
  Reflect.set(env, name, 'sk-ant-environment-key-0001')
  t.after(() => {
    if (before === undefined) Reflect.deleteProperty(env, name)
    else Reflect.set(env, name, before)
  })
  async function pause() {
    await f.hub.test.asOwner(`update builder.model_account set state = 'paused'`)
  }
  const started = Date.now()
  const stream = await f.ask(pause)
  assert.ok(Date.now() - started < RETRY_DELAY_MS, 'our own failure is not retried')
  assert.deepEqual(saidLive(stream.events), [EXHAUSTED])
  assert.deepEqual(await turnNotices(f.hub, f.ana, stream.url), [EXHAUSTED])
  assert.deepEqual(failuresOf(stream.events), ['MODEL_NO_ACCOUNT'])
  assert.equal(endOf(stream.events), 'error')
  assert.equal(f.anthropic.sent.length, 0)
  assert.equal(f.anthropic.chats.length, 0)
})

test('429 com horário, 429 sem e 402: a conta ganha o limite, a próxima assume e ninguém repete', async (t) => {
  const f = await fleet(t, {
    'Time 1': { kind: 'refuse', status: 429, headers: { 'retry-after': '120' } },
    Dois: { kind: 'refuse', status: 429 },
    Tres: { kind: 'refuse', status: 402 },
  })
  await f.add('Dois')
  await f.add('Tres')
  await f.add('Quatro')
  const before = Date.now()
  const { url } = await f.ask()
  assert.deepEqual(f.calls(), ['Time 1', 'Dois', 'Tres', 'Quatro'])
  const notices = await turnNotices(f.hub, f.ana, url)
  assert.match(notices[0] ?? '', /^Time 1 no limite até \d{2}h\d{2}; continuei pela Dois\.$/)
  assert.equal(notices[2], 'Tres ficou sem crédito; continuei pela Quatro.')
  assert.equal(notices.length, 3)
  const states = await f.states()
  function within(label: string, ms: number) {
    const until = states[label]?.limitedUntil ?? 0
    assert.ok(Math.abs(until - (before + ms)) < 30_000, `${label}: ${until - before}`)
    assert.equal(states[label]?.state, 'ready')
  }
  within('Time 1', 2 * MINUTE)
  within('Dois', 15 * MINUTE)
  within('Tres', 6 * 60 * MINUTE)
  assert.equal(states.Quatro?.limitedUntil, null)
  const next = await f.ask()
  assert.deepEqual(f.calls().slice(4), ['Quatro'])
  assert.deepEqual(await turnNotices(f.hub, f.ana, next.url), [])
})

test('401 e 403: a conta fica recusada, a lista a mostra e a próxima assume', async (t) => {
  const f = await fleet(t, {
    'Time 1': { kind: 'refuse', status: 401 },
    Dois: { kind: 'refuse', status: 403 },
  })
  await f.add('Dois')
  await f.add('Tres')
  const { url } = await f.ask()
  assert.deepEqual(f.calls(), ['Time 1', 'Dois', 'Tres'])
  const notices = [
    'Time 1 foi recusada. Ligue de novo; continuei pela Dois.',
    'Dois foi recusada. Ligue de novo; continuei pela Tres.',
  ]
  // Kept in the answer read again, once each though each was said in an attempt Mastra retried.
  assert.deepEqual(await turnNotices(f.hub, f.ana, url), notices)
  assert.deepEqual(await f.listed(), { 'Time 1': 'refused', Dois: 'refused', Tres: 'ready' })
  assert.equal((await f.states())['Time 1']?.limitedUntil, null)
})

test('400, 500 e 529: o turno falha como MODEL_CALL_FAILED, sem troca e sem o texto do fornecedor', async (t) => {
  for (const status of [400, 500, 529] as const) {
    const f = await fleet(t, { 'Time 1': { kind: 'refuse', status } })
    await f.add('Dois')
    const { url, events } = await f.ask()
    assert.deepEqual(failuresOf(events), ['MODEL_CALL_FAILED'])
    assert.equal(endOf(events), 'error')
    assert.ok(!f.calls().includes('Dois'), `${status}`)
    assert.deepEqual(await turnNotices(f.hub, f.ana, url), [])
    // Mastra's `error` part carries the provider's message, which the screen does not draw.
    const parts = (await answeredOf(f.hub, f.ana, url)).flatMap((message) => message.parts)
    const kept = JSON.stringify(parts.filter((part) => part.type !== 'error'))
    assert.ok(!kept.includes('SECRET-PLANTED-TEXT'))
    assert.deepEqual(await f.listed(), { 'Time 1': 'ready', Dois: 'ready' })
    assert.equal((await f.states())['Time 1']?.limitedUntil, null)
    const logged = f.lines.map((line) => line.message)
    assert.ok(logged.includes('MODEL_CALL_FAILED'), `${status}`)
    assert.ok(!logged.includes('MODEL_CALL_REFUSED'), `${status}`)
  }
})

const CREDIT_LOW =
  'Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits.'

test('400 de saldo: a conta ganha o limite do crédito, a próxima assume e o log diz o motivo', async (t) => {
  const f = await fleet(t, { 'Time 1': { kind: 'refuse', status: 400, message: CREDIT_LOW } })
  await f.add('Dois')
  const before = Date.now()
  const { url, events } = await f.ask()
  assert.deepEqual(f.calls(), ['Time 1', 'Dois'])
  assert.deepEqual(await turnNotices(f.hub, f.ana, url), [
    'Time 1 ficou sem crédito; continuei pela Dois.',
  ])
  assert.equal(endOf(events), 'complete')
  const until = (await f.states())['Time 1']?.limitedUntil ?? 0
  assert.ok(Math.abs(until - (before + 6 * 60 * MINUTE)) < 30_000, `${until - before}`)
  const refused = f.lines.find((line) => line.message === 'MODEL_CALL_REFUSED')
  assert.equal(Object(refused?.fields).kind, 'quota')
  assert.ok(!JSON.stringify(f.lines).includes(CREDIT_LOW))
})

const USAGE_CAP = 'You have reached your weekly limit. Your limit resets on Monday.'

test('429 de teto de uso: a conta ganha o limite do crédito, não o da taxa, e o log diz o motivo', async (t) => {
  const f = await fleet(t, { 'Time 1': { kind: 'refuse', status: 429, message: USAGE_CAP } })
  await f.add('Dois')
  const before = Date.now()
  const { url, events } = await f.ask()
  assert.deepEqual(f.calls(), ['Time 1', 'Dois'])
  assert.deepEqual(await turnNotices(f.hub, f.ana, url), [
    'Time 1 ficou sem crédito; continuei pela Dois.',
  ])
  assert.equal(endOf(events), 'complete')
  const until = (await f.states())['Time 1']?.limitedUntil ?? 0
  assert.ok(Math.abs(until - (before + 6 * 60 * MINUTE)) < 30_000, `${until - before}`)
  const refused = f.lines.find((line) => line.message === 'MODEL_CALL_REFUSED')
  assert.equal(Object(refused?.fields).kind, 'quota')
})

test('429 que diz acesso negado: o status manda, a conta ganha o limite da taxa e a próxima assume', async (t) => {
  const f = await fleet(t, {
    'Time 1': { kind: 'refuse', status: 429, type: 'authentication_error' },
  })
  await f.add('Dois')
  const before = Date.now()
  await f.ask()
  assert.deepEqual(f.calls(), ['Time 1', 'Dois'])
  assert.deepEqual(await f.listed(), { 'Time 1': 'ready', Dois: 'ready' })
  const until = (await f.states())['Time 1']?.limitedUntil ?? 0
  assert.ok(Math.abs(until - (before + 15 * MINUTE)) < 30_000, `${until - before}`)
})

test('400 de formato: o turno falha, sem troca, e o log traz o tipo fechado', async (t) => {
  const message = 'messages: text content blocks must be non-empty'
  const f = await fleet(t, { 'Time 1': { kind: 'refuse', status: 400, message } })
  await f.add('Dois')
  const { events } = await f.ask()
  assert.deepEqual(failuresOf(events), ['MODEL_CALL_FAILED'])
  assert.ok(!f.calls().includes('Dois'))
  const failed = f.lines.find((line) => line.message === 'MODEL_CALL_FAILED')
  assert.equal(Object(failed?.fields).kind, 'invalid_request')
  assert.ok(!JSON.stringify(f.lines).includes('non-empty'))
})

test('dez contas recusando: no máximo 10 chamadas, e o aviso na décima', async (t) => {
  const plan: Record<string, Reply> = {}
  const labels = ['Time 1', ...Array.from({ length: 10 }, (_, index) => `Conta ${index + 2}`)]
  for (const label of labels) plan[label] = { kind: 'refuse', status: 401 }
  const f = await fleet(t, plan)
  for (const label of labels.slice(1)) await f.add(label)
  const { url, events } = await f.ask()
  assert.deepEqual(f.calls(), labels.slice(0, 10))
  const notices = await turnNotices(f.hub, f.ana, url)
  assert.equal(notices.length, 10)
  assert.equal(notices.at(-1), 'Conta 10 foi recusada. Ligue de novo.')
  assert.deepEqual(failuresOf(events), ['MODEL_CALL_FAILED'])
  assert.equal(endOf(events), 'error')
  const states = await f.states()
  assert.equal(states['Conta 11']?.state, 'ready')
})

test('banco fora ao marcar o limite: a conta fica sem marca, o código vai ao log e a próxima assume', async (t) => {
  const f = await fleet(t, { 'Time 1': { kind: 'refuse', status: 429 } })
  await f.add('Dois')
  await f.hub.test.asOwner(`
    create function builder.refuse_mark() returns trigger language plpgsql as $$
      begin raise exception using errcode = '57014'; end $$;
    create trigger refuse_mark before update on builder.model_account for each row
      when (new.limited_until is distinct from old.limited_until or new.state = 'refused')
      execute function builder.refuse_mark()`)
  const { url, events } = await f.ask()
  assert.deepEqual(f.calls(), ['Time 1', 'Dois'])
  assert.match(
    (await turnNotices(f.hub, f.ana, url))[0] ?? '',
    /^Time 1 no limite até \d{2}h\d{2}; continuei pela Dois\.$/,
  )
  assert.equal(endOf(events), 'complete')
  assert.equal((await f.states())['Time 1']?.limitedUntil, null)
  const logged = f.lines.filter((line) => line.message === 'DATABASE_UNAVAILABLE')
  assert.equal(logged.length, 1, JSON.stringify(f.lines.map((line) => line.message)))
})
