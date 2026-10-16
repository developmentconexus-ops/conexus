import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, homeHub, hubServer } from '../../platform/test-hub.tsx'

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
    expect(await screen.findByText('Você entrou como Ana Lima.')).toBeTruthy()
    expect(conexus.router.state.location.href).toBe('/')
  })
}
