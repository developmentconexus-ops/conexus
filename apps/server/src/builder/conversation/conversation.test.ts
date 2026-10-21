import assert from 'node:assert/strict'
import dns from 'node:dns'
import { syncBuiltinESMExports } from 'node:module'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { ConversationEvent } from '@conexus/hub-api'
import { call } from '../../hub/identity/test-hub.ts'
import { conversing, failuresOf, KEY, sent, started, streamOf } from './test-conversation.ts'
import { printedOf, routedTo, served } from './test-research.ts'

const PLANTED = /SECRET-PLANTED-TEXT/
const OBSERVER = /^You are the memory consciousness/

function textOf(events: ConversationEvent[]): string {
  return events.flatMap((event) => (event.type === 'text' ? [event.delta] : [])).join('')
}

test('um turno: a resposta vem aos poucos, a conversa ganha título e o Mastra guarda a empresa no dono', async (t) => {
  const { hub, ana, companyId, conversations, anthropic } = await conversing(t, (asked) =>
    asked.stream
      ? { kind: 'text', text: 'Olá, Ana. Vamos comparar os apps.' }
      : { kind: 'text', text: 'Apps de encomenda' },
  )
  const id = await started(hub, ana, conversations)
  const url = `${conversations}/${id}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal(
    (await sent(hub, ana, url, 'Compare dois apps de encomenda de padaria')).statusCode,
    202,
  )
  const events = await stream.turn()
  assert.equal(textOf(events), 'Olá, Ana. Vamos comparar os apps.')
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.ok(anthropic.sent.every((each) => each.key === KEY))
  const read = Object((await call(hub, ana, 'GET', url)).json()).conversation
  assert.deepEqual(
    read.messages.map((message: { role: string; parts: unknown[] }) => [
      message.role,
      message.parts,
    ]),
    [
      ['person', [{ type: 'text', text: 'Compare dois apps de encomenda de padaria' }]],
      ['builder', [{ type: 'text', text: 'Olá, Ana. Vamos comparar os apps.' }]],
    ],
  )
  assert.equal(read.model, 'anthropic/claude-sonnet-4-6')
  const threads = await hub.test.mastraPool.query(
    'select "resourceId" from mastra.mastra_threads where id = $1',
    [id],
  )
  assert.deepEqual(threads.rows, [{ resourceId: `company:${companyId}:person:${ana.id}` }])
  const indexed = await hub.test.asOwner(
    `select company_id, person_id from builder.conversation where id = $1`,
    [id],
  )
  assert.deepEqual(indexed, [{ company_id: companyId, person_id: ana.id }])
})

test('um 401 com texto plantado: o texto não sai no log, no stderr, nas respostas nem no stream', async (t) => {
  const printed = printedOf(t)
  const { hub, ana, conversations, lines } = await conversing(
    t,
    (asked) => (asked.stream ? { kind: 'refuse', status: 401 } : { kind: 'text', text: 'Título' }),
    (config) => ({ ...config, logLevel: 'info' }),
  )
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  const answered = await sent(hub, ana, url, 'Compare dois apps')
  assert.equal(answered.statusCode, 202)
  const events = await stream.turn()
  assert.deepEqual(events.slice(-2), [
    { type: 'part', part: { type: 'failure', code: 'MODEL_NO_ACCOUNT' } },
    { type: 'turnEnd', reason: 'error' },
  ])
  const read = await call(hub, ana, 'GET', url)
  const list = await call(hub, ana, 'GET', conversations)
  assert.equal(read.statusCode, 200)
  assert.match(printed.join(''), /CONVERSATION_CREATED/)
  const said = lines.flatMap((line) => (line.message.startsWith('CONVERSATION_') ? [line] : []))
  assert.deepEqual(
    said.map((line) => [line.message, line.fields.reason]),
    [
      ['CONVERSATION_TURN_STARTED', undefined],
      ['CONVERSATION_TURN_ENDED', 'error'],
    ],
  )
  const logged = [JSON.stringify(lines), printed.join(''), stream.seen.raw]
  for (const text of [...logged, answered.body, read.body, list.body]) {
    assert.doesNotMatch(text, PLANTED)
  }
})

/** The name resolves to 127.0.0.1, as an internal name would; every other name as before. */
function resolvesInternally(t: TestContext, name: string) {
  const real = dns.lookup
  function lookup(hostname: string, options: unknown, callback: unknown) {
    if (hostname !== name) return Reflect.apply(real, dns, [hostname, options, callback])
    const all = Object(options).all === true
    if (typeof callback === 'function') {
      callback(null, all ? [{ address: '127.0.0.1', family: 4 }] : '127.0.0.1', 4)
    }
  }
  Reflect.set(dns, 'lookup', lookup)
  syncBuiltinESMExports()
  t.after(() => {
    Reflect.set(dns, 'lookup', real)
    syncBuiltinESMExports()
  })
}

test('`web_fetch` a IP interno, a nome que resolve para um ou a redirecionamento para um: recusado, e o turno segue', async (t) => {
  const internal = await served(t, (_path, response) => response.end('segredo interno'))
  const site = await served(t, (path, response) =>
    path === '/cardapio'
      ? response.end('Cardápio da padaria')
      : response.writeHead(302, { location: `http://127.0.0.1:${internal.port}/admin` }).end(),
  )
  resolvesInternally(t, 'intranet.example.test')
  routedTo(t, { 'site.example.test': site.port })
  const addresses = [
    `http://127.0.0.1:${internal.port}/admin`,
    `http://intranet.example.test:${internal.port}/admin`,
    'http://site.example.test/pagina',
    'http://site.example.test/cardapio',
  ]
  let step = 0
  const { hub, ana, conversations, anthropic } = await conversing(t, (asked) => {
    if (!asked.stream) return { kind: 'text', text: 'Título' }
    const url = addresses[step]
    step += 1
    return url === undefined
      ? { kind: 'text', text: 'Não consegui abrir.' }
      : { kind: 'fetch', url }
  })
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Abra estas páginas')).statusCode, 202)
  const events = await stream.turn()
  assert.deepEqual(events.at(-1), { type: 'turnEnd', reason: 'complete' })
  assert.deepEqual(failuresOf(events), [])
  assert.equal(textOf(events), 'Não consegui abrir.')
  const pages = addresses.map((address, at) => ({
    ...{ type: 'tool', kind: 'read_page', subject: { url: address, title: null } },
    state: at === 3 ? 'completed' : 'error',
  }))
  const read = Object((await call(hub, ana, 'GET', url)).json()).conversation
  const kept = read.messages.flatMap((message: { parts: { type: string; id?: string }[] }) =>
    message.parts.flatMap(({ id: _, ...part }) => (part.type === 'tool' ? [part] : [])),
  )
  assert.deepEqual(kept, pages, 'each refused page is an error, the one read is complete')
  assert.deepEqual(site.reached, ['/pagina', '/cardapio'])
  assert.deepEqual(internal.reached, [])
  const last =
    anthropic.sent
      .filter((each) => each.stream)
      .at(-1)
      ?.texts.join('\n') ?? ''
  assert.equal(
    last.match(/private or reserved address/g)?.length,
    3,
    'each refusal reached the model',
  )
  assert.match(last, /Cardápio da padaria/)
})

