import { HubStatus } from '@conexus/hub-api'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory } from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { createCache } from '../../platform/cache.ts'
import { centralHub, homeHub, hubServer, NO_COMPANIES, refusal } from '../../platform/test-hub.tsx'
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
  server.use(http.get('*/api/status', () => refusal('DATABASE_UNAVAILABLE')))
  open()
  expect((await screen.findByRole('alert')).textContent).toBe('O banco do Conexus não respondeu.')
  expect(screen.queryByText('Último início')).toBeNull()
})

test('mostra a falha', async () => {
  server.use(http.get('*/api/status', () => refusal('INTERNAL_UNEXPECTED')))
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

test('o operador abre /operations/status na moldura da Central (critério 8)', async () => {
  server.use(...centralHub([]))
  const conexus = createConexus(createMemoryHistory({ initialEntries: ['/operations/status'] }))
  render(<Conexus conexus={conexus} />)
  expect(await screen.findByRole('heading', { name: 'Estado do Hub' })).toBeTruthy()
  expect(await screen.findByText('Hub do Conexus no ar.')).toBeTruthy()
  expect(screen.getByRole('navigation', { name: 'Navegação' })).toBeTruthy()
  expect(conexus.router.state.location.pathname).toBe('/operations/status')
})

test('quem não opera: "Não encontramos o que você procurou.", sem pedir o estado (critério 8)', async () => {
  let asked = 0
  server.use(
    ...homeHub({ signedIn: true }, NO_COMPANIES),
    http.get('*/api/status', () => {
      asked += 1
      return HttpResponse.json(
        HubStatus.parse({
          version: 'v0.1.0',
          lastStart: { state: 'NONE' },
          previousStart: { state: 'NONE' },
        }),
      )
    }),
  )
  render(
    <Conexus
      conexus={createConexus(createMemoryHistory({ initialEntries: ['/operations/status'] }))}
    />,
  )
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
  expect(screen.queryByRole('heading', { name: 'Estado do Hub' })).toBeNull()
  expect(asked).toBe(0)
})
