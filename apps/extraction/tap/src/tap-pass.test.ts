import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { TableDeclaration } from '@conexus/connectors'
import { discoverTables } from '@conexus/connectors'
import { readTable } from './pass.ts'
import { senderOf, sessionFor } from './source.ts'
import type { Double, TapRun } from './test-tap.ts'
import {
  activated,
  hubspotDouble,
  lastState,
  monthsOf,
  NOW,
  recordsOf,
  SANKHYA,
  sankhyaDouble,
  selected,
  tap,
  WINDOW,
} from './test-tap.ts'

function changedOf(run: TapRun, stream: string): readonly (string | null)[] {
  return recordsOf(run, stream).map((row) => (typeof row.dtalter === 'string' ? row.dtalter : null))
}

const ITENS = [selected('TGFITE', 'itens')]

test('a data inicial: a primeira passada de uma tabela de movimento lê da data, e o item sem DTALTER fica fora', async () => {
  const all = changedOf(await tap(sankhyaDouble(), { streams: ITENS }), 'itens')
  const since = changedOf(
    await tap(sankhyaDouble(), { streams: ITENS, startDate: '2026-10-20' }),
    'itens',
  )
  const later = all.filter((value) => value !== null && value >= '2026-10-20')
  assert.ok(later.length > 0 && later.length < all.length)
  assert.deepEqual([...since].sort(), [...later].sort())
  assert.equal(since.includes(null), false)
})

test('o ponto e a data: do ponto quando é depois da data, da data quando o ponto é antes; o maior dos dois', async () => {
  const first = await tap(sankhyaDouble(), { streams: ITENS })
  const all = changedOf(first, 'itens').filter((value) => value !== null)
  const point = lastState(first).bookmarks.itens?.replication_key_value ?? assert.fail()
  assert.equal(point, [...all].sort().at(-1), 'o ponto é a maior alteração lida')
  function state(value: string) {
    return { bookmarks: { itens: { replication_key_value: value } } }
  }
  const fromPoint = await tap(sankhyaDouble(), {
    streams: ITENS,
    state: state(point),
    startDate: '2026-09-01',
  })
  assert.deepEqual(
    changedOf(fromPoint, 'itens'),
    all.filter((value) => value >= point),
  )
  const fromDate = await tap(sankhyaDouble(), {
    streams: ITENS,
    state: state('2026-09-01T00:00:00'),
    startDate: '2026-10-20',
  })
  assert.deepEqual(
    [...changedOf(fromDate, 'itens')].sort(),
    all.filter((value) => value >= '2026-10-20').sort(),
  )
  const nothing = await tap(sankhyaDouble(), {
    streams: ITENS,
    state: state('2099-01-01T00:00:00'),
  })
  assert.equal(changedOf(nothing, 'itens').length, 0)
  assert.deepEqual(
    lastState(nothing).bookmarks.itens,
    { replication_key_value: '2099-01-01T00:00:00' },
    'a passada vazia guarda o ponto',
  )
})

test('o cadastro inteiro: um cadastro e uma tabela inteira leem tudo, com ou sem data', async () => {
  for (const [source, rows] of [
    ['TGFPAR', 9],
    ['TGFNFE', 3],
  ] as const) {
    for (const startDate of [null, '2026-11-01']) {
      const run = await tap(sankhyaDouble(), { streams: [selected(source, 't')], startDate })
      assert.equal(recordsOf(run, 't').length >= rows, true, `${source} ${startDate}`)
      const plain = await tap(sankhyaDouble(), { streams: [selected(source, 't')] })
      assert.equal(
        recordsOf(run, 't').length,
        recordsOf(plain, 't').length,
        `${source} ${startDate}`,
      )
    }
  }
})

test('a janela por mês: a primeira passada lê os meses da contagem, fora do calendário incluídos; a seguinte, o mês e o anterior', async () => {
  const first = await tap(sankhyaDouble(), { streams: WINDOW })
  assert.deepEqual(monthsOf(first), [
    '0208-12',
    '2026-08',
    '2026-09',
    '2026-10',
    '2026-11',
    '2109-07',
  ])
  const next = await tap(sankhyaDouble(), { streams: WINDOW, state: lastState(first) })
  assert.deepEqual(monthsOf(next), ['2026-10', '2026-11'])
  const whole = await tap(sankhyaDouble(), {
    streams: WINDOW,
    state: lastState(first),
    whole: ['TGFEFDVMRSTDIA'],
  })
  assert.equal(monthsOf(whole).length, 6, 'Ler tudo de novo relê a contagem')
})

