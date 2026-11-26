import { fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { LIST, lakeRun, lakeTable, openData } from './test-hub.tsx'

const server = hubServer()

const OPEN = { outcome: 'RUNNING', endedAt: undefined, read: undefined, written: undefined }
const TABLE = lakeTable()

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
afterEach(() => vi.useRealTimers())

async function tick() {
  await vi.advanceTimersByTimeAsync(5_100)
}

test('Dados: a rodada aberta é seguida e a lista passa a Em dia quando o Hub a fecha', async () => {
  const held = { tables: [lakeTable({ lastRun: lakeRun(OPEN) })] }
  openData(server, held, LIST)
  expect(await screen.findByText('Rodando…')).toBeTruthy()
  held.tables = [TABLE]
  await tick()
  expect(await screen.findByText('Em dia')).toBeTruthy()
  expect(screen.queryByText('Rodando…')).toBeNull()
})

test('Rodadas da tabela: a rodada aberta é seguida e a linha passa a Completa quando o Hub a fecha', async () => {
  const held = { tables: [TABLE], runs: { [TABLE.id]: [lakeRun(OPEN)] } }
  openData(server, held, `${LIST}/lake/${TABLE.id}`)
  await screen.findByRole('heading', { name: TABLE.label })
  const main = within(screen.getByRole('main'))
  fireEvent.click(main.getByRole('tab', { name: 'Rodadas' }))
  const table = await main.findByRole('table', { name: 'Rodadas da tabela' })
  expect(within(table).getByText('Rodando…')).toBeTruthy()
  held.runs = { [TABLE.id]: [lakeRun()] }
  await tick()
  expect(await within(table).findByText('Em dia')).toBeTruthy()
  expect(within(table).queryByText('Rodando…')).toBeNull()
})
