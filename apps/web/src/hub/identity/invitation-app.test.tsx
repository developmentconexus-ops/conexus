import { acceptInvitation, getInvitation } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, expect, test, vi } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, sessionRead } from '../../platform/test-hub.tsx'
import { ENCOMENDAS } from '../../platform/test-hub-access.tsx'

const DAVI = { id: 'person-davi', name: 'Davi Costa', email: 'davi@example.test' }
const ID = 'i'.repeat(32)
const SOL = { ...COMPANY, name: 'Padaria Sol' }
const FOR_APP = {
  company: SOL,
  role: null,
  app: { projectName: 'Encomendas' },
  inviterName: 'Ana Lima',
  firstOwner: false,
  expiresAt: '2026-10-20T12:00:00.000Z',
  revision: 0,
} as const
const server = hubServer()

function hub(invitation: unknown) {
  server.use(
    http.get(`*/api/invitations/${ID}`, () =>
      HttpResponse.json(getInvitation.success.body.parse({ invitation })),
    ),
  )
  render(
    <Conexus
      conexus={createConexus(createMemoryHistory({ initialEntries: [`/invitations/${ID}`] }))}
    />,
  )
}

afterEach(() => vi.restoreAllMocks())

test('o convite de um app diz o app e a empresa; aceitar leva o navegador ao endereço do app', async () => {
  const assign = vi.fn()
  vi.spyOn(globalThis, 'location', 'get').mockReturnValue({ ...globalThis.location, assign })
  server.use(
    sessionRead(() => DAVI),
    http.put(`*/api/invitations/${ID}/acceptance`, () =>
      HttpResponse.json(acceptInvitation.success.body.parse({ company: SOL, app: ENCOMENDAS })),
    ),
  )
  hub({ kind: 'INVITED', ...FOR_APP })
  expect(
    await screen.findByRole('heading', {
      name: 'Ana Lima convidou você para usar o app Encomendas, da Padaria Sol.',
    }),
  ).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Aceitar convite' }))
  await waitFor(() => expect(assign).toHaveBeenCalledWith(`https://${ENCOMENDAS.address}/`))
})

test('quem já usa o app abre o app, sem aceitar de novo', async () => {
  hub({ kind: 'JOINED', company: SOL, app: ENCOMENDAS })
  const link = await screen.findByRole('link', { name: 'Abrir app' })
  expect(link.getAttribute('href')).toBe(`https://${ENCOMENDAS.address}/`)
  expect(screen.getByRole('heading', { name: 'Você já usa o app Encomendas.' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Aceitar convite' })).toBeNull()
})
