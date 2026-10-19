import assert from 'node:assert/strict'
import dns from 'node:dns'
import fs from 'node:fs'
import http from 'node:http'
import { syncBuiltinESMExports } from 'node:module'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import type { ConversationEvent } from '@conexus/hub-api'
import { call, post } from '../../hub/identity/test-hub.ts'
import type { Sent } from '../../platform/test-anthropic.ts'
import { approvalsOf, conversing, KEY, sent, started, streamOf } from './test-conversation.ts'

const PLANTED = /SECRET-PLANTED-TEXT/
const OBSERVER = /^You are the memory consciousness/

function textOf(events: ConversationEvent[]): string {
  return events.flatMap((event) => (event.type === 'text' ? [event.delta] : [])).join('')
}

/**
 * Everything the process prints on stdout and stderr while the test runs, still printed: by the
 * streams, and by `fs` on their descriptors, as the Hub's logger writes.
 */
function printedOf(t: TestContext): string[] {
  const printed: string[] = []
  for (const out of [process.stdout, process.stderr]) {
    const write = out.write.bind(out)
    t.mock.method(out, 'write', (chunk: string | Uint8Array) => {
      printed.push(String(chunk))
      return write(chunk)
    })
  }
  for (const name of ['write', 'writeSync'] as const) {
    const real = fs[name]
    t.mock.method(fs, name, (...args: unknown[]) => {
      const [fd, chunk] = args
      if (fd === 1 || fd === 2) printed.push(String(chunk))
      return Reflect.apply(real, fs, args)
    })
  }
  return printed
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
  assert.equal(read.model, 'anthropic/claude-sonnet-4-5')
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
    { type: 'failure', code: 'MODEL_NO_ACCOUNT' },
    { type: 'turnEnd', reason: 'error' },
  ])
  const read = await call(hub, ana, 'GET', url)
  const list = await call(hub, ana, 'GET', conversations)
  assert.equal(read.statusCode, 200)
  assert.match(printed.join(''), /CONVERSATION_TURN_SENT/)
  const logged = [JSON.stringify(lines), printed.join(''), stream.seen.raw]
  for (const text of [...logged, answered.body, read.body, list.body]) {
    assert.doesNotMatch(text, PLANTED)
  }
})

test('um modelo fora dos quatro fornecedores de busca: só `web_fetch`; nos quatro, também `web_search`', async (t) => {
  const { hub, ana, companyId, conversations, anthropic } = await conversing(t, (asked) => ({
    kind: 'text',
    text: asked.stream ? 'Resposta' : 'Título',
  }))
  const groq = { owner: 'company', provider: 'groq', label: 'Groq 1', key: 'gsk-test-key-0001' }
  const linked = await post(hub, ana, `/api/companies/${companyId}/model-accounts`, groq)
  assert.equal(linked.statusCode, 201)
  for (const model of ['groq/llama-3.3-70b-versatile', undefined]) {
    const url = `${conversations}/${await started(hub, ana, conversations, { model })}`
    const stream = await streamOf(hub, ana, url)
    t.after(() => stream.close())
    assert.equal((await sent(hub, ana, url, 'Pesquise padarias')).statusCode, 202)
    assert.deepEqual((await stream.turn()).at(-1), { type: 'turnEnd', reason: 'complete' })
  }
  function streamed(each: Sent) {
    return each.stream
  }
  assert.deepEqual(
    anthropic.chats.filter(streamed).map((each) => [...each.tools].sort()),
    [['recall', 'web_fetch']],
  )
  assert.deepEqual(
    anthropic.sent.filter(streamed).map((each) => [...each.tools].sort()),
    [['recall', 'web_fetch', 'web_search']],
  )
})

test('as ferramentas de leitura do Builder rodam sem pedir; qualquer outra é negada, nenhuma espera por aprovação', async (t) => {
  const { hub } = await conversing(t, () => ({ kind: 'text', text: 'Resposta' }))
  const names = ['web_fetch', 'web_search', 'recall', 'write_file', 'execute_command', 'mcp_tool']
  assert.deepEqual(await approvalsOf(t, hub, names), {
    web_fetch: 'allow',
    web_search: 'allow',
    recall: 'allow',
    write_file: 'deny',
    execute_command: 'deny',
    mcp_tool: 'deny',
  })
})

/** A server on 127.0.0.1 that counts what reaches it and answers `reply`. */
async function served(
  t: TestContext,
  reply: (path: string, response: http.ServerResponse) => void,
) {
  const reached: string[] = []
  const server = http.createServer((request, response) => {
    reached.push(String(request.url))
    reply(String(request.url), response)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  return { port: address.port, reached }
}

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

/** The public name reaches `port` on this machine, as a public site would; the rest as before. */
function routedTo(t: TestContext, name: string, port: number) {
  const before = http.globalAgent
  const agent = new http.Agent()
  const connect = agent.createConnection.bind(agent)
  agent.createConnection = (options, callback) =>
    options.hostname === name || options.host === name
      ? connect({ ...options, host: '127.0.0.1', hostname: '127.0.0.1', port }, callback)
      : connect(options, callback)
  Reflect.set(http, 'globalAgent', agent)
  t.after(() => {
    Reflect.set(http, 'globalAgent', before)
    agent.destroy()
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
  routedTo(t, 'site.example.test', site.port)
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
  assert.ok(!events.some((event) => event.type === 'failure'))
  assert.equal(textOf(events), 'Não consegui abrir.')
  const page = { type: 'page', url: 'http://site.example.test/cardapio', title: null }
  assert.deepEqual(
    events.filter((event) => event.type === 'part'),
    [{ type: 'part', part: page }],
    'only the page read is shown',
  )
  const read = Object((await call(hub, ana, 'GET', url)).json()).conversation
  const kept = read.messages.flatMap((message: { parts: { type: string }[] }) =>
    message.parts.filter((part) => part.type === 'page'),
  )
  assert.deepEqual(kept, [page])
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

test('título e observação vão pela conta do turno; um 429 no observador: o turno termina, sem texto cru', async (t) => {
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
    for (;;) {
      const event = await stream.next()
      if (event.type === 'turnEnd') {
        assert.equal(event.reason, 'complete')
        break
      }
    }
  }
  const observed = anthropic.sent.filter((each) => OBSERVER.test(each.system))
  const titled = anthropic.sent.filter((each) => !each.stream && !OBSERVER.test(each.system))
  assert.ok(observed.length > 0, 'the observer was called')
  assert.ok(titled.length > 0, 'the title was asked')
  for (const each of [...observed, ...titled])
    assert.equal(each.key, 'sk-ant-conversation-key-0002')
  const read = await call(hub, ana, 'GET', url)
  assert.equal(Object(read.json()).conversation.title, 'Encomendas da padaria')
  for (const text of [JSON.stringify(lines), printed.join(''), stream.seen.raw, read.body]) {
    assert.doesNotMatch(text, PLANTED)
  }
})
