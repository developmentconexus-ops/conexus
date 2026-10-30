import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { APP_SESSION_HEADER, callAppConnector } from '@conexus/hub-api'
import { edge, HOST, problem, SESSION, VERSION_CALL } from './test-edge.ts'

const LIVE = { Cookie: `__Host-conexus-app=${SESSION}` }
const CALL_PATH = '/api/app-connector-calls'

type Reader = (connectors: {
  call(...args: [string, string, unknown, string?]): Promise<unknown>
  connections(connector: string): Promise<readonly string[]>
}) => Promise<unknown>

/** A version on the air whose app runs `read` through its connectors; `connector` answers the Hub's connector paths. */
function reading(read: Reader, connector: (request: Request) => Response | Promise<Response>) {
  const results: unknown[] = []
  const door = edge({
    hub: (request) =>
      new URL(request.url).pathname.startsWith(CALL_PATH)
        ? connector(request)
        : Response.json(VERSION_CALL),
    app: async (_request, { props }) => {
      results.push(await read(props.connectors))
      return new Response('lido')
    },
  })
  function connectorCalls() {
    return door.hubCalls.filter((r) => new URL(r.url).pathname.startsWith(CALL_PATH))
  }
  return { door, results, connectorCalls }
}

async function errorsLogged<T>(t: TestContext, run: () => Promise<T>) {
  const lines: string[] = []
  t.mock.method(console, 'error', (line: string) => lines.push(line))
  const value = await run()
  return { value, lines: lines.map((line) => JSON.parse(line)) }
}

const OK = { kind: 'OK', value: { rows: [] } }

test('sem segredo: o app recebe só call e connections; nas props não há sessão nem endereço do Hub', async () => {
  const { door, results } = reading(
    async (connectors) => Object.keys(connectors).sort(),
    () => Response.json(OK),
  )
  await door.fetch('/', { headers: LIVE })
  assert.deepEqual(results, [['call', 'connections']])
  const [props] = door.appCalls.map((call) => call.args.props)
  assert.deepEqual(Object.keys(props ?? {}).sort(), ['caller', 'connectors', 'db'])
  const [bound] = door.connectorBindings
  assert.deepEqual(Object.keys(bound ?? {}).sort(), ['endsAt', 'host', 'session'])
  assert.equal(bound?.host, HOST)
  assert.equal(bound?.session, SESSION)
  assert.ok(!JSON.stringify(props).includes(SESSION))
  assert.ok(!JSON.stringify(props).includes('hub'))
})

test('a chamada leva ao Hub a sessão do app no cabeçalho, o Projeto pelo endereço, e passa a resposta', async () => {
  const { door, results, connectorCalls } = reading(
    (connectors) => connectors.call('sankhya', 'readOrders', { limit: 3 }, 'matriz'),
    () => Response.json(OK),
  )
  await door.fetch('/', { headers: LIVE })
  assert.deepEqual(results, [OK])
  const [request] = connectorCalls()
  assert.equal(request?.method, 'POST')
  assert.equal(request?.headers.get(APP_SESSION_HEADER), SESSION)
  const { deadlineMs, ...body } = callAppConnector.input.body.parse(await request?.json())
  assert.ok(deadlineMs >= 1 && deadlineMs <= 10_000)
  assert.deepEqual(body, {
    host: HOST,
    connector: 'sankhya',
    operation: 'readOrders',
    connection: 'matriz',
    input: { limit: 3 },
  })
})

test('connections: dá os nomes que o Hub dá; um Hub que recusa dá a lista vazia, registrada', async (t) => {
  const named = reading(
    (connectors) => connectors.connections('sankhya'),
    () => Response.json({ names: ['matriz', 'filial'] }),
  )
  await named.door.fetch('/', { headers: LIVE })
  assert.deepEqual(named.results, [['matriz', 'filial']])
  const [request] = named.connectorCalls()
  assert.equal(new URL(request?.url ?? '').searchParams.get('connector'), 'sankhya')
  assert.equal(request?.headers.get(APP_SESSION_HEADER), SESSION)

  const refused = reading(
    (connectors) => connectors.connections('sankhya'),
    () => problem('APP_ACCESS_REFUSED'),
  )
  const { lines } = await errorsLogged(t, () => refused.door.fetch('/', { headers: LIVE }))
  assert.deepEqual(refused.results, [[]])
  assert.deepEqual(lines, [
    { level: 50, msg: 'CONNECTOR_HUB_NO_ANSWER', reason: 'APP_ACCESS_REFUSED' },
  ])
})

test('o prazo: depois do fim do clique a chamada dá DEADLINE e não chega ao Hub', async (t) => {
  const start = Date.now()
  const now = t.mock.method(Date, 'now', () => start)
  const { door, results, connectorCalls } = reading(
    (connectors) => {
      now.mock.mockImplementation(() => start + 10_001)
      return connectors.call('sankhya', 'readOrders', {})
    },
    () => Response.json(OK),
  )
  await door.fetch('/', { headers: LIVE })
  assert.deepEqual(results, [{ kind: 'DEADLINE' }])
  assert.equal(connectorCalls().length, 0)
})

test('o prazo: o Hub recebe o que resta do clique, e uma chamada em andamento é cortada nele', async (t) => {
  const start = Date.now()
  const now = t.mock.method(Date, 'now', () => start)
  let sent: unknown
  const { door, results } = reading(
    (connectors) => {
      now.mock.mockImplementation(() => start + 9_950)
      return connectors.call('sankhya', 'readOrders', {})
    },
    async (request) => {
      sent = callAppConnector.input.body.parse(await request.clone().json()).deadlineMs
      return new Promise<Response>((_resolve, reject) => {
        request.signal.addEventListener('abort', () => reject(request.signal.reason))
      })
    },
  )
  await door.fetch('/', { headers: LIVE })
  assert.equal(sent, 50)
  assert.deepEqual(results, [{ kind: 'DEADLINE' }])
})

test('o Hub fora: sem resposta, recusa, acima do teto ou ilegível dão UNREACHABLE e uma linha com a razão', async (t) => {
  const hubs: [string, () => Response | Promise<Response>, string][] = [
    ['rede', () => Promise.reject(new TypeError('fetch failed')), 'NETWORK'],
    ['recusa', () => problem('DATABASE_UNAVAILABLE'), 'DATABASE_UNAVAILABLE'],
    ['status', () => new Response('x', { status: 500 }), 'UNEXPECTED_STATUS'],
    ['ilegível', () => Response.json({ kind: 'OUTRA' }), 'UNREADABLE'],
    [
      'acima do teto',
      () => new Response(`{"kind":"OK","value":"${'a'.repeat(2 * 1024 * 1024)}"}`),
      'TOO_LARGE',
    ],
  ]
  for (const [name, connector, reason] of hubs) {
    const { door, results } = reading(
      (connectors) => connectors.call('sankhya', 'readOrders', {}),
      connector,
    )
    const { lines } = await errorsLogged(t, () => door.fetch('/', { headers: LIVE }))
    assert.deepEqual(results, [{ kind: 'UNREACHABLE' }], name)
    assert.deepEqual(lines, [{ level: 50, msg: 'CONNECTOR_HUB_NO_ANSWER', reason }], name)
    t.mock.restoreAll()
  }
})
