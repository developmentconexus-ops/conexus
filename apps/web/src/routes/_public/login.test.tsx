import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA } from '../../platform/fixtures.ts'
import { homeHub, hubServer, refusal } from '../../platform/test-hub.tsx'

const server = hubServer()

const HOSTILE = [
  '//evil.example.test/',
  'https://evil.example.test/',
  '/\\evil.example.test/',
  '\\\\evil.example.test',
  'javascript:alert(1)',
  'evil.example.test',
]

for (const hostile of HOSTILE) {
  test(`um endereço de volta fora do Hub (${hostile}) é descartado, e entrar abre o início`, async () => {
    const state = { signedIn: false }
    server.use(...homeHub(state))
    const path = `/login?redirect=${encodeURIComponent(hostile)}`
    const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
    render(<Conexus conexus={conexus} />)
    fireEvent.change(await screen.findByLabelText('E-mail'), { target: { value: ANA.email } })
    expect(conexus.router.state.location.search).toEqual({})
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-certa-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Você ainda não está em nenhuma empresa.')).toBeTruthy()
    expect(conexus.router.state.location.href).toBe('/')
  })
}

const COMPANIES = `/companies/${'a'.repeat(32)}`

for (const [what, from] of [
  ['um endereço de volta', `/login?redirect=${encodeURIComponent(COMPANIES)}`],
  [
    'um /login dentro do próprio endereço de volta, que um link antigo trazia',
    `/login?redirect=${encodeURIComponent(`/login?reason=session-ended&redirect=${encodeURIComponent(COMPANIES)}`)}`,
  ],
] as const) {
  test(`quem já está dentro e abre /login com ${what} vai direto ao endereço de volta`, async () => {
    server.use(
      ...homeHub({ signedIn: true }),
      http.get('*/api/companies/:companyId', () => refusal('NOT_FOUND')),
    )
    const conexus = createConexus(createMemoryHistory({ initialEntries: [from] }))
    render(<Conexus conexus={conexus} />)
    await waitFor(() => expect(conexus.router.state.location.pathname).toBe(COMPANIES))
    expect(screen.queryByLabelText('Senha')).toBeNull()
  })
}

test('quem não está dentro vê o formulário de entrada', async () => {
  server.use(...homeHub({ signedIn: false }))
  const conexus = createConexus(
    createMemoryHistory({ initialEntries: [`/login?redirect=${encodeURIComponent(COMPANIES)}`] }),
  )
  render(<Conexus conexus={conexus} />)
  expect(await screen.findByLabelText('Senha')).toBeTruthy()
  expect(conexus.router.state.location.pathname).toBe('/login')
})
