import assert from 'node:assert/strict'
import { env } from 'node:process'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { BRUNO, call, memberOn } from '../../hub/identity/test-hub.ts'
import type { Reply } from '../../platform/test-anthropic.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import {
  asked,
  conversing,
  KEY,
  keptNotices,
  noticesOf,
} from '../conversation/test-conversation.ts'

const EXHAUSTED =
  'As contas Anthropic que você pode usar estão indisponíveis. Escolha outro modelo ou fale com quem administra a empresa.'
const MINUTE = 60_000

function keyOf(label: string): string {
  return label === 'Time 1' ? KEY : `sk-ant-queue-${label.replaceAll(' ', '-')}-key-0001`
}

/** A company whose accounts answer as `plan` says by label; the others answer with text. */
async function fleet(t: TestContext, plan: Record<string, Reply> = {}) {
  const labels = new Map([[KEY, 'Time 1']])
  const base = await conversing(t, (call) => {
    if (!call.stream) return { kind: 'text', text: 'Apps de encomenda' }
    return plan[labels.get(String(call.key)) ?? ''] ?? { kind: 'text', text: 'Pronto.' }
  })
  const { hub, ana, companyId } = base
  const accounts = `/api/companies/${companyId}/model-accounts`
  async function add(label: string, owner = 'company', who = ana) {
    labels.set(keyOf(label), label)
    const body = { owner, provider: 'anthropic', label, key: keyOf(label) }
    const linked = await base.hub.app.inject({
      method: 'POST',
      url: accounts,
      headers: {
        origin: TEST_ORIGIN,
        cookie: who.cookie,
        'content-type': 'application/json',
        'idempotency-key': crypto.randomUUID(),
      },
      payload: JSON.stringify(body),
    })
    assert.equal(linked.statusCode, 201, linked.body)
    const { account } = Object(linked.json())
    return { id: String(account.id), revision: Number(account.revision) }
  }
  /** The streamed calls by account label, in order: the titles' calls are left out. */
  function calls(): string[] {
    return base.anthropic.sent
      .filter((each) => each.stream)
      .map((each) => labels.get(String(each.key)) ?? '?')
  }
  async function states(): Promise<Record<string, { state: string; limitedUntil: number | null }>> {
    const rows = await hub.test.asOwner(
      'select label, state, limited_until from builder.model_account',
    )
    return Object.fromEntries(
      rows.map((row) => [
        String(row.label),
        {
          state: String(row.state),
          limitedUntil: row.limited_until instanceof Date ? row.limited_until.getTime() : null,
        },
      ]),
    )
  }
  async function listed() {
    const read = await call(hub, ana, 'GET', accounts)
    const company: { label: string; state: string }[] = Object(read.json()).company
    return Object.fromEntries(company.map((each) => [each.label, each.state]))
  }
  function ask(between?: () => Promise<void>) {
    return asked(t, { hub, person: ana, conversations: base.conversations, between })
  }
  return { ...base, accounts, add, calls, states, listed, ask }
}

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
  const { events } = await f.ask()
  assert.deepEqual(f.calls(), ['Minha', 'Dada', 'Time 1', 'Empresa'])
  assert.deepEqual(noticesOf(events), [
    'Minha foi recusada. Ligue de novo; continuei pela Dada.',
    'Dada foi recusada. Ligue de novo; continuei pela Time 1.',
    'Time 1 foi recusada. Ligue de novo; continuei pela Empresa.',
  ])
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
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
  const { events } = await f.ask()
  assert.deepEqual(f.calls(), ['Livre'])
  assert.deepEqual(noticesOf(events), [])
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
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
  const stream = await f.ask(pause)
  assert.deepEqual(noticesOf(stream.events), [EXHAUSTED])
  assert.deepEqual(stream.events.slice(-2), [
    { type: 'failure', code: 'MODEL_NO_ACCOUNT' },
    { type: 'turnEnd', reason: 'error' },
  ])
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
  const { events } = await f.ask()
  assert.deepEqual(f.calls(), ['Time 1', 'Dois', 'Tres', 'Quatro'])
  const notices = noticesOf(events)
  assert.match(notices[0] ?? '', /^Time 1 no limite até \d{2}h\d{2}; continuei pela Dois\.$/)
  assert.match(notices[2] ?? '', /^Tres no limite até \d{2}h\d{2}; continuei pela Quatro\.$/)
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
  assert.deepEqual(noticesOf(next.events), [])
})

