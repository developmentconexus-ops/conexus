import { APP_OPEN_PATH, PAGES } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../main.tsx'
import { COMPANY } from '../platform/fixtures.ts'
import { homeHub, hubServer, projectsRead } from '../platform/test-hub.tsx'

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
  ['com sessão', true, 'Voltar ao início', 'Você ainda não está em nenhuma empresa.'],
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

test('dentro da moldura da empresa, um endereço que não existe mais fica no conteúdo, com "Voltar ao início"', async () => {
  server.use(
    ...projectsRead({ projects: [], databaseReady: true, mayDelete: false, role: 'member' }),
  )
  const conexus = createConexus(
    createMemoryHistory({ initialEntries: [`/companies/${COMPANY.id}/people`] }),
  )
  render(<Conexus conexus={conexus} />)
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
  expect(screen.getByRole('navigation', { name: 'Navegação' })).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Voltar ao início' }).getAttribute('href')).toBe('/')
})

test('cada endereço do roteador é uma página que o Hub abre, ou a recusa da passagem, e só esses', () => {
  const { router } = createConexus(createMemoryHistory())
  expect(Object.keys(router.routesByPath).sort()).toEqual([...PAGES, APP_OPEN_PATH].sort())
})
