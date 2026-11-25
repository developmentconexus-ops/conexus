import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Double, TapRun } from './test-tap.ts'
import { recordsOf, sankhyaDouble, selected, tap } from './test-tap.ts'

const SECRET = 'CORPO-DO-ERRO-QUE-NAO-SAI'
const FIRST_WAIT = 2500

type Gateway = Readonly<{
  fetch: (request: Request) => Promise<Response>
  asked: readonly number[]
}>

/** The double behind a gateway that turns a page down: `refuse` sees the rows asked and the bytes of the answer the double would give. */
function gateway(
  double: Double,
  refuse: (a: Readonly<{ rows: number; bytes: number; page: number }>) => Response | null,
): Gateway {
  const asked: number[] = []
  return {
    asked,
    fetch: async (request) => {
      const sql = await request.clone().text()
      const rows = Number(/FETCH NEXT (\d+) ROWS ONLY/.exec(sql)?.[1])
      const answer = await double.fake.handle(request)
      if (Number.isNaN(rows)) return answer
      asked.push(rows)
      const text = await answer.text()
      const turned = refuse({ rows, bytes: text.length, page: asked.length })
      return turned ?? new Response(text, { status: answer.status, headers: answer.headers })
    },
  }
}

function internalError(): Response {
  return new Response(JSON.stringify({ message: 'Internal Server Error', detail: SECRET }), {
    status: 500,
    headers: { 'content-type': 'application/json' },
  })
}

function allLogs(run: TapRun): string {
  return JSON.stringify(run.logs)
}

test('um 5xx com poucas linhas: a página pede metade no mesmo ponto, o corte vale até o fim da tabela, e a cópia termina sem pular linha', async () => {
  const double = sankhyaDouble()
  const through = gateway(double, ({ rows }) => (rows > 3 ? internalError() : null))
  const run = await tap(double, {
    streams: [selected('TGFCAB', 'notas')],
    fetch: through.fetch,
  })
  assert.equal(run.code, 0)
  assert.deepEqual(through.asked.slice(0, 4), [10, 5, 2, 2], 'dez, depois cinco, depois duas')
  assert.ok(
    through.asked.slice(2).every((rows) => rows === 2),
    'o corte não volta',
  )
  const nunotas = recordsOf(run, 'notas').map((row) => row.nunota)
  assert.equal(nunotas.length, 184)
  assert.equal(new Set(nunotas).size, 184, 'cada linha uma vez')
  assert.deepEqual(run.waits, [FIRST_WAIT, FIRST_WAIT], 'cada redução espera a primeira espera')
  assert.deepEqual(
    run.logs.map(({ event, rows, nextRows, attempt, waitMs, status }) => ({
      event,
      rows,
      nextRows,
      attempt,
      waitMs,
      status,
    })),
    [
      { event: 'PAGE_REDUCED', rows: 10, nextRows: 5, attempt: 1, waitMs: FIRST_WAIT, status: 500 },
      { event: 'PAGE_REDUCED', rows: 5, nextRows: 2, attempt: 1, waitMs: FIRST_WAIT, status: 500 },
    ],
  )
  const states = run.messages.filter(({ type }) => type === 'STATE')
  assert.ok(
    states.some((state) => JSON.stringify(state).includes('"ceiling":2')),
    'o STATE leva o corte, e uma retomada o mantém',
  )
})

test('a linha só falha com o corte: o XML grande chega inteiro, sem cortar, na página menor', async () => {
  const double = sankhyaDouble()
  const through = gateway(double, ({ rows }) => (rows > 2 ? internalError() : null))
  const run = await tap(double, { streams: [selected('TGFNFE', 'nfe')], fetch: through.fetch })
  assert.equal(run.code, 0)
  const sizes = recordsOf(run, 'nfe').map((row) => String(row.xml).length)
  assert.equal(sizes.length, 3)
  assert.ok(Math.max(...sizes) >= 1_048_576, 'o XML de mais de 1 MiB, inteiro')
})

