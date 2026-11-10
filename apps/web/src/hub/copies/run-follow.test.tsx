import { CopyRunId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { copy, copyRun, detailOf, LIST, onPhone, openCopies, VENDAS } from './test-hub.tsx'

// Uma rodada pedida (Rodar agora, Ligar) é seguida até aparecer, e o detalhe (Capacidade 2, criterion 34).
const server = hubServer()
const OLD = CopyRunId.parse('55555555-5555-4555-8555-555555555555')
const NEW = CopyRunId.parse('66666666-6666-4666-8666-666666666666')
const RUNNING = { outcome: { kind: 'RUNNING' }, endedAt: null } as const

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
afterEach(() => vi.useRealTimers())

async function tick() {
  await vi.advanceTimersByTimeAsync(5_100)
}

test('Rodar agora na lista: a rodada que o Hub ainda não abriu é esperada, e vista rodando e completa', async () => {
  const held = { copies: [copy({ run: copyRun({ id: OLD }) })] }
  openCopies(server, held, LIST)
  fireEvent.click(await screen.findByRole('button', { name: 'Ações: Vendas' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Rodar agora' }))
  await screen.findByText('Pedido enviado. A rodada aparece na lista.')
  await tick()
  expect(screen.getByText('Em dia')).toBeTruthy()
  held.copies[0] = copy({ run: copyRun({ id: NEW, ...RUNNING }) })
  await tick()
  await waitFor(() => expect(screen.getByText('Rodando…')).toBeTruthy())
  held.copies[0] = copy({ run: copyRun({ id: NEW, startedAt: '2026-11-02T11:00:00.000Z' }) })
  await tick()
  await waitFor(() => expect(screen.getByText('Em dia')).toBeTruthy())
  expect(screen.queryByText('Pedido enviado. A rodada aparece na lista.')).toBeNull()
})

test('Pedido enviado: some na ação seguinte, mesmo com a rodada ainda esperada', async () => {
  openCopies(server, { copies: [copy({ run: copyRun({ id: OLD }) })] }, LIST)
  fireEvent.click(await screen.findByRole('button', { name: 'Ações: Vendas' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Rodar agora' }))
  await screen.findByText('Pedido enviado. A rodada aparece na lista.')
  fireEvent.click(screen.getByRole('button', { name: 'Ações: Vendas' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Pausar' }))
  await waitFor(() =>
    expect(screen.queryByText('Pedido enviado. A rodada aparece na lista.')).toBeNull(),
  )
})

test('Rodar agora no detalhe: o botão é da página, a rodada pedida aparece sem recarregar', async () => {
  const held = {
    copies: [copy({ run: copyRun({ id: OLD }) })],
    runs: [copyRun({ id: OLD })],
  }
  openCopies(server, held, detailOf(VENDAS))
  fireEvent.click(await screen.findByRole('button', { name: 'Rodar agora' }))
  await screen.findByText('Pedido enviado. A rodada aparece na lista.')
  expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2)
  held.runs = [copyRun({ id: NEW, ...RUNNING }), copyRun({ id: OLD })]
  await tick()
  await waitFor(() => expect(within(screen.getByRole('table')).getByText('Rodando…')).toBeTruthy())
  held.runs = [copyRun({ id: NEW }), copyRun({ id: OLD })]
  await tick()
  await waitFor(() => expect(within(screen.getByRole('table')).queryByText('Rodando…')).toBeNull())
  fireEvent.click(screen.getByRole('button', { name: 'Ações: Vendas' }))
  expect(await screen.findByRole('menuitem', { name: 'Pausar' })).toBeTruthy()
  expect(screen.queryByRole('menuitem', { name: 'Rodar agora' })).toBeNull()
})

test('o detalhe de uma cópia sem relógio não tem Rodar agora', async () => {
  openCopies(
    server,
    { copies: [copy({ schedule: { kind: 'MISSING' } })], runs: [] },
    detailOf(VENDAS),
  )
  await screen.findByRole('heading', { name: 'Vendas' })
  expect(screen.queryByRole('button', { name: 'Rodar agora' })).toBeNull()
})

test('as rodadas, 20 por página: Ver mais abre a seguinte e Primeira página volta', async () => {
  openCopies(
    server,
    { copies: [copy()], runs: [copyRun()], later: [copyRun({ read: 7 })] },
    detailOf(VENDAS),
  )
  fireEvent.click(await screen.findByRole('link', { name: 'Ver mais: Rodadas' }))
  expect(await screen.findByText('7')).toBeTruthy()
  fireEvent.click(screen.getByRole('link', { name: 'Primeira página: Rodadas' }))
  await waitFor(() => expect(screen.queryByText('7')).toBeNull())
})

test('as rodadas num celular: linhas empilhadas, não tabela', async () => {
  await onPhone(async () => {
    openCopies(
      server,
      { copies: [copy()], runs: [copyRun({ read: 1204, written: 1100 })] },
      detailOf(VENDAS),
    )
    expect(await screen.findByText(/1\.204 lidas · 1\.100 gravadas · Completa/)).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })
})
