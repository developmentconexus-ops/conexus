import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { call } from '../../hub/identity/test-hub.ts'
import {
  answeredOf,
  asked,
  conversing,
  failuresOf,
  holding,
  hubBeside,
  messagesOf,
  PARTIAL,
  rolesAndParts,
  sent,
  started,
  streamOf,
  title,
} from './test-conversation.ts'
import { PAGES, researching } from './test-research.ts'

const EXHAUSTED =
  'As contas Anthropic que você pode usar estão indisponíveis. Escolha outro modelo ou fale com quem administra a empresa.'

test('reconectar com o Last-Event-ID do turno em curso: só o que faltou, sem repetir o texto', async (t) => {
  const held = holding(t)
  const { hub, ana, conversations } = await conversing(t, (asked) => title(asked) ?? held.reply)
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const first = await streamOf(hub, ana, url)
  t.after(() => first.close())
  assert.equal((await sent(hub, ana, url, 'Uma pergunta')).statusCode, 202)
  assert.equal((await first.next()).type, 'turn')
  assert.deepEqual(await first.next(), { type: 'text', delta: PARTIAL })
  const [opened, read] = first.seen.ids
  assert.ok(opened !== undefined && read !== undefined)
  first.close()
  const missed = await streamOf(hub, ana, url, opened)
  t.after(() => missed.close())
  assert.deepEqual(await missed.next(), { type: 'text', delta: PARTIAL })
  assert.deepEqual(missed.seen.ids, [read])
  missed.close()
  const again = await streamOf(hub, ana, url, read)
  t.after(() => again.close())
  held.release()
  const rest = await again.turn()
  assert.deepEqual(rest, [{ type: 'turnEnd', reason: 'complete' }])
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
  while ((await stream.next()).type !== 'text');
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
    assert.deepEqual(snapshot.message.parts, [{ type: 'text', text: PARTIAL }])
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
    let next = await stream.next()
    while (next.type === 'title') next = await stream.next()
    assert.ok(next.type === 'turn', 'the next turn opens, with nothing said before it')
    assert.deepEqual(next.message.parts, [])
    assert.doesNotMatch(stream.seen.raw, /Resposta/)
  }
})
