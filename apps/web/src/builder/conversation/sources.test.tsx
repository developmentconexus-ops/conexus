import { DATA_TOOL, DataResult } from '@conexus/hub-api'
import type { MastraMessagePart } from '@mastra/client-js'
import { render, screen } from '@testing-library/react'
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

const WORDS = wordsOf([
  {
    id: 'sankhya',
    name: 'Sankhya',
    auth: 'oauth2_code',
    logo: 'data:image/svg+xml;base64,PHN2Zy8+',
  },
])

/** The recorded copy ran at 08:45 of 14/11/2026 (America/Sao_Paulo); the clock reads this day. */
function clockAt(instant: string) {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(instant) })
}
const COPY_DAY = '2026-11-14T15:00:00.000Z'

/** The recorded `data_query` with only its origin changed: how the last run went and when it ended. */
function queried(change: { lastRun?: string; lastRunEndedAt?: string | null; table?: string }) {
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

/** The recorded live read, with its `at` taken away or under a typed read's tool name. */
function read(
  change: { noAt?: true; toolName?: string; connection?: string; operation?: string } = {},
) {
  const part = recordedPart('reads', ReadPart)
  if (change.noAt) delete part.toolInvocation.result.at
  if (change.toolName !== undefined) part.toolInvocation.toolName = change.toolName
  if (change.operation !== undefined) part.toolInvocation.args.operation = change.operation
  if (change.connection !== undefined) part.toolInvocation.args.connection = change.connection
  return part
}

function textsOf(parts: MastraMessagePart[]) {
  const [item] = sourcesIn(parts)
  render(
    <RoomContext.Provider value={agentRoom('Assistente', WORDS)}>
      <Sources sources={item?.sources ?? []} />
    </RoomContext.Provider>,
  )
  return screen.queryAllByRole('listitem').map((each) => each.textContent)
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

test('a fonte do dado: Sankhya · sankhya_vendas · copiado hoje às 08:45', () => {
  clockAt(COPY_DAY)
  expect(textsOf([queried({})])).toEqual(['Sankhya · sankhya_vendas · copiado hoje às 08:45'])
})

test('a fonte do dado vem também do data_describe de uma tabela', () => {
  clockAt(COPY_DAY)
  expect(textsOf([described()])).toEqual(['Sankhya · sankhya_vendas · copiado hoje às 08:45'])
})

test('a rodada parcial diz rodada parcial', () => {
  clockAt(COPY_DAY)
  expect(textsOf([queried({ lastRun: 'PARTIAL' })])).toEqual([
    'Sankhya · sankhya_vendas · rodada parcial, copiado hoje às 08:45',
  ])
})

test('a rodada com erro ou interrompida diz parada e nunca copiado', () => {
  clockAt(COPY_DAY)
  for (const lastRun of ['ERROR', 'INTERRUPTED']) {
    const [text] = textsOf([queried({ lastRun })])
    expect(text).toBe('Sankhya · sankhya_vendas · parada hoje às 08:45')
    expect(text).not.toContain('copiado')
    document.body.innerHTML = ''
  }
})

test('sem rodada diz ainda sem cópia', () => {
  clockAt(COPY_DAY)
  expect(textsOf([queried({ lastRun: 'NONE', lastRunEndedAt: null })])).toEqual([
    'Sankhya · sankhya_vendas · ainda sem cópia',
  ])
})

test('outro dia diz ontem ou a data', () => {
  clockAt('2026-11-15T15:00:00.000Z')
  expect(textsOf([queried({}), queried({ lastRun: 'ERROR', table: 'sankhya_notas' })])).toEqual([
    'Sankhya · sankhya_vendas · copiado ontem às 08:45',
    'Sankhya · sankhya_notas · parada ontem às 08:45',
  ])
  document.body.innerHTML = ''
  clockAt('2026-12-20T15:00:00.000Z')
  expect(textsOf([queried({})])).toEqual([
    'Sankhya · sankhya_vendas · copiado em 14/11/2026 às 08:45',
  ])
})

test('a mesma tabela lida duas vezes aparece uma vez', () => {
  clockAt(COPY_DAY)
  expect(textsOf([queried({}), queried({}), described()])).toHaveLength(1)
})

test('um resultado fora do esquema não vira fonte', () => {
  const broken = queried({})
  broken.toolInvocation.result = { kind: 'ROWS', columns: ['total'], rows: [[1]], complete: true }
  const refused = queried({})
  refused.toolInvocation.result = { kind: 'REFUSED', code: 'TABLE_UNAVAILABLE' }
  expect(sourcesIn([broken, refused])).toEqual([])
})

test('a fonte da leitura ao vivo diz lido agora, às', () => {
  clockAt('2026-11-16T02:00:00.000Z')
  expect(textsOf([read()])).toEqual(['Sankhya · Matriz · lido agora, às 22:46'])
})

test('a leitura ao vivo de uma conexão com o nome do sistema não o repete', () => {
  clockAt('2026-11-16T02:00:00.000Z')
  expect(textsOf([read({ connection: 'Sankhya' })])).toEqual(['Sankhya · lido agora, às 22:46'])
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
  expect(textsOf([read()])).toEqual(['Sankhya · Matriz · lido ontem às 22:46'])
  document.body.innerHTML = ''
  clockAt('2026-12-20T15:00:00.000Z')
  expect(textsOf([read()])).toEqual(['Sankhya · Matriz · lido em 15/11/2026 às 22:46'])
})

test('a leitura tipada <conector>_<operação> também vira fonte', () => {
  clockAt('2026-11-16T02:00:00.000Z')
  expect(textsOf([read({ toolName: 'sankhya_consultar' })])).toEqual([
    'Sankhya · Matriz · lido agora, às 22:46',
  ])
})

test('a leitura ao vivo sem at não vira fonte', () => {
  expect(sourcesIn([read({ noAt: true })])).toEqual([])
})
