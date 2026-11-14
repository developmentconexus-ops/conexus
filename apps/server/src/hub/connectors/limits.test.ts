import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { CONCURRENT_CALL } from '@conexus/connectors'
import { CompanyId, ConnectionId, PersonId, ProjectId, RunId } from '@conexus/hub-api'
import { z } from 'zod'
import { TurnKey } from './public.ts'
import { appCalls, sankhyaDoor } from './test-app-calls.ts'
import {
  A,
  B,
  createLimits,
  executorOf,
  executorWithBrokenLogout,
  NO_EXECUTOR,
  OPENED,
} from './test-limits.ts'

test('uma por vez: dez leituras na mesma ligação fazem um login e nunca duas chamadas abertas; outra ligação anda ao lado', async (t) => {
  const on = await appCalls(t)
  await on.connect('Matriz')
  on.fake.switches.delayMilliseconds = 20
  const answers = await Promise.all(Array.from({ length: 10 }, () => on.read()))
  assert.deepEqual(
    answers.map((response) => Object(response.json()).kind),
    Array(10).fill('OK'),
  )
  assert.equal(on.fake.logins(), 1, 'the Testar and the ten reads share one token')
  const limits = createLimits({ executor: NO_EXECUTOR })
  const busy = Promise.withResolvers<void>()
  const holder = limits.inTurn(A, 1000, () => busy.promise)
  const other = await limits.inTurn(B, 1000, async () => 'B')
  busy.resolve()
  assert.equal(other, 'B', 'two connections wait for nobody')
  await holder
})

test('o prazo de quem espera: passa do prazo na fila e responde DEADLINE; quem tem a vez segue', async () => {
  const limits = createLimits({ executor: NO_EXECUTOR })
  const busy = Promise.withResolvers<void>()
  const holder = limits.inTurn(A, 1000, async () => {
    await busy.promise
    return 'done'
  })
  // Frees the holder if the waiter never answers, so a broken deadline fails the asserts instead of hanging.
  const fallback = setTimeout(busy.resolve, 5_000)
  const started = performance.now()
  const waiter = await limits.inTurn(A, 60, async () => 'ran')
  const elapsed = performance.now() - started
  clearTimeout(fallback)
  busy.resolve()
  assert.deepEqual(waiter, { kind: 'DEADLINE' }, 'answered while the turn was still held')
  assert.ok(elapsed >= 55, `${elapsed} ms: not before its own deadline`)
  assert.equal(await holder, 'done')
  assert.equal(
    await limits.inTurn(A, 1000, async (waited) => (waited < 50 ? 'free' : 'late')),
    'free',
  )
})

test('o dono do token: reusa enquanto vale; perto do fim faz o logout do velho e só depois o login; closeAll solta os vivos', async () => {
  const events: string[] = []
  const limits = createLimits({ executor: executorOf(events, 300) })
  const opened = OPENED
  const first = await limits.token(opened, 1000)
  assert.deepEqual(await limits.token(opened, 1000), first)
  assert.deepEqual(events, ['login1'])
  await limits.closeAll(1000)
  assert.deepEqual(events, ['login1', 'logout t1'])
  const short: string[] = []
  const renewing = createLimits({ executor: executorOf(short, 30) })
  await renewing.token(opened, 1000)
  await renewing.token(opened, 1000)
  assert.deepEqual(short, ['login1', 'logout t1', 'login2'])
})

test('um 401 derruba o token, renova uma vez e repete; a leitura segue OK', async (t) => {
  const on = await appCalls(t)
  await on.connect('Matriz')
  assert.equal(Object((await on.read()).json()).kind, 'OK')
  const before = on.fake.logins()
  on.fake.expireTokens()
  const again = await on.read()
  assert.equal(Object(again.json()).kind, 'OK')
  assert.equal(on.fake.logins(), before + 1)
})

