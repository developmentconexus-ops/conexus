import { PAGES } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest'
import { Conexus, createConexus } from '../main.tsx'

const ANA = { id: 'person-ana', name: 'Ana Lima', email: 'ana@example.test' }
const STATUS = { version: 'v0.1.0', lastStart: { state: 'NONE' }, previousStart: { state: 'NONE' } }
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

test('um endereço desconhecido mostra "Não encontramos o que você procurou."', async () => {
  const conexus = createConexus(
    createMemoryHistory({ initialEntries: ['/endereco-que-nao-existe'] }),
  )
  render(<Conexus conexus={conexus} />)
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
  expect(screen.getByText('Confira o endereço.')).toBeTruthy()
  expect(screen.queryByText('Not Found')).toBeNull()
})

for (const [who, session, arrival] of [
  ['sem sessão', { state: 'SIGNED_OUT' }, 'Entrar no Conexus'],
  ['com sessão', { state: 'SIGNED_IN', person: ANA }, 'Você entrou como Ana Lima.'],
] as const) {
  test(`${who}, "Voltar ao início" leva do endereço desconhecido ao início`, async () => {
    server.use(
      http.get('*/api/sessions/current', () => HttpResponse.json(session)),
      http.get('*/api/status', () => HttpResponse.json(STATUS)),
    )
    const conexus = createConexus(createMemoryHistory({ initialEntries: ['/nada-aqui'] }))
    render(<Conexus conexus={conexus} />)
    fireEvent.click(await screen.findByRole('link', { name: 'Voltar ao início' }))
    expect(await screen.findByText(arrival)).toBeTruthy()
  })
}

test('cada endereço do roteador é uma página que o Hub abre, e só esses', () => {
  const { router } = createConexus(createMemoryHistory())
  expect(Object.keys(router.routesByPath).sort()).toEqual([...PAGES].sort())
})
