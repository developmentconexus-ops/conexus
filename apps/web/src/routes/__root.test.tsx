import { PAGES } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../main.tsx'
import { homeHub, hubServer } from '../platform/test-hub.tsx'

const server = hubServer()

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

for (const [who, signedIn, label, arrival] of [
  ['sem sessão', false, 'Entrar', 'Entrar no Conexus'],
  ['com sessão', true, 'Voltar ao início', 'Você entrou como Ana Lima.'],
] as const) {
  test(`${who}, "${label}" nomeia o destino real do endereço desconhecido`, async () => {
    server.use(...homeHub({ signedIn }))
    const conexus = createConexus(createMemoryHistory({ initialEntries: ['/nada-aqui'] }))
    render(<Conexus conexus={conexus} />)
    const action = await screen.findByRole('link', { name: label })
    expect(action.getAttribute('href')).toBe(signedIn ? '/' : '/login')
    fireEvent.click(action)
    expect(await screen.findByText(arrival)).toBeTruthy()
  })
}

test('cada endereço do roteador é uma página que o Hub abre, e só esses', () => {
  const { router } = createConexus(createMemoryHistory())
  expect(Object.keys(router.routesByPath).sort()).toEqual([...PAGES].sort())
})
