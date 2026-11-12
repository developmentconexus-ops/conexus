import type { MastraMessagePart } from '@mastra/client-js'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { seenBy } from './approval-item.ts'
import type { Message } from './messages.ts'
import { itemsOf } from './rows.ts'
import { OPENED } from './session-state.ts'
import { Sources } from './sources.tsx'
import { recordedPart, SourcePart } from './test-recorded.ts'

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