test('o status 4: UNREADABLE com o que veio, a linha de erro CONNECTOR_CONCURRENCY_FAULT, sem repetir a chamada', async (t) => {
  let calls = 0
  const on = await appCalls(t, {
    declared: [{ connector: 'sankhya', operations: ['consultar'] }],
    through: async (origin) => {
      const server = createServer(async (incoming, outgoing) => {
        const url = new URL(incoming.url ?? '/', origin)
        const door = url.pathname.endsWith('service.sbr') && !url.search.includes('logout')
        if (door) {
          calls += 1
          outgoing.writeHead(200, { 'content-type': 'application/json' })
          outgoing.end(JSON.stringify({ serviceName: 'DbExplorerSP.executeQuery', status: '4' }))
          return
        }
        const chunks: Buffer[] = []
        for await (const chunk of incoming) chunks.push(z.instanceof(Buffer).parse(chunk))
        const headers = Object.entries(incoming.headers).flatMap(([name, value]) =>
          typeof value === 'string' && name !== 'host'
            ? [[name, value] satisfies [string, string]]
            : [],
        )
        const answered = await fetch(url, {
          method: incoming.method,
          headers,
          ...(incoming.method === 'GET' ? {} : { body: Buffer.concat(chunks) }),
        })
        outgoing.writeHead(answered.status, Object.fromEntries(answered.headers))
        outgoing.end(Buffer.from(await answered.arrayBuffer()))
      })
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
      t.after(() => {
        server.closeAllConnections()
        server.close()
      })
      return `http://127.0.0.1:${z.object({ port: z.number() }).parse(server.address()).port}`
    },
  })
  await on.connect('Matriz')
  const read = await on.read({ operation: 'consultar', input: { sql: 'SELECT 1 FROM TSIEMP' } })
  const answer = Object(read.json())
  assert.equal(answer.kind, 'UNREADABLE')
  assert.equal(answer.native.code, CONCURRENT_CALL)
  assert.equal(calls, 1)
  assert.ok(on.hub.lines.some((line) => line.message === 'CONNECTOR_CONCURRENCY_FAULT'))
})

/** The test's clock for a token's end; `settled` lets what a fired timer started run to its end. */
function clockOf(t: TestContext) {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] })
  return {
    tick: (ms: number) => t.mock.timers.tick(ms),
    settled: () => new Promise((resolve) => setImmediate(resolve)),
  }
}

test('nenhum token vence aberto: perto do fim, o logout sai sozinho, uma vez, e a próxima leitura faz outro login', async (t) => {
  const clock = clockOf(t)
  const events: string[] = []
  const limits = createLimits({ executor: executorOf(events, 61) })
  await limits.token(OPENED, 1000)
  assert.deepEqual(events, ['login1'])
  clock.tick(999)
  await clock.settled()
  assert.deepEqual(events, ['login1'], 'not before its end minus the margin')
  clock.tick(1)
  await clock.settled()
  assert.deepEqual(events, ['login1', 'logout t1'], 'logged out at its end minus the margin')
  await limits.token(OPENED, 1000)
  assert.deepEqual(events, ['login1', 'logout t1', 'login2'])
  await limits.closeAll(1000)
  clock.tick(1000)
  await clock.settled()
  assert.deepEqual(
    events,
    ['login1', 'logout t1', 'login2', 'logout t2'],
    'closeAll stops the timer',
  )
})

test('o logout do fim espera a vez da ligação: com uma leitura aberta no token, nada sai; quando ela termina, o logout sai', async (t) => {
  const clock = clockOf(t)
  const events: string[] = []
  const limits = createLimits({ executor: executorOf(events, 61) })
  await limits.token(OPENED, 1000)
  const read = Promise.withResolvers<void>()
  const reading = limits.inTurn(OPENED.id, 1000, async () => {
    await read.promise
    events.push('read done')
  })
  clock.tick(1000)
  await clock.settled()
  assert.deepEqual(events, ['login1'], 'the timer fired and the logout did not meet the read')
  read.resolve()
  await reading
  await clock.settled()
  assert.deepEqual(events, ['login1', 'read done', 'logout t1'])
})

test('o logout do fim com defeito vai ao registro e não derruba o processo', async (t) => {
  const clock = clockOf(t)
  const lines: string[] = []
  const limits = createLimits({
    executor: executorWithBrokenLogout(),
    log: { info: () => undefined, error: (_, message) => lines.push(message) },
  })
  const unhandled: unknown[] = []
  function hear(reason: unknown) {
    unhandled.push(reason)
  }
  process.on('unhandledRejection', hear)
  try {
    await limits.token(OPENED, 1000)
    clock.tick(1000)
    await clock.settled()
  } finally {
    process.off('unhandledRejection', hear)
  }
  assert.deepEqual(lines, ['INTERNAL_UNEXPECTED'])
  assert.deepEqual(unhandled, [])
})

