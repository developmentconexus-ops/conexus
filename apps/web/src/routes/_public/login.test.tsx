import { listCompanies } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, hubServer, STATUS } from '../../platform/test-hub.tsx'

const NO_COMPANIES = listCompanies.success.body.parse({
  companies: [],
  mayCreate: false,
  next: { kind: 'END' },
})
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
    server.use(
      http.get('*/api/sessions/current', () =>
        HttpResponse.json(
          state.signedIn ? { state: 'SIGNED_IN', person: ANA } : { state: 'SIGNED_OUT' },
        ),
      ),
      http.put('*/api/sessions/current', () => {
        state.signedIn = true
        return HttpResponse.json({ person: ANA })
      }),
      http.get('*/api/status', () => HttpResponse.json(STATUS)),
      http.get('*/api/companies', () => HttpResponse.json(NO_COMPANIES)),
    )
    const path = `/login?redirect=${encodeURIComponent(hostile)}`
    const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
    render(<Conexus conexus={conexus} />)
    fireEvent.change(await screen.findByLabelText('E-mail'), { target: { value: ANA.email } })
    expect(conexus.router.state.location.search).toEqual({})
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-certa-1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
    expect(await screen.findByText('Você entrou como Ana Lima.')).toBeTruthy()
    expect(conexus.router.state.location.href).toBe('/')
  })
}
