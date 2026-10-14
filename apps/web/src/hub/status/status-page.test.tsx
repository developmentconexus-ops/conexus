import { HubStatus, Problem } from '@conexus/hub-api'
import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest'
import { createCache } from '../../platform/cache.ts'
import { StatusPage } from './public.ts'

const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function open() {
  render(
    <QueryClientProvider client={createCache()}>
      <StatusPage />
    </QueryClientProvider>,
  )
}

test('mostra a versão', async () => {
  server.use(
    http.get('*/api/status', () => HttpResponse.json(HubStatus.parse({ version: 'v0.1.0' }))),
  )
  open()
  expect(await screen.findByText('v0.1.0')).toBeTruthy()
  expect(screen.getByRole('img', { name: 'Conexus' })).toBeTruthy()
  expect(screen.getByText('Hub do Conexus no ar.')).toBeTruthy()
  expect(screen.queryByRole('alert')).toBeNull()
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