test('o Assistente na fila: uma leitura do Assistente e uma do Builder na mesma ligação não abrem duas chamadas juntas', async (t) => {
  const door = sankhyaDoor(t)
  const on = await appCalls(t, { through: door.through })
  const connectionId = ConnectionId.parse(await on.connect('Matriz'))
  const companyId = CompanyId.parse(on.companyId)
  const personId = PersonId.parse(on.ana.id)
  const release = door.hold()
  const both = Promise.all([
    on.hub.connectors.assistant.read(
      { companyId, personId, place: { kind: 'COMPANY' }, chosen: [connectionId] },
      {
        connectionId,
        turn: TurnKey.parse(randomUUID()),
        operation: 'empresas',
        input: { page: 0 },
      },
    ),
    on.hub.connectors.builder.read(
      { companyId, projectId: ProjectId.parse(on.projectId) },
      {
        connectionId,
        personId,
        runId: RunId.parse(randomUUID()),
        operation: 'empresas',
        input: { page: 0 },
      },
    ),
  ])
  await door.reached(1)
  // No event says a call is not coming: a second call outside the line has 300 ms to reach the double.
  await sleep(300)
  assert.equal(door.open(), 1, 'the other read waits its turn')
  release()
  const [assistant, builder] = await both
  assert.deepEqual([assistant.kind, builder.kind], ['OK', 'OK'])
  assert.equal(door.most(), 1)
  const waits = on.hub.lines
    .filter((line) => line.message === 'CONNECTOR_CALLED')
    .map((line) => [line.fields.by, Number(line.fields.queuedMs)] as const)
    .sort((a, b) => a[1] - b[1])
  assert.equal(waits.length, 2)
  assert.ok(Number(waits[0]?.[1]) < 100, 'the first call did not wait')
  assert.ok(Number(waits[1]?.[1]) >= 100, 'the second waited for the first')
  assert.deepEqual(waits.map(([by]) => by).sort(), ['assistant', 'builder'])
})

test('o turno parado corta a espera: a leitura na fila sai na hora, sem chamar o fornecedor; a que já tinha a vez termina', async (t) => {
  const door = sankhyaDoor(t)
  const on = await appCalls(t, { through: door.through })
  const connectionId = ConnectionId.parse(await on.connect('Matriz'))
  const companyId = CompanyId.parse(on.companyId)
  const personId = PersonId.parse(on.ana.id)
  const release = door.hold()
  const first = on.hub.connectors.assistant.read(
    { companyId, personId, place: { kind: 'COMPANY' }, chosen: [connectionId] },
    {
      connectionId,
      turn: TurnKey.parse(randomUUID()),
      operation: 'empresas',
      input: { page: 0 },
    },
  )
  let firstEnded = false
  void first.then(() => {
    firstEnded = true
  })
  await door.reached(1)
  const stop = new AbortController()
  const queued = on.hub.connectors.builder.read(
    { companyId, projectId: ProjectId.parse(on.projectId) },
    {
      connectionId,
      personId,
      runId: RunId.parse(randomUUID()),
      operation: 'empresas',
      input: { page: 0 },
      signal: stop.signal,
    },
  )
  // No event says the queued read is in the line; were it not yet, the stop still answers DEADLINE.
  await sleep(250)
  stop.abort()
  // Frees the first read if the line ignores the stop, so the test fails on the asserts instead of hanging.
  const fallback = setTimeout(release, 5_000)
  const answer = await queued
  const ended = firstEnded
  clearTimeout(fallback)
  release()
  assert.deepEqual(answer, { kind: 'DEADLINE' })
  assert.equal(ended, false, 'it left the line while the first still had the turn')
  assert.equal((await first).kind, 'OK', 'the read that had the turn finished')
  const called = on.hub.lines.filter((line) => line.message === 'CONNECTOR_CALLED')
  assert.equal(called.length, 1, 'the stopped read never reached the provider')
  assert.equal(called[0]?.fields.by, 'assistant')
  assert.equal(on.hub.lines.filter((line) => line.message === 'CONNECTOR_READ_STOPPED').length, 1)
})