test('a janela parada: com o ponto meses atrás, a rodada relê do mês do ponto até hoje, sem pular mês', async () => {
  const run = await tap(sankhyaDouble(), {
    streams: WINDOW,
    state: { bookmarks: { efd: { replication_key_value: '2026-05' } } },
  })
  assert.deepEqual(monthsOf(run), ['2026-08', '2026-09', '2026-10', '2026-11'])
  assert.deepEqual(lastState(run).bookmarks.efd, { replication_key_value: '2026-11' })
})

test('a janela desde a data: só os meses a partir do mês da data, e a releitura nunca antes dele', async () => {
  const first = await tap(sankhyaDouble(), { streams: WINDOW, startDate: '2026-09-15' })
  assert.deepEqual(monthsOf(first), ['2026-09', '2026-10', '2026-11', '2109-07'])
  const next = await tap(sankhyaDouble(), {
    streams: WINDOW,
    state: lastState(first),
    startDate: '2026-11-01',
  })
  assert.deepEqual(monthsOf(next), ['2026-11'])
})

const NFE = [selected('TGFNFE', 'nfe')]
const DEALS = [selected('negocios', 'deals')]

test('a inteira: os negócios leem tudo a cada rodada, com o mesmo estado', async () => {
  const first = await tap(await hubspotDouble(), { streams: DEALS })
  const again = await tap(await hubspotDouble(), { streams: DEALS, state: lastState(first) })
  assert.ok(recordsOf(first, 'deals').length > 0)
  assert.equal(recordsOf(again, 'deals').length, recordsOf(first, 'deals').length)
  assert.deepEqual(lastState(first).bookmarks.deals, {})
})

function nfeTable() {
  return SANKHYA.tables?.declared.find(({ name }) => name === 'notas_nfe') ?? assert.fail()
}

function nfeLag(): number {
  const { mode } = nfeTable()
  return mode.kind === 'CHANGED' && mode.cursor.kind === 'NUMBER' ? mode.cursor.lag : assert.fail()
}

async function issued(double: Double, ...numbers: readonly number[]): Promise<Double> {
  for (const nunota of numbers) {
    const url = new URL(`/__teste/nfe-nova/${nunota}`, double.connector.origin)
    const answer = await double.fake.handle(new Request(url, { method: 'POST' }))
    assert.equal(answer.status, 200)
  }
  return double
}

function numbersOf(run: TapRun): readonly number[] {
  return recordsOf(run, 'nfe').map((row) => Number(row.nunota))
}

function saved(point: string) {
  return { bookmarks: { nfe: { replication_key_value: point } } }
}

test('o ponto de número ordena como número', async () => {
  const double = await issued(sankhyaDouble(), 1_000_000)
  const run = await tap(double, { streams: NFE, state: saved('999999') })
  assert.deepEqual(lastState(run).bookmarks.nfe, { replication_key_value: '1000000' })
})

async function readFrom(
  double: Double,
  table: TableDeclaration,
  point: string,
): Promise<readonly number[]> {
  const { connector } = double
  const credential = { ...double.secret }
  const send = senderOf(connector, {
    credential,
    now: () => NOW,
    timeoutMs: 60_000,
    fetch: async (input, init) => double.fake.handle(new Request(input, init)),
  })
  const reach = {
    connector,
    send,
    session: sessionFor(connector, { credential, send, now: () => NOW }),
    account: { ref: null },
    signal: AbortSignal.timeout(60_000),
  }
  const found = await discoverTables({ ...reach, connector })
  const columns =
    found.find(({ declaration }) => declaration.name === table.name)?.columns ?? assert.fail()
  const numbers: number[] = []
  const failed = await readTable(
    reach,
    { table, columns, stream: 'nfe', whole: false },
    {
      bookmarks: saved(point).bookmarks,
      startDate: null,
      deps: {
        now: () => NOW,
        sleep: async () => undefined,
        random: () => 0.5,
        write: async (line) => {
          const message = JSON.parse(line)
          if (message.type === 'RECORD') numbers.push(Number(message.record.nunota))
        },
        log: () => undefined,
      },
    },
  )
  assert.equal(failed, null)
  return numbers
}

