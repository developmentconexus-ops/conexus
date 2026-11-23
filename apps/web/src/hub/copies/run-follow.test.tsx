import { fireEvent, screen, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { copy, copyRun, detailOf, onPhone, openCopies, VENDAS } from './test-hub.tsx'

const server = hubServer()

test('as rodadas, 20 por página: Ver mais abre a seguinte e Primeira página volta', async () => {
  openCopies(
    server,
    { copies: [copy()], runs: [copyRun()], later: [copyRun({ read: 7 })] },
    `${detailOf(VENDAS)}?tab=runs`,
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
      `${detailOf(VENDAS)}?tab=runs`,
    )
    expect(await screen.findByText(/1\.204 lidas · 1\.100 gravadas · Completa/)).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
  })
})
