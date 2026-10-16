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

for (const [who, signedIn, arrival] of [
  ['sem sessão', false, 'Entrar no Conexus'],
  ['com sessão', true, 'Você entrou como Ana Lima.'],
] as const) {
  test(`${who}, "Voltar ao início" leva do endereço desconhecido ao início`, async () => {
    server.use(...homeHub({ signedIn }))
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
