import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { homeHub, hubServer, refusal } from '../../platform/test-hub.tsx'

const server = hubServer()
const OPEN = `/apps/open?host=pedidos--empresa-teste&binding=${'b'.repeat(43)}`

function open() {
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [OPEN] }))} />)
}

for (const [who, signedIn, arrival] of [
  ['com sessão', true, 'Você ainda não está em nenhuma empresa.'],
  ['sem sessão', false, 'Entrar no Conexus'],
] as const) {
  test(`${who}: a frase da recusa sem a moldura do Hub, e "Ir para o Início" leva ao Início`, async () => {
    server.use(...homeHub({ signedIn }))
    open()
    expect(
      await screen.findByRole('heading', {
        name: 'Este app não existe ou você não tem acesso a ele.',
      }),
    ).toBeTruthy()
    expect(screen.queryByRole('navigation')).toBeNull()
    expect(screen.queryByText('Abrir app')).toBeNull()
    const home = screen.getByRole('link', { name: 'Ir para o Início' })
    expect(home.getAttribute('href')).toBe('/')
    fireEvent.click(home)
    expect(await screen.findByText(arrival)).toBeTruthy()
  })
}

test('a leitura da sessão falha: "Não foi possível abrir o Conexus" com a frase da falha', async () => {
  server.use(http.get('*/api/sessions/current', () => refusal('DATABASE_UNAVAILABLE')))
  open()
  expect(
    await screen.findByRole('heading', { name: 'Não foi possível abrir o Conexus' }),
  ).toBeTruthy()
  expect(screen.getByRole('alert').textContent).toBe(
    'O banco do Conexus não respondeu. O erro foi registrado. Avise quem cuida do Conexus.',
  )
  expect(screen.queryByText('Este app não existe ou você não tem acesso a ele.')).toBeNull()
})
