import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import type { ConversationEvent } from '@conexus/hub-api'
import {
  asked,
  conversing,
  holding,
  hubBeside,
  PARTIAL,
  sent,
  started,
  streamOf,
  title,
} from './test-conversation.ts'
import { ask, conversingWith, untilCard, WHO } from './test-questions.ts'

/** Whether the events say the text `PARTIAL` as a delta. */
function saidText(events: ConversationEvent[]): boolean {
  return events.some(
    (event) =>
      event.type === 'message_update' &&
      event.event.type === 'text-delta' &&
      event.event.delta.includes(PARTIAL),
  )
}

test('reconectar com o Last-Event-ID do turno em curso: só o que faltou, sem repetir o texto', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const first = await streamOf(hub, ana, url)
  t.after(() => first.close())
  assert.equal((await sent(hub, ana, url, 'Uma pergunta')).statusCode, 202)
  const said: ConversationEvent[] = [await first.next()]
  assert.equal(said[0]?.type, 'turn')
  while (!saidText(said)) said.push(await first.next())
  const [opened] = first.seen.ids
  const read = first.seen.ids.at(-1)
  assert.ok(opened !== undefined && read !== undefined)
  first.close()
  const missed = await streamOf(hub, ana, url, opened)
  t.after(() => missed.close())
  const after: ConversationEvent[] = []
  while (after.length < said.length - 1) after.push(await missed.next())
  assert.deepEqual(after, said.slice(1), 'what came after the turn opened, and nothing else')
  assert.deepEqual(missed.seen.ids, first.seen.ids.slice(1))
  missed.close()
  const again = await streamOf(hub, ana, url, read)
  t.after(() => again.close())
  held.release()
  const rest = await again.turn()
  assert.deepEqual(rest.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal(saidText(rest), false, 'the text already read is not said again')
  assert.doesNotMatch(again.seen.raw, new RegExp(PARTIAL))
})

test('reconectar com um id de outro turno, estragado, fora da forma ou de outra conversa: o retrato do turno, nunca um evento alheio', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(
    t,
    (asked) =>
      title(asked) ??
      (asked.texts.includes('Segunda') ? held.reply : { kind: 'text', text: 'Resposta Y' }),
  )
  const other = await asked(t, { hub, person: ana, conversations }, 'Pergunta Y')
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Primeira')).statusCode, 202)
  await stream.turn()
  const [earlier] = stream.seen.ids
  assert.equal((await sent(hub, ana, url, 'Segunda')).statusCode, 202)
  const said: ConversationEvent[] = []
  while (!saidText(said)) said.push(await stream.next())
  const now = String(stream.seen.ids.at(-1)).replace(/\.\d+$/, '')
  const malformed = ['0x1', '1e0', ' 1', '01', '0', '1.1'].map((place) => `${now}.${place}`)
  for (const id of [
    earlier,
    'estragado',
    `${randomUUID()}.1`,
    `${earlier}.1`,
    other.ids[1],
    ...malformed,
  ]) {
    const again = await streamOf(hub, ana, url, id)
    t.after(() => again.close())
    const snapshot = await again.next()
    assert.ok(snapshot.type === 'turn', `${id} reads the turn so far`)
    assert.deepEqual(
      snapshot.messages.flatMap((message) => message.parts),
      [{ type: 'text', text: PARTIAL }],
    )
    again.close()
    assert.doesNotMatch(again.seen.raw, /Resposta Y/)
  }
  held.release()
})

test('reconectar depois do fim do turno, com o id do fim, de outra conversa ou estragado: nada, até o próximo turno', async (t) => {
  const { hub, ana, conversations } = await conversing(
    t,
    (asked) => title(asked) ?? { kind: 'text', text: 'Resposta' },
  )
  const other = await asked(t, { hub, person: ana, conversations }, 'Pergunta Y')
  const { url, ids } = await asked(t, { hub, person: ana, conversations })
  const ended = String(ids.at(-1))
  const turn = ended.replace(/\.\d+$/, '')
  const resumed = []
  for (const id of [ended, other.ids[1], `${randomUUID()}.1`, `${turn}.0x1`, 'estragado']) {
    const stream = await streamOf(hub, ana, url, id)
    t.after(() => stream.close())
    resumed.push(stream)
  }
  assert.equal((await sent(hub, ana, url, 'Outra pergunta')).statusCode, 202)
  for (const stream of resumed) {
    const next = await stream.next()
    assert.ok(next.type === 'turn', 'the next turn opens, with nothing said before it')
    assert.deepEqual(
      next.messages.flatMap((message) => message.parts),
      [],
    )
    assert.doesNotMatch(stream.seen.raw, /Resposta/)
  }
})

test('um evento já dito e ainda não lido, quando o stream abre, chega uma vez só', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const live = await streamOf(hub, ana, url)
  t.after(() => live.close())
  assert.equal((await sent(hub, ana, url, 'Uma pergunta')).statusCode, 202)
  const said: ConversationEvent[] = []
  while (!saidText(said)) said.push(await live.next())
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  const snapshot = await stream.next()
  assert.deepEqual(
    snapshot.type === 'turn' && snapshot.messages.flatMap((message) => message.parts),
    [{ type: 'text', text: PARTIAL }],
  )
  held.release()
  const rest = await stream.turn()
  assert.deepEqual(rest.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.equal(saidText(rest), false)
  assert.equal(new Set(stream.seen.ids).size, stream.seen.ids.length, stream.seen.ids.join(' '))
})

test('depois de um reinício, uma reconexão com Last-Event-ID do aviso recebe o fim do turno', async (t) => {
  const { hub, ana, url, stream, send } = await conversingWith(t, [[ask(WHO)]])
  assert.equal((await send()).statusCode, 202)
  await untilCard(stream, 'question')
  const runId = stream.seen.ids.at(-1)?.split('.')[0]
  assert.ok(runId !== undefined)
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const rows = await hub.test.asOwner('select state from builder.run')
    if (JSON.stringify(rows) === JSON.stringify([{ state: 'waiting' }])) break
    await sleep(100)
  }
  await hub.test.asOwner(`update builder.run set lease_until = now() - interval '1 second'`)
  const beside = await hubBeside(t, hub)
  // The person's screen is connected to the new copy, which keeps the conversation open there.
  const connected = await streamOf(beside, ana, url)
  t.after(() => connected.close())
  await beside.restart()
  assert.deepEqual((await connected.turn()).at(-1), { type: 'turnEnd', reason: 'aborted' })
  const reconnected = await streamOf(beside, ana, url, `${runId}.1`)
  t.after(() => reconnected.close())
  assert.deepEqual(await reconnected.next(), { type: 'turnEnd', reason: 'aborted' })
})
