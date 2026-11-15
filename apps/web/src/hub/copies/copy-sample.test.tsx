import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { copy, detailOf, openCopies, VENDAS } from './test-hub.tsx'

// A tabela, aba Amostra: cinco linhas para quem lê linhas, e nada para quem não lê (Dados, parte 1, 9.4 a 9.8).
const server = hubServer()
const SAMPLE = `${detailOf(VENDAS)}?tab=sample`

test('a aba Amostra mostra cinco linhas e a marca de que há mais', async () => {
  openCopies(server, { copies: [copy()] }, SAMPLE)
  const table = within(await screen.findByRole('table'))
  expect(table.getByText('NUNOTA')).toBeTruthy()
  expect(table.getAllByRole('row')).toHaveLength(6)
  expect(screen.getByText('Cinco linhas da cópia.')).toBeTruthy()
  expect(screen.getByText('A cópia tem mais linhas que estas cinco.')).toBeTruthy()
})

test('a amostra completa não leva a marca de que há mais', async () => {
  const sample = { columns: ['NUNOTA'], rows: [[1]], complete: true }
  openCopies(server, { copies: [copy()], sample }, SAMPLE)
  await screen.findByRole('table')
  expect(screen.queryByText('A cópia tem mais linhas que estas cinco.')).toBeNull()
})

test('o desenvolvedor não vê a aba Amostra', async () => {
  openCopies(server, { copies: [copy()] }, detailOf(VENDAS), 'developer')
  await screen.findByRole('heading', { name: 'vendas' })
  expect(screen.queryByRole('tab', { name: 'Amostra' })).toBeNull()
})

test('a amostra vazia', async () => {
  const sample = { columns: ['NUNOTA'], rows: [], complete: true }
  openCopies(server, { copies: [copy()], sample }, SAMPLE)
  expect(await screen.findByText('A cópia ainda não tem linhas.')).toBeTruthy()
})

test('a amostra que falha tem Tentar de novo', async () => {
  let fail = true
  openCopies(
    server,
    {
      copies: [copy()],
      answers: { sample: () => (fail ? refusal('COPY_DATABASE_UNAVAILABLE') : undefined) },
    },
    SAMPLE,
  )
  const retry = await screen.findByRole('button', { name: 'Tentar de novo' })
  fail = false
  fireEvent.click(retry)
  expect(await screen.findByText('Cinco linhas da cópia.')).toBeTruthy()
})
