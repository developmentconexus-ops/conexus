import assert from 'node:assert/strict'
import { test } from 'node:test'
import { post } from '../../hub/identity/test-hub.ts'
import { endOf, sent, streamOf, turnNotices } from '../conversation/test-conversation.ts'
import { failuresOf } from '../conversation/test-parts.ts'
import { EXHAUSTED, fleet, saidLive } from './test-fleet.ts'

test('todas no limite, com conta de outro fornecedor: o aviso diz até quando, MODEL_ACCOUNTS_LIMITED e não MODEL_NO_ACCOUNT, também na mensagem seguinte', async (t) => {
  const f = await fleet(t, {
    'Time 1': { kind: 'refuse', status: 429 },
    Dois: { kind: 'refuse', status: 429 },
  })
  await f.add('Dois')
  const groq = { owner: 'company', provider: 'groq', label: 'Groq 1', key: 'gsk-queue-key-0001' }
  assert.equal((await post(f.hub, f.ana, f.accounts, groq)).statusCode, 201)
  const first = await f.ask()
  assert.deepEqual(f.calls(), ['Time 1', 'Dois'])
  const notices = await turnNotices(f.hub, f.ana, first.url)
  assert.match(notices[0] ?? '', /^Time 1 no limite até \d{2}h\d{2}; continuei pela Dois\.$/)
  assert.match(notices[1] ?? '', /^Dois no limite até \d{2}h\d{2}\.$/)
  assert.equal(notices.length, 2)
  assert.deepEqual(saidLive(first.events), notices)
  assert.deepEqual(failuresOf(first.events), ['MODEL_ACCOUNTS_LIMITED'])
  assert.equal(endOf(first.events), 'error')
  const stream = await streamOf(f.hub, f.ana, first.url)
  t.after(() => stream.close())
  assert.equal((await sent(f.hub, f.ana, first.url, 'Continue')).statusCode, 200)
  const next = { events: await stream.turn() }
  assert.deepEqual(f.calls(), ['Time 1', 'Dois'], 'an account in its limit is not called again')
  const said = await turnNotices(f.hub, f.ana, first.url)
  assert.equal(said.length, 1)
  assert.match(
    said[0] ?? '',
    /^As contas Anthropic que você pode usar estão no limite até \d{2}h\d{2}\.$/,
  )
  assert.deepEqual(failuresOf(next.events), ['MODEL_ACCOUNTS_LIMITED'])
  assert.equal(endOf(next.events), 'error')
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
