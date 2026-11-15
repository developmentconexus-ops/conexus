import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import { copy, copyRun, detailOf, openCopies, VENDAS } from './test-hub.tsx'

// Uma cópia: o que é copiado e as rodadas (Capacidade 2, criterion 34).
const server = hubServer()
const DETAIL = detailOf(VENDAS)
const RUNS = `${DETAIL}?tab=runs`
const OTHER = '99999999-9999-4999-8999-999999999999'

test('as rodadas: cada uma em palavras, na aba Rodadas', async () => {
  openCopies(
    server,
    {
      copies: [copy()],
      runs: [
        copyRun({ outcome: { kind: 'RUNNING' }, endedAt: null, read: 500, written: 500 }),
        copyRun({
          outcome: { kind: 'ERROR', code: 'COPY_SOURCE_UNREACHABLE' },
          read: 500,
          written: 500,
        }),
        copyRun({ outcome: { kind: 'PARTIAL', reason: 'CAP' } }),
        copyRun({ outcome: { kind: 'INTERRUPTED' } }),
        copyRun(),
      ],
    },
    RUNS,
  )
  expect(await screen.findByRole('heading', { name: 'vendas' })).toBeTruthy()
  expect(screen.getByText('Em dia')).toBeTruthy()
  expect(screen.getByText(/Sankhya · a cada 30 min/)).toBeTruthy()
  const table = within(screen.getByRole('table'))
  expect(table.getByText('Completa')).toBeTruthy()
  expect(table.getByText('O sistema não respondeu.')).toBeTruthy()
  expect(table.getByText('Parcial; a próxima continua')).toBeTruthy()
  expect(
    table.getByText('O Conexus reiniciou no meio; a próxima continua de onde parou'),
  ).toBeTruthy()
  expect(table.getAllByText('1.204')).toHaveLength(6)
})

test('a cópia e as rodadas: sem rodada, a frase de primeira vez; Rodar agora e Voltar a Dados estão à mão', async () => {
  openCopies(server, { copies: [copy({ run: null })], runs: [] }, RUNS)
  expect(await screen.findByText('A primeira rodada ainda não terminou.')).toBeTruthy()
  expect(within(screen.getByRole('main')).getByRole('link', { name: 'Dados' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Ações: Vendas' })).toBeTruthy()
})

test('a cópia e as rodadas: uma cópia que não existe mostra não encontrado', async () => {
  openCopies(server, { copies: [copy()] }, detailOf(OTHER))
  expect(await screen.findByText('Não encontramos o que você procurou.')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Voltar ao início' })).toBeTruthy()
})

test('a cópia e as rodadas: um id que o contrato nunca daria é não encontrado', async () => {
  openCopies(server, { copies: [copy()] }, detailOf('nao-e-um-id'))
  expect(await screen.findByText('Não encontramos o que você procurou.')).toBeTruthy()
})

const INACTIVE_SHOWN = {
  ...copy().shown,
  description: 'As notas de venda',
  columns: [
    { name: 'NUNOTA', type: 'bigint', description: 'O número da nota', inactiveSince: null },
    { name: 'VLRNOTA', type: 'numeric', description: null, inactiveSince: null },
    {
      name: 'OBS',
      type: 'text',
      description: 'A observação',
      inactiveSince: '2026-11-10T08:00:00.000Z',
    },
  ],
}

test('a tabela abre em Colunas com tipo, chave e descrição', async () => {
  openCopies(server, { copies: [copy({ shown: INACTIVE_SHOWN })], runs: [] }, DETAIL)
  expect(await screen.findByRole('heading', { name: 'vendas' })).toBeTruthy()
  const table = within(await screen.findByRole('table'))
  expect(table.getByText('O número da nota')).toBeTruthy()
  expect(table.getByText('Número')).toBeTruthy()
  expect(table.getByText('Valor')).toBeTruthy()
  expect(table.getByText('Chave')).toBeTruthy()
  expect(screen.getByText('Camada')).toBeTruthy()
  expect(screen.getByText('Bruto')).toBeTruthy()
})

test('a tabela de uma cópia da versão 1 também abre em Colunas', async () => {
  const columns = [{ name: 'CODPARC', type: 'text', description: null, inactiveSince: null }]
  openCopies(server, { copies: [copy({ shown: { ...copy().shown, columns } })], runs: [] }, DETAIL)
  expect(await screen.findByText('CODPARC')).toBeTruthy()
  expect(screen.getByText('Texto')).toBeTruthy()
})

test('a coluna inativa: o aviso no topo e a marca na coluna', async () => {
  openCopies(server, { copies: [copy({ shown: INACTIVE_SHOWN })], runs: [] }, DETAIL)
  expect((await screen.findByRole('alert')).textContent).toBe(
    'O Sankhya parou de enviar a coluna OBS desde 10/11. Ela fica aqui, inativa, e nada foi apagado.',
  )
  expect(screen.getByText('Inativa desde 10/11')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Ver a rodada' })).toBeTruthy()
})

test('a coluna inativa: com duas, o aviso fala no plural', async () => {
  const columns = INACTIVE_SHOWN.columns.map((column) => ({
    ...column,
    inactiveSince: column.name === 'VLRNOTA' ? '2026-11-12T08:00:00.000Z' : column.inactiveSince,
  }))
  openCopies(
    server,
    { copies: [copy({ shown: { ...INACTIVE_SHOWN, columns } })], runs: [] },
    DETAIL,
  )
  expect((await screen.findByRole('alert')).textContent).toBe(
    'O Sankhya parou de enviar as colunas VLRNOTA e OBS desde 10/11. Elas ficam aqui, inativas, e nada foi apagado.',
  )
})

test('sem coluna inativa, não há aviso', async () => {
  openCopies(server, { copies: [copy()], runs: [] }, DETAIL)
  await screen.findByRole('heading', { name: 'vendas' })
  expect(screen.queryByRole('alert')).toBeNull()
})

test('a aba fica no endereço', async () => {
  openCopies(server, { copies: [copy()], runs: [copyRun()] }, RUNS)
  expect(await screen.findByText('Completa')).toBeTruthy()
  expect(screen.getByRole('tab', { name: 'Rodadas' }).getAttribute('aria-selected')).toBe('true')
  fireEvent.click(screen.getByRole('tab', { name: 'Colunas' }))
  await within(document.body).findByRole('table')
  expect(screen.queryByText('Completa')).toBeNull()
})

test('o endereço antigo leva à tabela', async () => {
  openCopies(
    server,
    { copies: [copy()], runs: [copyRun()] },
    `/companies/${COMPANY.id}/copies/${VENDAS}?tab=runs`,
  )
  expect(await screen.findByText('Completa')).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'vendas' })).toBeTruthy()
})
