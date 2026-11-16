import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { copy, detailOf, openCopies, VENDAS } from './test-hub.tsx'

// A tabela, aba Amostra: cinco linhas lidas pelo papel, e a frase do Hub fora dele (Dados, partes 1 e 4).
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

test('a amostra mostra o tipo de cada coluna', async () => {
  const columns = [
    { name: 'NUNOTA', type: 'bigint', description: null, inactiveSince: null },
    { name: 'CODPARC', type: 'text', description: null, inactiveSince: null },
  ]
  openCopies(server, { copies: [copy({ shown: { ...copy().shown, columns } })] }, SAMPLE)
  const table = within(await screen.findByRole('table'))
  expect(table.getByRole('img', { name: 'Número' })).toBeTruthy()
  expect(table.getByRole('img', { name: 'Texto' })).toBeTruthy()
})

test('uma coluna fora da definição fica só com o nome', async () => {
  openCopies(server, { copies: [copy()] }, SAMPLE)
  const table = within(await screen.findByRole('table'))
  expect(table.getByText('NUNOTA')).toBeTruthy()
  expect(table.queryByRole('img')).toBeNull()
})

test('o número da linha', async () => {
  openCopies(server, { copies: [copy()] }, SAMPLE)
  const table = within(await screen.findByRole('table'))
  const rows = table.getAllByRole('row').slice(1)
  expect(rows.map((row) => row.querySelector('td')?.textContent)).toEqual(['1', '2', '3', '4', '5'])
  const head = table.getAllByRole('columnheader')[0]
  expect(head?.textContent).toBe('Linha')
  expect(head?.querySelector('span')?.className).toContain('sr-only')
})

test('o desenvolvedor vê a recusa do papel na aba Amostra, sem Tentar de novo e sem grade (critério 81)', async () => {
  openCopies(
    server,
    { copies: [copy()], answers: { sample: () => refusal('COPY_NOT_IN_ROLE') } },
    SAMPLE,
    'developer',
  )
  expect(await screen.findByRole('tab', { name: 'Amostra' })).toBeTruthy()
  const said = await screen.findByText(
    'Seu papel não lê esta tabela. Peça a quem administra a empresa.',
  )
  expect(said.className).toContain('text-text-2')
  expect(said.className).not.toContain('text-danger')
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  expect(screen.queryByRole('table')).toBeNull()
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
