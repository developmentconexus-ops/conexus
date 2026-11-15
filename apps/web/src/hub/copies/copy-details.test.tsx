import { screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { copy, copyRun, detailOf, openCopies, VENDAS } from './test-hub.tsx'
import { KEPT_IN_HUB } from './text.ts'

// A tabela, o painel Detalhes ao lado das abas (Dados, parte 1, critérios 61 a 65).
const server = hubServer()
const DETAIL = detailOf(VENDAS)
const COPIED = /^Copiada do Sankhya em .+ · 118\.402 linhas$/

test('o painel Detalhes', async () => {
  openCopies(server, { copies: [copy()], runs: [] }, DETAIL)
  const panel = within(await screen.findByRole('complementary', { name: 'Detalhes' }))
  expect(panel.getAllByRole('term').map((one) => one.textContent)).toEqual([
    'Sistema',
    'Frequência',
    'Última rodada',
    'Linhas',
  ])
  for (const text of [
    'Sistema',
    'Sankhya',
    'Frequência',
    'A cada 30 min',
    'Última rodada',
    'Linhas',
    '118.402',
  ]) {
    expect(panel.getByText(text)).toBeTruthy()
  }
  expect(panel.getByText(/^Completa · .+/)).toBeTruthy()
  expect(panel.getByText(KEPT_IN_HUB)).toBeTruthy()
  expect(screen.queryByText('Camada')).toBeNull()
  for (const gone of ['Ligação', 'Chave', 'Modo']) expect(panel.queryByText(gone)).toBeNull()
})

test('o painel e a linha da cópia dizem a mesma hora', async () => {
  const run = copyRun({ startedAt: '2026-11-02T09:00:00.000Z' })
  openCopies(server, { copies: [copy({ run })], runs: [] }, DETAIL)
  const panel = within(await screen.findByRole('complementary', { name: 'Detalhes' }))
  const inPanel = panel.getByText(/^Completa · /).textContent?.replace('Completa · ', '')
  const line = (await screen.findByText(COPIED)).textContent ?? ''
  expect(line.slice(line.indexOf('em ') + 3, line.indexOf(' · '))).toBe(inPanel)
})

test('a última rodada de um painel com a rodada aberta não diz hora', async () => {
  const run = copyRun({ outcome: { kind: 'RUNNING' }, endedAt: null })
  openCopies(server, { copies: [copy({ run })], runs: [] }, DETAIL)
  const panel = within(await screen.findByRole('complementary', { name: 'Detalhes' }))
  expect(panel.getByText('Rodando…')).toBeTruthy()
})

test('a última rodada com erro diz a frase do código e a hora do fim', async () => {
  const run = copyRun({ outcome: { kind: 'ERROR', code: 'COPY_SOURCE_UNREACHABLE' } })
  openCopies(server, { copies: [copy({ run })], runs: [] }, DETAIL)
  const panel = within(await screen.findByRole('complementary', { name: 'Detalhes' }))
  expect(panel.getByText(/^O sistema não respondeu\. · .+/)).toBeTruthy()
})

test('sem agendamento, a frequência é um traço', async () => {
  openCopies(
    server,
    { copies: [copy({ interval: null, schedule: { kind: 'MISSING' } })], runs: [] },
    DETAIL,
  )
  const panel = within(await screen.findByRole('complementary', { name: 'Detalhes' }))
  expect(panel.getByText('Frequência').nextElementSibling?.textContent).toBe('—')
})

test('o painel vem depois das abas', async () => {
  openCopies(server, { copies: [copy()], runs: [] }, DETAIL)
  const panel = await screen.findByRole('complementary', { name: 'Detalhes' })
  const tabs = screen.getByRole('tablist', { name: 'Tabela' })
  expect(tabs.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})
