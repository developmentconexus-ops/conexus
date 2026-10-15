import { PAGES } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../main.tsx'

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

test('cada endereço do roteador é uma página que o Hub abre, e só esses', () => {
  const { router } = createConexus(createMemoryHistory())
  expect(Object.keys(router.routesByPath).sort()).toEqual([...PAGES].sort())
})
