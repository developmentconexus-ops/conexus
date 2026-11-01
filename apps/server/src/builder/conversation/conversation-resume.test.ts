import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { hubBeside } from './test-beside.ts'
import {
  conversing,
  endOf,
  holding,
  PARTIAL,
  rolesAndParts,
  sent,
  started,
  streamOf,
  title,
} from './test-conversation.ts'
import { failuresOf } from './test-parts.ts'

test('o turno que roda quando o servidor cai fica parado: a sessão volta sem execução nem cartão, a releitura traz o que o Mastra guardou, nada retoma sozinho e a próxima mensagem funciona (49)', {
  timeout: 60_000,
}, async (t) => {
  const held = holding(t)
  const { hub, ana, conversations, anthropic } = await conversing(
    t,
    (asked) =>
      title(asked) ??
      (asked.texts.at(-1) === 'Depois' ? { kind: 'text', text: 'Pronto.' } : held.reply),
  )
  const fallen = await hubBeside(t, hub)
  const url = `${conversations}/${await started(fallen, ana, conversations)}`
  const stream = await streamOf(fallen, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(fallen, ana, url, 'Uma pergunta')).statusCode, 200)
  assert.equal(await stream.text(), PARTIAL)
  stream.close()

  const next = await hubBeside(t, hub)
  const calls = anthropic.sent.length
  const again = await streamOf(next, ana, url)
  t.after(() => again.close())
  const seed = await again.seed()
  assert.equal(seed.isRunning, false)
  assert.deepEqual(seed.pendingSuspensions, {})
  // Mastra saves a run's messages from its second step on: the first step's are lost (30).
  assert.deepEqual(await rolesAndParts(next, ana, url), [])
  await sleep(1000)
  assert.equal(anthropic.sent.length, calls, 'nothing resumed on its own')

  assert.equal((await sent(next, ana, url, 'Depois')).statusCode, 200)
  const events = await again.turn()
  assert.equal(endOf(events), 'complete')
  assert.deepEqual(failuresOf(events), [])
})
