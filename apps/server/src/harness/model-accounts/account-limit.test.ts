import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import {
  endOf,
  MODEL,
  messagesOf,
  sent,
  streamOf,
  turnNotices,
} from '../../builder/conversation/test-conversation.ts'
import { failuresOf } from '../../builder/conversation/test-parts.ts'
import { call, post } from '../../hub/identity/test-hub.ts'
import { until } from '../../platform/test-until.ts'
import { EXHAUSTED, fleet, saidLive } from './test-fleet.ts'

type Fleet = Awaited<ReturnType<typeof fleet>>

/** The next message in the same conversation: its turn's events and the notices it left. */
async function again(t: TestContext, f: Fleet, url: string) {
  const stream = await streamOf(f.hub, f.ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(f.hub, f.ana, url, 'Continue')).statusCode, 200)
  const events = await stream.turn()
  await until(async () => {
    const messages = await messagesOf(f.hub, f.ana, url)
    return messages.filter((each) => each.role === 'person').length === 2
  }, 'the second message saved by Mastra')
  return { events, notices: await turnNotices(f.hub, f.ana, url) }
}

test('todas no limite, com uma conta Groq na empresa: o aviso diz até quando a primeira volta, MODEL_ACCOUNTS_LIMITED e não MODEL_NO_ACCOUNT, também na mensagem seguinte', async (t) => {
  const f = await fleet(t, {
    'Time 1': { kind: 'refuse', status: 429, headers: { 'retry-after': '7200' } },
    Dois: { kind: 'refuse', status: 429, headers: { 'retry-after': '120' } },
  })
  await f.add('Dois')
  const groq = { owner: 'company', provider: 'groq', label: 'Groq 1', key: 'gsk-queue-key-0001' }
  assert.equal((await post(f.hub, f.ana, f.accounts, groq)).statusCode, 201)
  const first = await f.ask()
  assert.deepEqual(f.calls(), ['Time 1', 'Dois'])
  const notices = await turnNotices(f.hub, f.ana, first.url)
  const later = /^Time 1 no limite até (\d{2}h\d{2}); continuei pela Dois\.$/.exec(notices[0] ?? '')
  const sooner = /^Dois no limite até (\d{2}h\d{2})\.$/.exec(notices[1] ?? '')
  assert.ok(later && sooner && later[1] !== sooner[1], `${notices}`)
  assert.equal(notices.length, 2)
  assert.deepEqual(saidLive(first.events), notices)
  assert.deepEqual(failuresOf(first.events), ['MODEL_ACCOUNTS_LIMITED'])
  assert.equal(endOf(first.events), 'error')
  const next = await again(t, f, first.url)
  assert.deepEqual(f.calls(), ['Time 1', 'Dois'], 'an account in its limit is not called again')
  assert.deepEqual(next.notices, [
    `As contas Anthropic que você pode usar estão no limite até ${sooner[1]}.`,
  ])
  assert.deepEqual(failuresOf(next.events), ['MODEL_ACCOUNTS_LIMITED'])
  assert.equal(endOf(next.events), 'error')
})

test('com a conta no limite a conversa abre, no modelo pedido e no início, e o turno diz até quando', async (t) => {
  const f = await fleet(t)
  await f.hub.test.asOwner(
    `update builder.model_account set limited_until = now() + interval '1 hour', limit_reason = 'rate'`,
  )
  const read = await call(f.hub, f.ana, 'GET', f.accounts)
  const { start } = Object(read.json()).defaults
  assert.deepEqual([start?.model, start?.account], [MODEL, 'Time 1'])
  const asked = await post(f.hub, f.ana, f.conversations, { model: MODEL })
  assert.equal(asked.statusCode, 201, asked.body)
  const { url, events } = await f.ask()
  const [notice, ...more] = await turnNotices(f.hub, f.ana, url)
  assert.match(
    notice ?? '',
    /^As contas Anthropic que você pode usar estão no limite até \d{2}h\d{2}\.$/,
  )
  assert.deepEqual(more, [])
  assert.deepEqual(failuresOf(events), ['MODEL_ACCOUNTS_LIMITED'])
  assert.deepEqual(f.calls(), [])
})

test('sem crédito: a 402 diz que a conta ficou sem crédito, MODEL_ACCOUNTS_NO_CREDIT, também na mensagem seguinte', async (t) => {
  const f = await fleet(t, {
    'Time 1': { kind: 'refuse', status: 402 },
    Dois: { kind: 'refuse', status: 402 },
  })
  await f.add('Dois')
  const first = await f.ask()
  assert.deepEqual(await turnNotices(f.hub, f.ana, first.url), [
    'Time 1 ficou sem crédito; continuei pela Dois.',
    'Dois ficou sem crédito.',
  ])
  assert.deepEqual(failuresOf(first.events), ['MODEL_ACCOUNTS_NO_CREDIT'])
  const next = await again(t, f, first.url)
  assert.deepEqual(next.notices, ['As contas Anthropic que você pode usar estão sem crédito.'])
  assert.deepEqual(failuresOf(next.events), ['MODEL_ACCOUNTS_NO_CREDIT'])
})

test('recusadas: a conta recusada manda ligar de novo, MODEL_ACCOUNTS_REFUSED e não MODEL_NO_ACCOUNT, também na mensagem seguinte', async (t) => {
  const f = await fleet(t, { 'Time 1': { kind: 'refuse', status: 401 } })
  const first = await f.ask()
  assert.deepEqual(await turnNotices(f.hub, f.ana, first.url), [
    'Time 1 foi recusada. Ligue de novo.',
  ])
  assert.deepEqual(failuresOf(first.events), ['MODEL_ACCOUNTS_REFUSED'])
  const next = await again(t, f, first.url)
  assert.deepEqual(next.notices, [
    'As contas Anthropic que você pode usar foram recusadas. Ligue de novo.',
  ])
  assert.deepEqual(failuresOf(next.events), ['MODEL_ACCOUNTS_REFUSED'])
})

test('a única conta no limite não atende a este modelo: nenhuma conta, MODEL_NO_ACCOUNT, e não o limite', async (t) => {
  const f = await fleet(t)
  async function limitOther() {
    await f.hub.test.asOwner(
      `update builder.model_account set limited_until = now() + interval '1 hour', served_models = '{claude-outro}'`,
    )
  }
  const stream = await f.ask(limitOther)
  assert.deepEqual(await turnNotices(f.hub, f.ana, stream.url), [EXHAUSTED])
  assert.deepEqual(failuresOf(stream.events), ['MODEL_NO_ACCOUNT'])
  assert.equal(f.anthropic.chats.length, 0)
})

test('a única conta no limite é de um tipo que a empresa fechou: nenhuma conta, MODEL_NO_ACCOUNT, e não o limite', async (t) => {
  const f = await fleet(t)
  async function closeKind() {
    await f.hub.test.asOwner(
      `update builder.model_account set limited_until = now() + interval '1 hour', limit_reason = 'rate', kind = 'claude_subscription', hint = null`,
    )
  }
  const stream = await f.ask(closeKind)
  assert.deepEqual(await turnNotices(f.hub, f.ana, stream.url), [EXHAUSTED])
  assert.deepEqual(failuresOf(stream.events), ['MODEL_NO_ACCOUNT'])
  assert.equal(f.anthropic.chats.length, 0)
})
