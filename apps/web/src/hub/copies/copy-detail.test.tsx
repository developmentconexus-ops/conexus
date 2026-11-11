import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { copy, copyRun, detailOf, openCopies, VENDAS } from './test-hub.tsx'

// Uma cópia: o que é copiado e as rodadas (Capacidade 2, criterion 34).
const server = hubServer()
const DETAIL = detailOf(VENDAS)
const OTHER = '99999999-9999-4999-8999-999999999999'

test('a cópia e as rodadas: a consulta, a chave, a janela e cada rodada em palavras', async () => {
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
    DETAIL,
  )
  expect(await screen.findByRole('heading', { name: 'Vendas' })).toBeTruthy()
  expect(screen.getByText('Em dia')).toBeTruthy()
  expect(screen.getByText(/Matriz · a cada 30 min/)).toBeTruthy()
  expect(screen.getByText('SELECT NUNOTA, CODPARC')).toBeTruthy()
  expect(screen.getByText('NUNOTA')).toBeTruthy()
  expect(screen.getByText('por janela de 30 dias')).toBeTruthy()
  expect(
    screen.getByText(
      'A primeira carga traz tudo; a cada rodada relê o que mudou desde a anterior e DTNEG dos últimos 30 dias.',
    ),
  ).toBeTruthy()
  const table = within(screen.getByRole('table'))
  expect(table.getByText('Completa')).toBeTruthy()
  expect(table.getByText('O sistema não respondeu.')).toBeTruthy()
  expect(table.getByText('Parcial; a próxima continua')).toBeTruthy()
  expect(
    table.getByText('O Conexus reiniciou no meio; a próxima continua de onde parou'),
  ).toBeTruthy()
  expect(table.getAllByText('1.204')).toHaveLength(6)
})

test('a cópia e as rodadas: sem rodada, a frase de primeira vez; Rodar agora e Voltar às cópias estão à mão', async () => {
  openCopies(server, { copies: [copy({ run: null })], runs: [] }, DETAIL)
  expect(await screen.findByText('A primeira rodada ainda não terminou.')).toBeTruthy()
  expect(within(screen.getByRole('main')).getByRole('link', { name: 'Cópias' })).toBeTruthy()
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

const SHOWN = { query: 'SELECT CODPARC FROM TGFPAR', key: ['CODPARC'] }

test('a releitura, só com a data de alteração: o que mudou desde a anterior', async () => {
  const shown = { ...SHOWN, changedSince: { column: 'DTALTER' }, window: null }
  openCopies(server, { copies: [copy({ shown, mode: { kind: 'CHANGES' } })], runs: [] }, DETAIL)
  expect(
    await screen.findByText(
      'A primeira carga traz tudo; a cada rodada relê o que mudou desde a anterior.',
    ),
  ).toBeTruthy()
})

test('a releitura, com a janela e sem data de alteração: a fonte inteira, como o motor lê', async () => {
  const shown = { ...SHOWN, changedSince: null, window: { column: 'DTNEG', days: 30 } }
  openCopies(server, { copies: [copy({ shown, mode: { kind: 'WHOLE' } })], runs: [] }, DETAIL)
  expect(await screen.findByText('A fonte inteira, a cada rodada.')).toBeTruthy()
})

test('a releitura, sem data de alteração nem janela: a fonte inteira a cada rodada', async () => {
  const shown = { ...SHOWN, changedSince: null, window: null }
  openCopies(server, { copies: [copy({ shown, mode: { kind: 'WHOLE' } })], runs: [] }, DETAIL)
  expect(await screen.findByText('A fonte inteira, a cada rodada.')).toBeTruthy()
})
