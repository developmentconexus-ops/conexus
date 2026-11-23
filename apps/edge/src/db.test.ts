import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  AppSessionToken,
  appLoginPassword,
  HostLabel,
  QUERY_SQL_MAX,
  recordAppRead,
} from '@conexus/hub-api'
import type { DbProps } from './db.ts'
import { dbOf } from './db.ts'
import { edge, HOST, problem, SESSION } from './test-edge.ts'

// Neon's HTTP proxy, faked at `fetch`: every request the driver makes is kept, and the answer is the
// one a test names, in the proxy's own shapes (a 200 with `results`, a 400 with PostgreSQL's fields).
// The Hub is the dispatcher's double of today, which answers each query's notice with a 204.
const KEY = 'k'.repeat(43)
const PROPS: DbProps = {
  login: `app_${'J'.repeat(32)}_run`,
  host: 'ep-exemplo.neon.tech',
  database: 'neondb',
  endsAt: Date.now() + 60_000,
  session: AppSessionToken.parse(SESSION),
  label: HostLabel.parse(HOST),
}
const ROWS = { fields: [{ name: 'id', dataTypeID: 23 }], rows: [['7']] }

type Proxy = () => Response | Promise<Response>
type Hub = (request: Request) => Response | Promise<Response>

function neonAt(
  t: test.TestContext,
  proxy: Proxy,
  props: DbProps = PROPS,
  hub: Hub = () => new Response(null, { status: 204 }),
) {
  const requests: Request[] = []
  const signals: (AbortSignal | null | undefined)[] = []
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(new Request(input, init))
    signals.push(init?.signal)
    return proxy()
  })
  const logged: unknown[] = []
  for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
    t.mock.method(console, method, (...args: unknown[]) => logged.push(...args))
  }
  const door = edge({ hub })
  const pending: Promise<void>[] = []
  const db = dbOf(KEY, props, { hub: door.hub, waitUntil: (told) => pending.push(told) })
  /** The notices the Hub received, once every one `waitUntil` holds has settled. */
  async function notices() {
    await Promise.all(pending)
    return Promise.all(
      door.hubCalls.map(async (request) => ({
        ...{ url: request.url, request },
        body: recordAppRead.input.body.parse(await request.json()),
      })),
    )
  }
  return { db, requests, signals, logged, pending, notices }
}

function refused(code: string, message: string): Response {
  return Response.json({ message, code, detail: 'senha=segredo' }, { status: 400 })
}

test('db: entra no banco com o login da chamada e a senha derivada da chave', async (t) => {
  const neon = neonAt(t, () => Response.json({ results: [ROWS] }))
  assert.deepEqual(await neon.db.query('SELECT $1::int AS id', [7]), { rows: [{ id: 7 }] })
  const [request] = neon.requests
  const url = new URL(request?.headers.get('Neon-Connection-String') ?? '')
  assert.equal(url.hostname, PROPS.host)
  assert.equal(url.pathname, `/${PROPS.database}`)
  assert.equal(decodeURIComponent(url.username), PROPS.login)
  assert.equal(
    decodeURIComponent(url.password),
    await appLoginPassword({ key: KEY, login: PROPS.login }),
  )
})

test('db: query só lê, numa transação somente leitura; uma escrita volta só com o código', async (t) => {
  const neon = neonAt(t, () => refused('25006', 'cannot execute INSERT in a read-only transaction'))
  const answer = await neon.db.query("INSERT INTO recado (texto) VALUES ('x')")
  assert.deepEqual(answer, { error: { code: '25006' } })
  const [request] = neon.requests
  assert.equal(request?.headers.get('Neon-Batch-Read-Only'), 'true')
  assert.deepEqual(await request?.json(), {
    queries: [{ query: "INSERT INTO recado (texto) VALUES ('x')", params: [] }],
  })
})

