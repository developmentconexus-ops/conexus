import { DATA_TOOL, DataResult } from '@conexus/hub-api'
import type { MastraMessagePart } from '@mastra/client-js'
import { render, screen, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { z } from 'zod'
import { seenBy } from './approval-item.ts'
import { wordsOf } from './connector-words.ts'
import type { Message } from './messages.ts'
import { agentRoom, RoomContext } from './room.ts'
import { itemsOf } from './rows.ts'
import { OPENED } from './session-state.ts'
import { Sources } from './sources.tsx'
import { DataPart, recordedPart, SourcePart } from './test-recorded.ts'

const RECEITERIA = 'www.receiteria.com.br'
const TELECULINARIA = 'teleculinaria.pt'
const view = { suspended: {}, approval: seenBy(OPENED), running: {}, heard: {}, live: false }

/** The page a recorded Mastra run cited (`cited`), by its host: the part as the library stored it. */
function cited(host: string) {
  return recordedPart('cited', SourcePart, (part) => new URL(part.source.url).host === host)
}

/** A cited page with only what the test is about changed: its address, or no title. */
function source(host: string, change: { url?: string; title?: string | null } = {}) {
  const part = cited(host)
  const { source: page } = part
  const { title: _title, ...rest } = page
  const title = change.title === undefined ? page.title : (change.title ?? undefined)
  return {
    ...part,
    source: { ...rest, ...(change.url === undefined ? {} : { url: change.url }), title },
  }
}

afterEach(() => vi.useRealTimers())

const LOGO = '<svg xmlns="http://www.w3.org/2000/svg"/>'
const SANKHYA = { id: 'sankhya', name: 'Sankhya', auth: 'client_credentials', logo: LOGO } as const
const WORDS = wordsOf([SANKHYA])
const MATRIZ = { kind: 'NAMED', name: 'Matriz', state: 'ACTIVE' } as const

/** The recorded copy ran at 08:45 of 14/11/2026 (America/Sao_Paulo); the clock reads this day. */
function clockAt(instant: string) {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(instant) })
}
const COPY_DAY = '2026-11-14T15:00:00.000Z'

/** The recorded `data_query` with only its origin changed: how the last run went and when it ended. */
function queried(change: {
  lastRun?: string
  lastRunEndedAt?: string | null
  table?: string
  systems?: readonly unknown[]
}) {
  const part = recordedPart(
    'data-query',
    DataPart,
    (found) =>
      found.toolInvocation.toolName === DATA_TOOL.query &&
      DataResult.safeParse(found.toolInvocation.result).data?.kind === 'ROWS',
  )
  const result = DataResult.parse(part.toolInvocation.result)
  if (result.kind !== 'ROWS') throw new Error('the recorded query holds no rows')
  const origin = result.origin.map((each) => ({ ...each, ...change }))
  part.toolInvocation.result = { ...result, origin }
  return part
}

/** The recorded `data_describe` of one table, as stored. */
function described() {
  return recordedPart(
    'data-query',
    DataPart,
    (found) =>
      found.toolInvocation.toolName === DATA_TOOL.describe &&
      DataResult.safeParse(found.toolInvocation.result).data?.kind === 'TABLE',
  )
}

const AS_THE_SERVER_SENDS = '2026-11-15T22:46:12.345-03:00'

const ReadPart = z.looseObject({
  type: z.literal('tool-invocation'),
  toolInvocation: z.looseObject({
    state: z.literal('result'),
    toolCallId: z.string(),
    toolName: z.string(),
    args: z.looseObject({ connection: z.string(), operation: z.string() }),
    result: z.looseObject({ kind: z.literal('OK'), at: z.string().optional() }),
  }),
})

/** The recorded live read, its `at` as the server sends it (the reader's zone, with an offset), or changed. */
function read(
  change: Partial<Record<'at' | 'toolName' | 'connection' | 'operation', string>> = {},
) {
  const part = recordedPart('reads', ReadPart)
  part.toolInvocation.result.at = change.at ?? AS_THE_SERVER_SENDS
  if (change.toolName !== undefined) part.toolInvocation.toolName = change.toolName
  if (change.operation !== undefined) part.toolInvocation.args.operation = change.operation
  if (change.connection !== undefined) part.toolInvocation.args.connection = change.connection
  return part
}

/** The colour of a stamp's words and of its dot: the dot takes the words' colour unless a class gives it its own. */
function toneOf(classes: string) {
  const words = classes.match(/(?:^| )text-(success|warning|danger|text-2)(?: |$)/)?.[1]
  const dot = classes.match(/before:bg-(success|line-strong)/)?.[1]
  return { words, dot: dot ?? words }
}

