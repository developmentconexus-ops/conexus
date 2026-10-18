import assert from 'node:assert/strict'
import { test } from 'node:test'
import { appLoginPassword } from '@conexus/hub-api'
import type { DbProps } from './db.ts'
import { dbOf } from './db.ts'

// Neon's HTTP proxy, faked at `fetch`: every request the driver makes is kept, and the answer is the
// one a test names, in the proxy's own shapes (a 200 with `results`, a 400 with PostgreSQL's fields).
const KEY = 'k'.repeat(43)
const PROPS: DbProps = {
  login: `app_${'J'.repeat(32)}_run`,
  host: 'ep-exemplo.neon.tech',
  database: 'neondb',
}
const ROWS = { fields: [{ name: 'id', dataTypeID: 23 }], rows: [['7']] }

type Proxy = () => Response | Promise<Response>

function neonAt(t: test.TestContext, proxy: Proxy) {
  const requests: Request[] = []
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    requests.push(new Request(input, init))
    return proxy()
  })
  const logged: unknown[] = []
  for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
    t.mock.method(console, method, (...args: unknown[]) => logged.push(...args))
  }
  const db = dbOf(KEY, PROPS)
  return { db, requests, logged }
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