test('db: batch grava tudo numa transação de escrita', async (t) => {
  const neon = neonAt(t, () => Response.json({ results: [ROWS, ROWS] }))
  const answer = await neon.db.batch([
    { text: 'INSERT INTO recado (texto) VALUES ($1) RETURNING id', values: ['a'] },
    { text: 'INSERT INTO recado (texto) VALUES ($1) RETURNING id', values: ['b'] },
  ])
  assert.deepEqual(answer, { results: [{ rows: [{ id: 7 }] }, { rows: [{ id: 7 }] }] })
  const [request] = neon.requests
  assert.equal(request?.headers.get('Neon-Batch-Read-Only'), null)
  assert.deepEqual(await request?.json(), {
    queries: [
      { query: 'INSERT INTO recado (texto) VALUES ($1) RETURNING id', params: ['a'] },
      { query: 'INSERT INTO recado (texto) VALUES ($1) RETURNING id', params: ['b'] },
    ],
  })
})

test('db: a senha não sai na resposta nem no registro; erro sem resposta do Neon é 08000', async (t) => {
  const password = await appLoginPassword({ key: KEY, login: PROPS.login })
  const neon = neonAt(t, () => Promise.reject(new TypeError(`fetch failed: ${password}`)))
  const answers = [await neon.db.query('SELECT 1'), await neon.db.batch([{ text: 'SELECT 1' }])]
  assert.deepEqual(answers, [{ error: { code: '08000' } }, { error: { code: '08000' } }])
  const outside = JSON.stringify([answers, neon.logged])
  for (const secret of [password, KEY, PROPS.login, PROPS.host]) {
    assert.ok(!outside.includes(secret), 'a resposta e o registro não levam login nem senha')
  }
})

test('db: a recusa do PostgreSQL leva só o código, sem mensagem nem detalhe', async (t) => {
  const neon = neonAt(t, () => refused('42501', `permission denied for schema app_outro`))
  assert.deepEqual(await neon.db.batch([{ text: 'DELETE FROM app_outro.recado' }]), {
    error: { code: '42501' },
  })
})

test('db: chamado depois do prazo da chamada, DB_DEADLINE sem ir ao Neon, e registrado', async (t) => {
  const neon = neonAt(t, () => Response.json({ results: [ROWS] }), {
    ...PROPS,
    endsAt: Date.now() - 1,
  })
  const answers = [await neon.db.query('SELECT 1'), await neon.db.batch([{ text: 'SELECT 1' }])]
  assert.deepEqual(answers, [
    { error: { code: 'DB_DEADLINE' } },
    { error: { code: 'DB_DEADLINE' } },
  ])
  assert.equal(neon.requests.length, 0)
  assert.deepEqual(
    neon.logged.map((line) => JSON.parse(String(line))),
    [
      { level: 40, msg: 'DB_DEADLINE' },
      { level: 40, msg: 'DB_DEADLINE' },
    ],
  )
})

test('db: o pedido ao Neon em curso é cortado no prazo da chamada, com DB_DEADLINE', async (t) => {
  const neon = neonAt(
    t,
    () =>
      new Promise<Response>((_resolve, reject) => {
        neon.signals.at(-1)?.addEventListener('abort', () => reject(neon.signals.at(-1)?.reason))
      }),
    { ...PROPS, endsAt: Date.now() + 50 },
  )
  assert.deepEqual(await neon.db.query('SELECT pg_sleep(6)'), { error: { code: 'DB_DEADLINE' } })
  assert.equal(neon.requests.length, 1)
})

test('a consulta recusada avisa; o batch não', async (t) => {
  const neon = neonAt(t, () => refused('42501', 'permission denied for table sankhya_clientes'))
  assert.deepEqual(await neon.db.query('SELECT * FROM sankhya_clientes'), {
    error: { code: '42501' },
  })
  await neon.db.batch([{ text: 'DELETE FROM sankhya_clientes' }])
  const [notice, ...more] = await neon.notices()
  assert.deepEqual(more, [], 'o batch não avisa')
  assert.equal(notice?.url, `http://hub:8081/api/app-reads?host=${HOST}`)
  assert.equal(notice?.request.method, 'POST')
  assert.equal(notice?.request.headers.get('X-Conexus-App-Session'), SESSION)
  const { id: _id, ms: _ms, ...told } = notice?.body ?? {}
  assert.deepEqual(told, { query: 'SELECT * FROM sankhya_clientes', outcome: '42501', rows: null })
  const password = await appLoginPassword({ key: KEY, login: PROPS.login })
  for (const secret of [password, KEY, PROPS.login, PROPS.host]) {
    assert.ok(!JSON.stringify(notice?.body).includes(secret), 'o aviso não leva login nem senha')
  }
})