test('a tabela que nem uma linha passa falha como hoje: as tentativas com a espera de hoje, e o código do kit', async () => {
  const double = sankhyaDouble()
  const through = gateway(double, ({ bytes }) => (bytes > 262_144 ? internalError() : null))
  const run = await tap(double, { streams: [selected('TGFNFE', 'nfe')], fetch: through.fetch })
  assert.equal(run.code, 1)
  assert.partialDeepStrictEqual(run.result, {
    code: 'COPY_SOURCE_UNREACHABLE',
    system: { status: 500 },
    table: 'nfe',
  })
  assert.equal(recordsOf(run, 'nfe').length, 1, 'a linha estreita que passou fica lida')
  assert.deepEqual(through.asked.slice(0, 6), [10, 5, 2, 1, 1, 1])
  assert.deepEqual(
    run.waits,
    [FIRST_WAIT, FIRST_WAIT, FIRST_WAIT, 2500, 4500, 8500, 16500],
    'três reduções, e no piso as esperas de hoje',
  )
  const last = run.logs.at(-1)
  assert.partialDeepStrictEqual(last, {
    event: 'PAGE_FAILED',
    table: 'nfe',
    rows: 1,
    nextRows: null,
    attempt: 5,
    waitMs: null,
    status: 500,
  })
})

test('o 429 espera o que o provedor pediu e repete a mesma página: nunca reduz', async () => {
  const double = sankhyaDouble()
  const through = gateway(double, ({ page }) =>
    page <= 2 ? new Response('{}', { status: 429, headers: { 'retry-after-ms': '1500' } }) : null,
  )
  const run = await tap(double, { streams: [selected('TGFNFE', 'nfe')], fetch: through.fetch })
  assert.equal(run.code, 0)
  assert.deepEqual(through.asked.slice(0, 3), [10, 10, 10], 'a mesma página')
  assert.deepEqual(run.waits, [1500, 1500])
  assert.deepEqual(
    run.logs.map(({ event }) => event),
    ['PAGE_RETRIED', 'PAGE_RETRIED'],
  )
})

test('o prazo estourado reduz como o 5xx: o pedido que não responde é cortado e a página menor passa', async () => {
  const double = sankhyaDouble()
  const asked: number[] = []
  let hung = false
  const run = await tap(double, {
    streams: [selected('TGFNFE', 'nfe')],
    timeoutMs: 100,
    fetch: async (request) => {
      const sql = await request.clone().text()
      const rows = Number(/FETCH NEXT (\d+) ROWS ONLY/.exec(sql)?.[1])
      if (!Number.isNaN(rows)) asked.push(rows)
      if (!Number.isNaN(rows) && !hung) {
        hung = true
        return new Promise<Response>((_, reject) => {
          request.signal.addEventListener('abort', () => reject(request.signal.reason))
        })
      }
      return double.fake.handle(request)
    },
  })
  assert.equal(run.code, 0)
  assert.deepEqual(asked.slice(0, 2), [10, 5])
  assert.equal(recordsOf(run, 'nfe').length, 3)
  assert.partialDeepStrictEqual(run.logs[0], {
    event: 'PAGE_REDUCED',
    rows: 10,
    nextRows: 5,
    status: null,
    code: 'COPY_SOURCE_UNREACHABLE',
  })
})

test('o log da tentativa só leva escalares: nem o corpo do erro nem texto do provedor', async () => {
  const double = sankhyaDouble()
  const through = gateway(double, ({ rows }) => (rows > 3 ? internalError() : null))
  const run = await tap(double, { streams: [selected('TGFCAB', 'notas')], fetch: through.fetch })
  assert.ok(run.logs.length > 0)
  assert.equal(allLogs(run).includes(SECRET), false, 'o corpo fica fora')
  assert.equal(allLogs(run).includes('Internal Server Error'), false, 'e a mensagem dele também')
  for (const line of run.logs)
    for (const value of Object.values(line))
      assert.ok(value === null || ['string', 'number'].includes(typeof value), 'só escalares')
  assert.ok(
    run.logs.every(({ bodyBytes }) => typeof bodyBytes === 'number' && bodyBytes > 0),
    'o tamanho do corpo vai; o corpo não',
  )
})