test('o título nasce na primeira mensagem, pela conta do turno, e chega no stream já guardado', async (t) => {
  const { hub, ana, conversations, anthropic, link } = await conversing(t, (asked) => {
    if (asked.key === KEY && asked.stream) return { kind: 'refuse', status: 429 }
    if (!asked.stream) return { kind: 'text', text: 'Encomendas da padaria' }
    return { kind: 'text', text: 'Certo.' }
  })
  await link('Time 2', 'sk-ant-conversation-key-0002')
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  assert.equal((await sent(hub, ana, url, 'Como organizo as encomendas?')).statusCode, 202)
  let event = await stream.next()
  while (event.type !== 'title') event = await stream.next()
  assert.deepEqual(event, { type: 'title', title: 'Encomendas da padaria' })
  const titled = anthropic.sent.filter((each) => !each.stream)
  assert.deepEqual(
    titled.map((each) => each.key),
    ['sk-ant-conversation-key-0002'],
  )
  const read = await call(hub, ana, 'GET', url)
  assert.equal(Object(read.json()).conversation.title, 'Encomendas da padaria')
})

test('a observação vai pela conta do turno e não pede título; um 429 nela: o turno termina, sem texto cru', async (t) => {
  const printed = printedOf(t)
  const long = 'As encomendas da padaria chegam pelo telefone e pelo balcão. '.repeat(3000)
  const { hub, ana, conversations, anthropic, link, lines } = await conversing(t, (asked) => {
    if (OBSERVER.test(asked.system)) return { kind: 'refuse', status: 429 }
    if (asked.key === KEY && asked.stream) return { kind: 'refuse', status: 429 }
    if (!asked.stream) return { kind: 'text', text: 'Encomendas da padaria' }
    return { kind: 'text', text: asked.texts.length > 2 ? 'Certo.' : long }
  })
  await link('Time 2', 'sk-ant-conversation-key-0002')
  const url = `${conversations}/${await started(hub, ana, conversations)}`
  const stream = await streamOf(hub, ana, url)
  t.after(() => stream.close())
  for (const question of ['Como organizo as encomendas?', 'E os pedidos do balcão?']) {
    assert.equal((await sent(hub, ana, url, question)).statusCode, 202)
    assert.deepEqual((await stream.turn()).at(-1), { type: 'turnEnd', reason: 'complete' })
  }
  const read = await call(hub, ana, 'GET', url)
  // The observer buffers in the background past `messageTokens`; the Hub's close waits for it.
  await hub.close()
  const observed = anthropic.sent.filter((each) => OBSERVER.test(each.system))
  assert.ok(observed.length > 0, 'the second turn, past the threshold, was observed')
  for (const each of observed) {
    assert.equal(each.key, 'sk-ant-conversation-key-0002')
    assert.doesNotMatch(each.system, /thread-title/, 'the observer is never asked for a title')
  }
  for (const text of [JSON.stringify(lines), printed.join(''), stream.seen.raw, read.body]) {
    assert.doesNotMatch(text, PLANTED)
  }
})
