import { screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { built, listOf, notas, openTreatment } from './test-hub.tsx'

// Tratado reads on while a run is open, so the table shows its rows without a reload.
const server = hubServer()

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
afterEach(() => vi.useRealTimers())

const OPEN = { state: 'RUNNING', since: '2026-11-26T17:00:00.000Z', stopping: false } as const

test('com a rodada aberta, a lista é lida de novo a cada 5 s, e a tabela mostra as linhas quando a rodada fecha', async () => {
  const { view } = openTreatment(server, {
    view: { list: listOf({ lastRun: OPEN, tables: [notas()] }) },
  })
  await screen.findByRole('navigation', { name: 'Dados' })
  const main = within(screen.getByRole('main'))
  expect(await main.findByText('Esperando a próxima cópia')).toBeTruthy()
  expect(main.getByRole('button', { name: 'Parar' })).toBeTruthy()

  view.list = listOf({
    lastRun: { state: 'DONE', at: '2026-11-26T17:05:00.000Z' },
    tables: [notas({ lastRun: built() })],
  })
  await vi.advanceTimersByTimeAsync(5_100)

  expect(await main.findByText('128.402 linhas · tratada às 14:05')).toBeTruthy()
  expect(main.queryByRole('button', { name: 'Parar' })).toBeNull()
})