/** What each line of the data sources shows: its logo, its words and the tone of its stamp. */
function linesOf(parts: MastraMessagePart[], words = WORDS) {
  const [item] = sourcesIn(parts)
  render(
    <RoomContext.Provider value={agentRoom('Assistente', words)}>
      <Sources sources={item?.sources ?? []} />
    </RoomContext.Provider>,
  )
  return screen.queryAllByRole('listitem').map((line) => {
    const spans = Array.from(line.querySelectorAll(':scope > span'))
    const texts = spans.map((one) => one.textContent ?? '').filter((one) => one !== '')
    const stamp = texts.at(-1) ?? ''
    return {
      logo: line.querySelector('img') !== null,
      name: texts[0],
      badges: texts.slice(1, -2),
      table: texts.at(-2),
      stamp,
      ...toneOf(within(line).getByText(stamp).className),
    }
  })
}

function sourcesIn(parts: MastraMessagePart[]) {
  const message: Message = {
    id: 'm1',
    role: 'builder',
    model: null,
    origin: null,
    createdAt: '2026-11-11T12:00:00.000Z',
    parts: [{ type: 'text', text: 'A alíquota é 18%.' }, ...parts],
  }
  return itemsOf([message], view).flatMap((item) => (item.kind === 'sources' ? [item] : []))
}

test('as fontes: cada página com o título e o domínio, sem repetir a mesma URL', () => {
  const [item] = sourcesIn([
    cited(RECEITERIA),
    cited(RECEITERIA),
    source(TELECULINARIA, { title: null }),
  ])
  expect(item?.sources).toHaveLength(2)
  render(<Sources sources={item?.sources ?? []} />)
  const link = screen.getByRole('link', { name: 'Pão de queijo fácil - Receiteria' })
  expect(link.getAttribute('href')).toBe('https://www.receiteria.com.br/receita/pao-de-queijo/')
  expect(link.getAttribute('target')).toBe('_blank')
  expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  expect(screen.getByText('www.receiteria.com.br')).toBeTruthy()
  expect(
    screen.getByRole('link', { name: 'https://teleculinaria.pt/tags/pao-de-queijo-receita' }),
  ).toBeTruthy()
})

test('as fontes: um source que não é http(s) mostra o título como texto, sem link', () => {
  const [item] = sourcesIn([
    source(RECEITERIA, { url: 'javascript:alert(1)', title: 'Página perigosa' }),
  ])
  render(<Sources sources={item?.sources ?? []} />)
  expect(screen.getByText('Página perigosa')).toBeTruthy()
  expect(screen.queryByRole('link')).toBeNull()
})

test('as fontes: sem source, nenhuma linha', () => {
  expect(sourcesIn([])).toEqual([])
})

const COPIED = 'copiado hoje às 08:45'

test('a fonte do dado: a logo, Sankhya · Matriz, a tabela e copiado hoje às 08:45', () => {
  clockAt(COPY_DAY)
  const line = { logo: true, name: 'Sankhya · Matriz', badges: [], table: 'sankhya_vendas' }
  expect(linesOf([queried({ systems: [MATRIZ] })])).toMatchObject([{ ...line, stamp: COPIED }])
})

test('a conexão com o nome do sistema não se repete na fonte de cópia', () => {
  clockAt(COPY_DAY)
  expect(linesOf([queried({ systems: [{ ...MATRIZ, name: 'Sankhya' }] })])[0]?.name).toBe('Sankhya')
})

test('a fonte vem também do data_describe de uma tabela', () => {
  clockAt(COPY_DAY)
  expect(linesOf([described()])[0]).toMatchObject({ table: 'sankhya_vendas', stamp: COPIED })
})

function seen(change: { lastRun?: string; lastRunEndedAt?: string | null }) {
  const [line] = linesOf([queried({ systems: [MATRIZ], ...change })])
  document.body.innerHTML = ''
  return line
}

test('a cópia em dia: as palavras em text-2 e o ponto em success', () => {
  clockAt(COPY_DAY)
  expect(seen({ lastRun: 'COMPLETE' })).toMatchObject({
    stamp: COPIED,
    words: 'text-2',
    dot: 'success',
  })
})

test('a rodada parcial diz rodada parcial, em warning', () => {
  clockAt(COPY_DAY)
  expect(seen({ lastRun: 'PARTIAL' })).toMatchObject({
    stamp: 'rodada parcial, copiado hoje às 08:45',
    words: 'warning',
    dot: 'warning',
  })
})

test('a rodada com erro ou interrompida diz parada, em danger, e nunca copiado', () => {
  clockAt(COPY_DAY)
  for (const lastRun of ['ERROR', 'INTERRUPTED']) {
    const line = seen({ lastRun })
    expect(line).toMatchObject({ stamp: 'parada hoje às 08:45', words: 'danger', dot: 'danger' })
    expect(line?.stamp).not.toContain('copiado')
  }
})

test('sem rodada diz ainda sem cópia, com o ponto neutro', () => {
  clockAt(COPY_DAY)
  expect(seen({ lastRun: 'NONE', lastRunEndedAt: null })).toMatchObject({
    stamp: 'ainda sem cópia',
    words: 'text-2',
    dot: 'line-strong',
  })
})