test('o cursor número relê o atraso', async () => {
  const lag = nfeLag()
  const top = 1_000_000
  const double = await issued(sankhyaDouble(), top - lag - 1, top - lag, top - 1, top)
  const next = await tap(double, { streams: NFE, state: saved(String(top)) })
  assert.deepEqual(
    numbersOf(next),
    [top - lag, top - 1, top],
    'do ponto menos o atraso, e nada antes',
  )
  const none = { kind: 'NUMBER', lag: 0 } as const
  const noLag = {
    ...nfeTable(),
    mode: { kind: 'CHANGED', column: 'NUNOTA', cursor: none } as const,
  }
  assert.deepEqual(await readFrom(double, noLag, String(top)), [top], 'sem atraso, do ponto')
})

test('a data não limita o número', async () => {
  const double = await issued(sankhyaDouble(), 1_000_000)
  const first = await tap(double, { streams: NFE, startDate: '2099-01-01' })
  const plain = await tap(double, { streams: NFE })
  assert.deepEqual(numbersOf(first), numbersOf(plain), 'a primeira passada lê tudo')
  const next = await tap(double, {
    streams: NFE,
    state: lastState(first),
    startDate: '2099-01-01',
  })
  assert.deepEqual(numbersOf(next), [1_000_000], 'a seguinte, só pelo ponto')
})

test('de inteira para só as novas', async () => {
  const double = sankhyaDouble()
  const all = numbersOf(await tap(double, { streams: NFE }))
  const first = await tap(double, { streams: NFE, state: { bookmarks: { nfe: {} } } })
  assert.deepEqual(numbersOf(first), all, 'lê a tabela inteira')
  assert.equal(activated(first, 'nfe').length, 1)
  assert.deepEqual(lastState(first).bookmarks.nfe, {
    replication_key_value: String(Math.max(...all)),
  })
  const next = await tap(await issued(double, 1_000_000), { streams: NFE, state: lastState(first) })
  assert.equal(activated(next, 'nfe').length, 0, 'a seguinte lê só pelo ponto')
  assert.ok(numbersOf(next).includes(1_000_000))
})

test('a passada inteira, e só ela, termina com ACTIVATE_VERSION: a primeira, a pedida, a sem ponto e a inteira; a que lê só o que mudou, não', async () => {
  const first = await tap(sankhyaDouble(), { streams: ITENS })
  assert.equal(activated(first, 'itens').length, 1, 'a primeira passada lê tudo')
  const state = lastState(first)
  const changed = await tap(sankhyaDouble(), { streams: ITENS, state })
  assert.equal(activated(changed, 'itens').length, 0, 'do ponto, só o que mudou')
  const asked = await tap(sankhyaDouble(), { streams: ITENS, state, whole: ['TGFITE'] })
  assert.equal(activated(asked, 'itens').length, 1, 'o Hub pediu a tabela inteira')
  const lost = await tap(sankhyaDouble(), {
    streams: ITENS,
    state: { bookmarks: { outra: { replication_key_value: '2026-11-01' } } },
  })
  assert.equal(activated(lost, 'itens').length, 1, 'sem ponto no estado, lê tudo')
  const full = await tap(await hubspotDouble(), { streams: DEALS })
  const again = await tap(await hubspotDouble(), { streams: DEALS, state: lastState(full) })
  assert.equal(activated(again, 'deals').length, 1, 'a tabela inteira lê tudo a cada rodada')
  const months = [selected('TGFCAB', 'notas')]
  const window = await tap(sankhyaDouble(), { streams: months })
  const next = await tap(sankhyaDouble(), { streams: months, state: lastState(window) })
  assert.deepEqual([activated(window, 'notas').length, activated(next, 'notas').length], [1, 0])
})
