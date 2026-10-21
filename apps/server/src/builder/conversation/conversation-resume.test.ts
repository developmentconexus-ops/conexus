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

test('reconectar num turno de mais eventos do que o servidor guarda: nada se repete, até o próximo turno', async (t) => {
  const many = Array.from({ length: 10_001 }, (_, at) => ({
    type: 'text' as const,
    text: `t${at} `,
  }))
  let streamed = 0
  const { hub, ana, conversations } = await conversing(t, (asked) => {
    const named = title(asked)
    if (named !== undefined) return named
    streamed += 1
    return streamed === 1 ? { kind: 'blocks', blocks: many } : { kind: 'text', text: 'Curta' }
  })
  const { url, ids } = await asked(t, { hub, person: ana, conversations })
  assert.ok(ids.length > 10_001, `${ids.length} events said`)
  const again = await streamOf(hub, ana, url, ids[0])
  t.after(() => again.close())
  assert.equal((await sent(hub, ana, url, 'Outra pergunta')).statusCode, 202)
  let next = await again.next()
  while (next.type === 'title') next = await again.next()
  assert.ok(next.type === 'turn', 'the next turn opens, with nothing of the long one replayed')
  assert.deepEqual(next.message.parts, [])
})

test('o turno que falha diz a falha antes do fim, e ela fica: relida ao recarregar e ao reconectar', async (t) => {
  const { hub, ana, conversations, lines } = await conversing(
    t,
    (asked) => title(asked) ?? { kind: 'refuse', status: 400 },
  )
  const { url, events, ids } = await asked(t, { hub, person: ana, conversations })
  assert.deepEqual(events.slice(1), [
    { type: 'part', part: { type: 'failure', code: 'MODEL_CALL_FAILED' } },
    { type: 'turnEnd', reason: 'error' },
  ])
  const ended = lines.find((line) => line.message === 'CONVERSATION_TURN_ENDED')
  assert.equal(ended?.fields.code, 'MODEL_CALL_FAILED')
  const reconnected = await streamOf(hub, ana, url, ids[0])
  t.after(() => reconnected.close())
  assert.deepEqual(await reconnected.next(), events[1], 'a reconnect resumes with the failure')
  const read = await answeredOf(await hubBeside(t, hub), ana, url)
  assert.deepEqual(
    read.map((message) => [message.role, message.parts]),
    [
      ['person', [{ type: 'text', text: 'Compare dois apps de encomenda de padaria' }]],
      ['builder', [{ type: 'failure', code: 'MODEL_CALL_FAILED' }]],
    ],
  )
})

test('sem conta que atenda, a falha do turno é MODEL_NO_ACCOUNT, e ela e o aviso das contas ficam ao reler', async (t) => {
  const { hub, ana, conversations } = await conversing(
    t,
    (asked) => title(asked) ?? { kind: 'refuse', status: 401 },
  )
  const { url, events } = await asked(t, { hub, person: ana, conversations })
  assert.deepEqual(failuresOf(events), ['MODEL_NO_ACCOUNT'])
  const read = await answeredOf(hub, ana, url)
  assert.deepEqual(read.at(-1)?.parts, [
    { type: 'notice', text: EXHAUSTED },
    { type: 'failure', code: 'MODEL_NO_ACCOUNT' },
  ])
})

test('ler no meio de um turno que já usou ferramentas: o turno fica de fora, o fluxo o conta inteiro; ao fim, a leitura o tem', async (t) => {
  const held = holding(t)
  const research = await researching(t)
  let calls = 0
  const { hub, ana, conversations } = await conversing(t, (asked) => {
    if (title(asked) !== undefined) return research(asked)
    calls += 1
    return calls === 1 ? research(asked) : held.reply
  })
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Compare dois apps')).statusCode, 202)
  while ((await stream.next()).type !== 'text');
  const midway = rolesAndParts(await call(hub, ana, 'GET', url))
  assert.deepEqual(
    midway.map(([role]: [string]) => role),
    ['person'],
  )
  held.release()
  await stream.turn()
  for (const told of [...PAGES.map((page) => `"url":"${page}"`), PARTIAL, '"reason":"complete"'])
    assert.ok(stream.seen.raw.includes(told), `the stream told ${told}`)
  assert.deepEqual(
    (await messagesOf(hub, ana, url)).map((message) => message.role),
    ['person', 'builder'],
  )
})
