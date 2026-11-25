import { fireEvent, screen, within } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { connectionOf } from './fixtures.ts'
import { copiedLake, RUNNING_ROUND } from './lake-fixtures.ts'
import type { Answers, View } from './test-hub.tsx'
import { connectionsHub, mount, pageOf, viewOf } from './test-hub.tsx'

const server = hubServer()
const MATRIZ = connectionOf({ name: 'Matriz', state: 'ACTIVE' })
const IDLE = copiedLake(['TGFCAB', 'TGFITE'])
const RUNNING = copiedLake(['TGFCAB', 'TGFITE'], { lastRun: RUNNING_ROUND })

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
afterEach(() => vi.useRealTimers())

async function tick(seconds = 5.1) {
  await vi.advanceTimersByTimeAsync(seconds * 1_000)
}

/** The tab "Tabelas" of the Matriz on a Hub that holds `fields`; `reads` counts the section's reads. */
async function openSection(fields: Partial<View>, answers: Answers = {}) {
  const view = viewOf({ connections: [MATRIZ], ...fields })
  const hub = connectionsHub(view, answers)
  server.use(...hub.handlers)
  const reads = { count: 0 }
  server.events.on('request:start', ({ request }) => {
    if (request.method === 'GET' && request.url.endsWith('/lake-tables')) reads.count += 1
  })
  mount(pageOf(MATRIZ))
  fireEvent.click(await screen.findByRole('tab', { name: 'Tabelas' }))
  const section = await screen.findByRole('region', { name: 'Tabelas no lago' })
  return { view, reads, section: within(section) }
}

test('Rodar agora: a rodada fecha no Hub e a seção passa a Em dia sem nova ação', async () => {
  const { view, section } = await openSection({ lake: IDLE })
  fireEvent.click(section.getByRole('button', { name: 'Rodar agora' }))
  expect(await section.findAllByText('Rodando…')).toHaveLength(2)
  view.lake = IDLE
  await tick()
  expect(await section.findAllByText('Em dia')).toHaveLength(2)
  expect(section.queryByText('Rodando…')).toBeNull()
})

test('Rodar agora: a releitura que chega antes de a rodada abrir não encerra o acompanhamento', async () => {
  const { view, section } = await openSection(
    { lake: IDLE },
    { run: () => HttpResponse.json({ already: false }, { status: 202 }) },
  )
  fireEvent.click(section.getByRole('button', { name: 'Rodar agora' }))
  await tick(1)
  expect(section.queryByText('Rodando…')).toBeNull()
  view.lake = RUNNING
  await tick()
  expect(await section.findAllByText('Rodando…')).toHaveLength(2)
  view.lake = IDLE
  await tick()
  expect(await section.findAllByText('Em dia')).toHaveLength(2)
})

test('a seção para de reler quando não há rodada aberta e o tempo depois do pedido acabou', async () => {
  const { reads, view, section } = await openSection({ lake: IDLE })
  fireEvent.click(section.getByRole('button', { name: 'Rodar agora' }))
  await section.findAllByText('Rodando…')
  view.lake = IDLE
  await tick(40)
  const settled = reads.count
  await tick(30)
  expect(reads.count).toBe(settled)
})

test('uma rodada aberta ao entrar na página é seguida até fechar, sem pedido da pessoa', async () => {
  const { view, section } = await openSection({ lake: RUNNING })
  expect(section.getAllByText('Rodando…')).toHaveLength(2)
  view.lake = IDLE
  await tick()
  expect(await section.findAllByText('Em dia')).toHaveLength(2)
})