test('a consulta que lê avisa com a contagem, e cada consulta com o seu id', async (t) => {
  const neon = neonAt(t, () => Response.json({ results: [{ ...ROWS, rows: [['7'], ['8']] }] }))
  await neon.db.query('SELECT id FROM recado')
  await neon.db.query('SELECT id FROM recado')
  const notices = await neon.notices()
  assert.deepEqual(
    notices.map(({ body }) => [body.query, body.outcome, body.rows]),
    Array(2).fill(['SELECT id FROM recado', 'ROWS', 2]),
  )
  assert.notEqual(notices[0]?.body.id, notices[1]?.body.id)
})

test('o aviso vai depois e não muda a resposta', async (t) => {
  const held = Promise.withResolvers<void>()
  const quiet = neonAt(
    t,
    () => Response.json({ results: [ROWS] }),
    PROPS,
    async () => {
      await held.promise
      throw new TypeError('Network connection lost.')
    },
  )
  const answer = await quiet.db.query('SELECT $1::int AS id', [7])
  assert.deepEqual(answer, { rows: [{ id: 7 }] }, 'a resposta volta com o aviso ainda no ar')
  assert.equal(quiet.pending.length, 1)
  held.resolve()
  const notices = await quiet.notices()
  assert.equal(notices.length, 2, 'a borda tenta mais uma vez')
  assert.equal(notices[0]?.body.id, notices[1]?.body.id, 'com o mesmo id')
  assert.deepEqual(
    quiet.logged.map((line) => JSON.parse(String(line))),
    [{ level: 50, msg: 'EDGE_READ_UNRECORDED', reason: 'NETWORK' }],
  )
  assert.ok(!quiet.logged.join('').includes('SELECT'), 'o log não leva a consulta')
  let tries = 0
  const once = neonAt(
    t,
    () => Response.json({ results: [ROWS] }),
    PROPS,
    () => (++tries === 1 ? problem('DATABASE_UNAVAILABLE') : new Response(null, { status: 204 })),
  )
  assert.deepEqual(await once.db.query('SELECT $1::int AS id', [7]), answer)
  assert.equal((await once.notices()).length, 2)
  assert.deepEqual(once.logged, [], 'a segunda tentativa gravou')
  const ended = neonAt(
    t,
    () => Response.json({ results: [ROWS] }),
    PROPS,
    () => problem('APP_SESSION_INVALID'),
  )
  assert.deepEqual(await ended.db.query('SELECT $1::int AS id', [7]), answer)
  assert.equal((await ended.notices()).length, 1, 'a recusa que assenta não se repete')
  assert.deepEqual(
    ended.logged.map((line) => JSON.parse(String(line))),
    [{ level: 50, msg: 'EDGE_READ_UNRECORDED', code: 'APP_SESSION_INVALID' }],
  )
})

test('a consulta longa é cortada', async (t) => {
  const neon = neonAt(t, () => Response.json({ results: [ROWS] }))
  const head = 'SELECT 1 -- '
  const long = `${head}${'x'.repeat(QUERY_SQL_MAX)}`
  const split = `${head}${'x'.repeat(QUERY_SQL_MAX - head.length - 1)}😀`
  await neon.db.query(long)
  await neon.db.query(split)
  const [cut, whole] = (await neon.notices()).map(({ body }) => body.query)
  assert.equal(cut, long.slice(0, QUERY_SQL_MAX))
  assert.equal(whole, split.slice(0, QUERY_SQL_MAX - 1), 'sem meio caractere')
})
