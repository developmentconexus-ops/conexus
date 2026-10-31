import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { test } from 'node:test'
import { setTimeout as sleep } from 'node:timers/promises'
import { CONCURRENT_CALL } from '@conexus/connectors'
import { z } from 'zod'
import type { Executor } from './executor.ts'
import { appCalls } from './test-app-calls.ts'
import { A, B, createLimits, executorOf, NO_EXECUTOR, OPENED } from './test-limits.ts'

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
  const started = performance.now()
  function slow(id: typeof A) {
    return limits.inTurn(id, 1000, () => sleep(100))
  }
  await Promise.all([slow(A), slow(B)])
  assert.ok(performance.now() - started < 190, 'two connections wait for nobody')
})

test('o prazo de quem espera: passa do prazo na fila e responde DEADLINE; quem tem a vez segue', async () => {
  const limits = createLimits({ executor: NO_EXECUTOR })
  const holder = limits.inTurn(A, 1000, async () => {
    await sleep(300)
    return 'done'
  })
  const started = performance.now()
  const waiter = await limits.inTurn(A, 60, async () => 'ran')
  const elapsed = performance.now() - started
  assert.deepEqual(waiter, { kind: 'DEADLINE' })
  assert.ok(elapsed >= 55 && elapsed < 200, `${elapsed} ms: answered at its own deadline`)
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

test('nenhum token vence aberto: perto do fim, o logout sai sozinho, uma vez, e a próxima leitura faz outro login', async () => {
  const events: string[] = []
  const limits = createLimits({ executor: executorOf(events, 61) })
  await limits.token(OPENED, 1000)
  assert.deepEqual(events, ['login1'])
  await sleep(1300)
  assert.deepEqual(events, ['login1', 'logout t1'], 'logged out at its end minus the margin')
  await limits.token(OPENED, 1000)
  assert.deepEqual(events, ['login1', 'logout t1', 'login2'])
  await limits.closeAll(1000)
  await sleep(1300)
  assert.deepEqual(
    events,
    ['login1', 'logout t1', 'login2', 'logout t2'],
    'closeAll stops the timer',
  )
})

test('o logout do fim espera a vez da ligação: com uma leitura aberta no token, nada sai; quando ela termina, o logout sai', async () => {
  const events: string[] = []
  const limits = createLimits({ executor: executorOf(events, 61) })
  await limits.token(OPENED, 1000)
  const reading = limits.inTurn(OPENED.id, 1000, async () => {
    await sleep(1800)
    events.push('read done')
  })
  await sleep(1300)
  assert.deepEqual(events, ['login1'], 'the timer fired and the logout did not meet the read')
  await reading
  await sleep(100)
  assert.deepEqual(events, ['login1', 'read done', 'logout t1'])
})

test('o logout do fim com defeito vai ao registro e não derruba o processo', async () => {
  const lines: string[] = []
  const executor: Executor = {
    ...executorOf([], 61),
    async logout() {
      throw new TypeError('a defect in the logout')
    },
  }
  const limits = createLimits({
    executor,
    log: { info: () => undefined, error: (_, message) => lines.push(message) },
  })
  const unhandled: unknown[] = []
  function hear(reason: unknown) {
    unhandled.push(reason)
  }
  process.on('unhandledRejection', hear)
  try {
    await limits.token(OPENED, 1000)
    await sleep(1300)
  } finally {
    process.off('unhandledRejection', hear)
  }
  assert.deepEqual(lines, ['INTERNAL_UNEXPECTED'])
  assert.deepEqual(unhandled, [])
})
