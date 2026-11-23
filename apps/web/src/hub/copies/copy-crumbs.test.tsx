import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { copy, detailOf, openCopies, VENDAS } from './test-hub.tsx'

const server = hubServer()
const DETAIL = detailOf(VENDAS)

test('o caminho leva a Dados', async () => {
  openCopies(server, { copies: [copy()], runs: [] }, DETAIL)
  const path = within(await screen.findByRole('navigation', { name: 'Caminho' }))
  expect(path.getByRole('link', { name: 'Dados' })).toBeTruthy()
  expect(path.getByRole('link', { name: 'Sankhya' })).toBeTruthy()
  expect(path.getByText('vendas')).toBeTruthy()
  expect(screen.queryByRole('link', { name: /← Dados/ })).toBeNull()
  expect(screen.queryByText(/a cada 30 min/)).toBeNull()
})

test('o caminho', async () => {
  openCopies(server, { copies: [copy()], runs: [] }, DETAIL)
  const path = within(await screen.findByRole('navigation', { name: 'Caminho' }))
  expect(path.getAllByRole('link')).toHaveLength(2)
  for (const link of path.getAllByRole('link')) expect(link.getAttribute('aria-current')).toBeNull()
  fireEvent.click(path.getByRole('link', { name: 'Sankhya' }))
  expect(await screen.findByRole('heading', { name: 'Dados' })).toBeTruthy()
})

test('o caminho leva a busca', async () => {
  openCopies(server, { copies: [copy()], runs: [] }, `${DETAIL}?q=NUNOTA`)
  const path = within(await screen.findByRole('navigation', { name: 'Caminho' }))
  for (const link of path.getAllByRole('link')) {
    const href = link.getAttribute('href') ?? ''
    expect(href).toContain('q=NUNOTA')
    expect(href).not.toContain('layer')
  }
})
