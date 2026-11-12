import type { MastraMessagePart } from '@mastra/client-js'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { seenBy } from './approval-item.ts'
import type { Message } from './messages.ts'
import { itemsOf } from './rows.ts'
import { OPENED } from './session-state.ts'
import { Sources } from './sources.tsx'

const view = { suspended: {}, approval: seenBy(OPENED), running: {}, heard: {}, live: false }

function source(url: string, title?: string): MastraMessagePart {
  return { type: 'source', source: { sourceType: 'url', id: url, url, title } }
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
    source('https://www.sefaz.sp.gov.br/icms', 'ICMS: alíquotas'),
    source('https://www.sefaz.sp.gov.br/icms', 'ICMS: alíquotas'),
    source('https://al.sp.gov.br/lei-6374'),
  ])
  expect(item?.sources).toHaveLength(2)
  render(<Sources sources={item?.sources ?? []} />)
  const link = screen.getByRole('link', { name: 'ICMS: alíquotas' })
  expect(link.getAttribute('href')).toBe('https://www.sefaz.sp.gov.br/icms')
  expect(link.getAttribute('target')).toBe('_blank')
  expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  expect(screen.getByText('www.sefaz.sp.gov.br')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'https://al.sp.gov.br/lei-6374' })).toBeTruthy()
})

test('as fontes: um source que não é http(s) mostra o título como texto, sem link', () => {
  const [item] = sourcesIn([source('javascript:alert(1)', 'Página perigosa')])
  render(<Sources sources={item?.sources ?? []} />)
  expect(screen.getByText('Página perigosa')).toBeTruthy()
  expect(screen.queryByRole('link')).toBeNull()
})

test('as fontes: sem source, nenhuma linha', () => {
  expect(sourcesIn([])).toEqual([])
})
