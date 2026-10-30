import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { edge, pageText, SESSION, VERSION_CALL } from './test-edge.ts'

const LIVE = { Cookie: `__Host-conexus-app=${SESSION}` }

/** A version on the air whose app answers after `ms` of the test's clock, or never. */
function answeringAfter(t: TestContext, ms: number | undefined) {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const reached = Promise.withResolvers<void>()
  const door = edge({
    hub: () => Response.json(VERSION_CALL),
    app: () => {
      reached.resolve()
      return new Promise<Response>((resolve) => {
        if (ms !== undefined) setTimeout(() => resolve(new Response('pronto')), ms)
      })
    },
  })
  return { door, reached: reached.promise }
}

async function loggedDuring<T>(run: () => Promise<T>) {
  const lines: string[] = []
  const original = console.error
  console.error = (line: string) => lines.push(line)
  try {
    return { value: await run(), lines: lines.map((line) => JSON.parse(line)) }
  } finally {
    console.error = original
  }
}

test('prazo: o app que não responde em 10 s dá a página de falha, registrada EDGE_APP_DEADLINE', async (t) => {
  const { door, reached } = answeringAfter(t, undefined)
  const { value: response, lines } = await loggedDuring(async () => {
    const answer = door.fetch('/', { headers: LIVE })
    await reached
    t.mock.timers.tick(10_000)
    return answer
  })
  assert.equal(response.status, 502)
  assert.equal(await pageText(response), '<h1>O app não conseguiu responder agora.</h1>')
  assert.deepEqual(lines, [{ level: 50, msg: 'EDGE_APP_DEADLINE', status: 502 }])
})

test('prazo: o app que responde antes dos 10 s passa', async (t) => {
  const { door, reached } = answeringAfter(t, 9_999)
  const answer = door.fetch('/', { headers: LIVE })
  await reached
  t.mock.timers.tick(9_999)
  const response = await answer
  assert.equal(response.status, 200)
  assert.equal(await response.text(), 'pronto')
})

test('limites: a versão e o exemplo recebem, a cada chamada, subRequests = 50 e cpuMs = 50', async () => {
  const version = edge({ hub: () => Response.json(VERSION_CALL) })
  await version.fetch('/', { headers: LIVE })
  const example = edge()
  await example.fetch('/', { headers: LIVE })
  for (const door of [version, example]) {
    assert.deepEqual(door.appCalls[0]?.options, {
      outbound: {},
      limits: { subRequests: 50, cpuMs: 50 },
    })
  }
})

test('limites: o prazo vai só no db do despachante; o app recebe caller e db, sem prazo nem contagem', async () => {
  const door = edge({ hub: () => Response.json(VERSION_CALL) })
  const before = Date.now()
  await door.fetch('/', { headers: LIVE })
  assert.deepEqual(Object.keys(door.appCalls[0]?.args.props ?? {}).sort(), [
    'caller',
    'connectors',
    'db',
  ])
  const [bound] = door.dbBindings
  const { endsAt = 0, ...login } = bound ?? {}
  assert.deepEqual(login, VERSION_CALL.database)
  assert.ok(endsAt >= before + 10_000 && endsAt <= Date.now() + 10_000, `endsAt ${endsAt}`)
})

test('limites: dois db.batch numa chamada chegam os dois ao db do despachante; nenhum lote é contado', async () => {
  const answers: unknown[] = []
  const door = edge({
    hub: () => Response.json(VERSION_CALL),
    app: async (_request, { props }) => {
      answers.push(await props.db.batch([{ text: 'INSERT INTO recado (texto) VALUES ($1)' }]))
      answers.push(await props.db.batch([{ text: 'INSERT INTO recado (texto) VALUES ($1)' }]))
      return new Response('gravado')
    },
  })
  const response = await door.fetch('/', { headers: LIVE })
  assert.equal(await response.text(), 'gravado')
  assert.deepEqual(answers, [{ results: [] }, { results: [] }])
})

test('limites: o connectors do despachante recebe o mesmo prazo do db, e o app o conta nos mesmos 50 subpedidos', async () => {
  const door = edge({ hub: () => Response.json(VERSION_CALL) })
  await door.fetch('/', { headers: LIVE })
  const [db] = door.dbBindings
  const [connectors] = door.connectorBindings
  assert.equal(connectors?.endsAt, db?.endsAt)
  assert.deepEqual(door.appCalls[0]?.options, {
    outbound: {},
    limits: { subRequests: 50, cpuMs: 50 },
  })
})
