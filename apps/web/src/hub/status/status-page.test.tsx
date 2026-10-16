import { HubStatus, Problem } from '@conexus/hub-api'
import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { createCache } from '../../platform/cache.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import { StatusPage } from './public.ts'

const server = hubServer()

function open() {
  render(
    <QueryClientProvider client={createCache(() => undefined)}>
      <StatusPage />
    </QueryClientProvider>,
  )
}

function answer(status: unknown) {
  server.use(http.get('*/api/status', () => HttpResponse.json(HubStatus.parse(status))))
}

const RECORDED = { state: 'RECORDED', version: 'v0.1.0', startedAt: '2026-10-14T17:02:00.000Z' }

test('mostra a versão e os dois inícios na hora de Brasília', async () => {
  answer({
    version: 'v0.1.0',
    lastStart: RECORDED,
    previousStart: { ...RECORDED, startedAt: '2026-10-14T03:30:00.000Z' },
  })
  open()
  expect(await screen.findByText('v0.1.0')).toBeTruthy()
  expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual([
    'Último início',
    'Início anterior',
  ])
  expect(screen.getAllByRole('definition').map((hour) => hour.textContent)).toEqual([
    '14/10 14:02',
    '14/10 00:30',
  ])
  expect(screen.getByText('Hub do Conexus no ar.')).toBeTruthy()
  expect(screen.queryByRole('alert')).toBeNull()
})

test('mostra que nenhum início foi gravado', async () => {
  answer({ version: 'v0.1.0', lastStart: { state: 'NONE' }, previousStart: { state: 'NONE' } })
  open()
  expect(await screen.findAllByText('Nenhum início gravado')).toHaveLength(2)
})

test('mostra a frase do banco fora', async () => {
  const problem = Problem.parse({
    type: 'urn:conexus:problem:DATABASE_UNAVAILABLE',
    title: 'O banco do Conexus não respondeu.',
    status: 503,
    code: 'DATABASE_UNAVAILABLE',
    traceId: 'a1b2c3',
  })
  server.use(
    http.get('*/api/status', () =>
      HttpResponse.json(problem, {
        status: 503,
        headers: { 'content-type': 'application/problem+json' },
      }),
    ),
  )
  open()
  expect((await screen.findByRole('alert')).textContent).toBe('O banco do Conexus não respondeu.')
  expect(screen.queryByText('Último início')).toBeNull()
})

test('mostra a falha', async () => {
  const problem = Problem.parse({
    type: 'urn:conexus:problem:INTERNAL_UNEXPECTED',
    title: 'Algo deu errado dentro do Conexus.',
    status: 500,
    code: 'INTERNAL_UNEXPECTED',
    traceId: 'a1b2c3',
  })
  server.use(
    http.get('*/api/status', () =>
      HttpResponse.json(problem, {
        status: 500,
        headers: { 'content-type': 'application/problem+json' },
      }),
    ),
  )
  open()
  const alert = await screen.findByRole('alert')
  expect(alert.textContent).toBe('Algo deu errado dentro do Conexus.')
  expect(screen.queryByText(/^v\d/)).toBeNull()
  expect(screen.queryByText('Hub do Conexus no ar.')).toBeNull()
})

test('mostra a falha quando o Hub não responde', async () => {
  server.use(http.get('*/api/status', () => HttpResponse.error()))
  open()
  expect((await screen.findByRole('alert')).textContent).toBe('Algo deu errado dentro do Conexus.')
  expect(screen.queryByText(/^v\d/)).toBeNull()
})

test('mostra a falha quando a resposta não cumpre o contrato', async () => {
  server.use(http.get('*/api/status', () => HttpResponse.json({ version: '0.1.0' })))
  open()
  expect((await screen.findByRole('alert')).textContent).toBe('Algo deu errado dentro do Conexus.')
})