test('401 e 403: a conta fica recusada, a lista a mostra e a próxima assume', async (t) => {
  const f = await fleet(t, {
    'Time 1': { kind: 'refuse', status: 401 },
    Dois: { kind: 'refuse', status: 403 },
  })
  await f.add('Dois')
  await f.add('Tres')
  const { url, events } = await f.ask()
  assert.deepEqual(f.calls(), ['Time 1', 'Dois', 'Tres'])
  const notices = [
    'Time 1 foi recusada. Ligue de novo; continuei pela Dois.',
    'Dois foi recusada. Ligue de novo; continuei pela Tres.',
  ]
  assert.deepEqual(noticesOf(events), notices)
  // Kept in the answer read again, once each though each was said in an attempt Mastra retried.
  assert.deepEqual(await keptNotices(f.hub, f.ana, url), notices)
  assert.deepEqual(await f.listed(), { 'Time 1': 'refused', Dois: 'refused', Tres: 'ready' })
  assert.equal((await f.states())['Time 1']?.limitedUntil, null)
})

test('400, 500 e 529: o turno falha como MODEL_CALL_FAILED, sem troca e sem o texto do fornecedor', async (t) => {
  for (const status of [400, 500, 529] as const) {
    const f = await fleet(t, { 'Time 1': { kind: 'refuse', status } })
    await f.add('Dois')
    const { events } = await f.ask()
    assert.deepEqual(events.slice(-2), [
      { type: 'failure', code: 'MODEL_CALL_FAILED' },
      { type: 'turnEnd', reason: 'error' },
    ])
    assert.ok(!f.calls().includes('Dois'), `${status}`)
    assert.deepEqual(noticesOf(events), [])
    assert.ok(!JSON.stringify(events).includes('SECRET-PLANTED-TEXT'))
    assert.deepEqual(await f.listed(), { 'Time 1': 'ready', Dois: 'ready' })
    assert.equal((await f.states())['Time 1']?.limitedUntil, null)
    const logged = f.lines.map((line) => line.message)
    assert.ok(logged.includes('MODEL_CALL_FAILED'), `${status}`)
    assert.ok(!logged.includes('MODEL_CALL_REFUSED'), `${status}`)
  }
})

test('todas fora: o aviso de que as contas acabaram, MODEL_NO_ACCOUNT e o fim com erro', async (t) => {
  const f = await fleet(t, {
    'Time 1': { kind: 'refuse', status: 429 },
    Dois: { kind: 'refuse', status: 429 },
  })
  await f.add('Dois')
  const { events } = await f.ask()
  assert.deepEqual(f.calls(), ['Time 1', 'Dois'])
  const notices = noticesOf(events)
  assert.match(notices[0] ?? '', /^Time 1 no limite até \d{2}h\d{2}; continuei pela Dois\.$/)
  assert.equal(notices[1], EXHAUSTED)
  assert.equal(notices.length, 2)
  assert.deepEqual(events.slice(-2), [
    { type: 'failure', code: 'MODEL_NO_ACCOUNT' },
    { type: 'turnEnd', reason: 'error' },
  ])
})

test('dez contas recusando: no máximo 10 chamadas, e o aviso na décima', async (t) => {
  const plan: Record<string, Reply> = {}
  const labels = ['Time 1', ...Array.from({ length: 10 }, (_, index) => `Conta ${index + 2}`)]
  for (const label of labels) plan[label] = { kind: 'refuse', status: 401 }
  const f = await fleet(t, plan)
  for (const label of labels.slice(1)) await f.add(label)
  const { url, events } = await f.ask()
  assert.deepEqual(f.calls(), labels.slice(0, 10))
  const notices = noticesOf(events)
  assert.equal(notices.length, 10)
  assert.equal(notices.at(-1), EXHAUSTED)
  assert.deepEqual(await keptNotices(f.hub, f.ana, url), notices)
  assert.deepEqual(events.slice(-2), [
    { type: 'failure', code: 'MODEL_NO_ACCOUNT' },
    { type: 'turnEnd', reason: 'error' },
  ])
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
  const { events } = await f.ask()
  assert.deepEqual(f.calls(), ['Time 1', 'Dois'])
  assert.match(
    noticesOf(events)[0] ?? '',
    /^Time 1 no limite até \d{2}h\d{2}; continuei pela Dois\.$/,
  )
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal((await f.states())['Time 1']?.limitedUntil, null)
  const logged = f.lines.filter((line) => line.message === 'DATABASE_UNAVAILABLE')
  assert.equal(logged.length, 1, JSON.stringify(f.lines.map((line) => line.message)))
})
