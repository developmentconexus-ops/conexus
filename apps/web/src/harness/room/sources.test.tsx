import { DATA_TOOL } from '@conexus/hub-api'
import type { MastraMessagePart } from '@mastra/client-js'
import { screen, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { z } from 'zod'
import { seenBy } from './approval-item.ts'
import { wordsOf } from './connector-words.ts'
import type { Message } from './messages.ts'
import { RoomContext } from './room.ts'
import { itemsOf } from './rows.ts'
import { OPENED } from './session-state.ts'
import { Sources } from './sources.tsx'
import { DataPart, recordedPart, SourcePart } from './test-recorded.ts'
import { render } from './test-render.tsx'
import { agentRoom } from './test-rooms.ts'

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

function clockAt(instant: string) {
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(instant) })
}

/** A recorded call of a data tool, as a conversation from before U14 stored it, with the copy it read. */
function copied(toolName: string) {
  return recordedPart('data-query', DataPart, (found) => found.toolInvocation.toolName === toolName)
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
    <RoomContext.Provider value={agentRoom(words)}>
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

test('um data_query ou data_describe de uma conversa antiga, que leu uma cópia, não vira fonte', () => {
  expect(sourcesIn([copied(DATA_TOOL.query), copied(DATA_TOOL.describe)])).toEqual([])
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
  const [stamp, name] = ['ao vivo · lido agora, às 03:39', 'Sankhya · Matriz']
  expect(linesOf([read({ at })])).toMatchObject([
    { logo: true, name, table: 'consultar', stamp, words: 'text-2', dot: 'success' },
  ])
})

test('a leitura ao vivo sem at não vira fonte', () => {
  const part = read()
  delete part.toolInvocation.result.at
  expect(sourcesIn([part])).toEqual([])
})