test('outro dia diz ontem ou a data', () => {
  clockAt('2026-11-15T15:00:00.000Z')
  expect(
    linesOf([queried({}), queried({ lastRun: 'ERROR', table: 'sankhya_notas' })]).map(
      (line) => line.stamp,
    ),
  ).toEqual(['copiado ontem às 08:45', 'parada ontem às 08:45'])
  document.body.innerHTML = ''
  clockAt('2026-12-20T15:00:00.000Z')
  expect(linesOf([queried({})]).map((line) => line.stamp)).toEqual([
    'copiado em 14/11/2026 às 08:45',
  ])
})

const REFUSED = { ...MATRIZ, state: 'NEEDS_REAUTH' }

test('a conexão à espera de nova autorização mostra o selo de Integrações', () => {
  clockAt(COPY_DAY)
  expect(linesOf([queried({ systems: [REFUSED] })])[0]?.badges).toEqual(['Chaves recusadas'])
  document.body.innerHTML = ''
  const oauth = wordsOf([{ ...SANKHYA, auth: 'oauth2_code' }])
  expect(linesOf([queried({ systems: [REFUSED] })], oauth)[0]?.badges).toEqual([
    'Pede para conectar de novo',
  ])
})

test('a conexão ativa não mostra selo', () => {
  clockAt(COPY_DAY)
  expect(linesOf([queried({ systems: [MATRIZ] })])[0]?.badges).toEqual([])
  expect(screen.queryByText('Funcionando')).toBeNull()
})

test('a fonte não dada ao Projeto mostra só o sistema e a logo', () => {
  clockAt(COPY_DAY)
  expect(linesOf([queried({ systems: [{ kind: 'NOT_GIVEN' }] })])).toMatchObject([
    { logo: true, name: 'Sankhya', badges: [], table: 'sankhya_vendas', stamp: COPIED },
  ])
})

test('uma cópia de duas conexões com uma não dada nomeia só a dada', () => {
  clockAt(COPY_DAY)
  const lines = linesOf([queried({ systems: [MATRIZ, { kind: 'NOT_GIVEN' }] })])
  expect(lines[0]?.name).toBe('Sankhya · Matriz')
})

test('duas fontes são duas linhas, cada uma com a sua logo', () => {
  clockAt(COPY_DAY)
  const lines = linesOf([queried({}), queried({ table: 'sankhya_notas' })])
  expect(lines.map((line) => [line.logo, line.table])).toEqual([
    [true, 'sankhya_vendas'],
    [true, 'sankhya_notas'],
  ])
})

test('a mesma tabela lida duas vezes aparece uma vez', () => {
  clockAt(COPY_DAY)
  expect(linesOf([queried({}), queried({}), described()])).toHaveLength(1)
})

test('um resultado fora do esquema não vira fonte', () => {
  const broken = queried({})
  broken.toolInvocation.result = { kind: 'ROWS', columns: ['total'], rows: [[1]], complete: true }
  const refused = queried({})
  refused.toolInvocation.result = { kind: 'REFUSED', code: 'TABLE_UNAVAILABLE' }
  expect(sourcesIn([broken, refused])).toEqual([])
})

test('a leitura ao vivo de uma conexão com o nome do sistema não o repete', () => {
  clockAt('2026-11-16T02:00:00.000Z')
  expect(linesOf([read({ connection: 'Sankhya' })])[0]?.name).toBe('Sankhya')
})

test('duas leituras ao vivo de operações diferentes da mesma conexão são duas fontes', () => {
  const tables = sourcesIn([
    read({ operation: 'sankhya.consultar' }),
    read({ operation: 'sankhya.estoque' }),
  ]).flatMap((item) => item.sources.map((one) => (one.kind === 'data' ? one.table : '')))
  expect(tables).toEqual(['consultar', 'estoque'])
})

test('a leitura ao vivo vista noutro dia diz o dia', () => {
  clockAt('2026-11-16T15:00:00.000Z')
  expect(linesOf([read()])[0]?.stamp).toBe('ao vivo · lido ontem às 22:46')
  document.body.innerHTML = ''
  clockAt('2026-12-20T15:00:00.000Z')
  expect(linesOf([read()])[0]?.stamp).toBe('ao vivo · lido em 15/11/2026 às 22:46')
})

test('a leitura tipada <conector>_<operação> também vira fonte', () => {
  clockAt('2026-11-16T02:00:00.000Z')
  expect(linesOf([read({ toolName: 'sankhya_consultar' })])[0]).toMatchObject({
    name: 'Sankhya · Matriz',
    table: 'consultar',
  })
})

test.each([
  ['-03:00', '2026-11-16T03:39:48.476-03:00'],
  ['Z', '2026-11-16T06:39:48.476Z'],
  ['+01:00', '2026-11-16T07:39:48.476+01:00'],
])('a fonte ao vivo com a hora em %s diz ao vivo · lido agora, às 03:39', (_offset, at) => {
  clockAt('2026-11-16T07:00:00.000Z')
  const stamp = 'ao vivo · lido agora, às 03:39'
  expect(linesOf([read({ at })])).toMatchObject([
    { logo: true, stamp, words: 'text-2', dot: 'success' },
  ])
})

test('a leitura ao vivo sem at não vira fonte', () => {
  const part = read()
  delete part.toolInvocation.result.at
  expect(sourcesIn([part])).toEqual([])
})
