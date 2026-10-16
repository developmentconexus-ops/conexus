import { FAILURES } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../main.tsx'
import { ANA } from '../platform/fixtures.ts'
import { hubServer, refusal, sessionRead } from '../platform/test-hub.tsx'
import { Notice } from './notice.tsx'

const server = hubServer()

test('Notice is the common polite status without an urgent alert', () => {
  render(<Notice>Senha criada. Você já entrou.</Notice>)
  expect(screen.getByRole('status').textContent).toBe('Senha criada. Você já entrou.')
  expect(screen.queryByRole('alert')).toBeNull()
})

for (const [signedIn, name, href] of [
  [false, 'Entrar', '/login'],
  [true, 'Voltar ao início', '/'],
] as const) {
  test(`NOT_FOUND failure uses INITIAL and the loader's ${name} destination`, async () => {
    server.use(
      sessionRead(() => (signedIn ? ANA : undefined)),
      http.get('*/api/invitations/:id', () => refusal('NOT_FOUND')),
    )
    const entry = `/login?redirect=${encodeURIComponent(`/invitations/${'i'.repeat(32)}`)}`
    const conexus = createConexus(createMemoryHistory({ initialEntries: [entry] }))
    render(<Conexus conexus={conexus} />)
    expect(
      await screen.findByRole('heading', { name: 'Não foi possível abrir o Conexus' }),
    ).toBeTruthy()
    expect(FAILURES.NOT_FOUND.actionKind).toBe('INITIAL')
    expect(screen.getByRole('link', { name }).getAttribute('href')).toBe(href)
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  })
}
