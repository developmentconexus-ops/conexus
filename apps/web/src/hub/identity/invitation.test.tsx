import type { InvitationView } from '@conexus/hub-api'
import { acceptInvitation, FAILURES, getCompany, getInvitation } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import type { z } from 'zod'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { companyRead, hubServer, refusal, sessionRead } from '../../platform/test-hub.tsx'

const DAVI = { id: 'person-davi', name: 'Davi Costa', email: 'davi@example.test' }
const ID = 'i'.repeat(32)
const ENTRY = `/invitations/${ID}`
const DETAILS = {
  company: COMPANY,
  role: 'admin',
  inviterName: 'Ana Lima',
  expiresAt: '2026-10-20T12:00:00.000Z',
  revision: 0,
} as const
const server = hubServer()

function hub(initial: z.input<typeof InvitationView>) {
  const state = { invitation: initial }
  server.use(
    sessionRead(() => undefined),
    http.get(`*/api/invitations/${ID}`, () =>
      HttpResponse.json(getInvitation.success.body.parse(state)),
    ),
    ...companyRead({ role: 'admin', members: [] }),
  )
  return state
}
function open() {
  const conexus = createConexus(createMemoryHistory({ initialEntries: [ENTRY] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

for (const [state, text] of [
  ['EXPIRED', 'Este convite venceu.'],
  ['ACCEPTED', 'Este convite já foi usado.'],
  ['DECLINED', 'Este convite foi recusado.'],
  ['CANCELED', 'Este convite foi cancelado.'],
] as const) {
  test(`closed ${state} discloses no company or form`, async () => {
    hub({ kind: 'CLOSED', state })
    open()
    expect(await screen.findByRole('heading', { name: text })).toBeTruthy()
    expect(screen.queryByText(/Empresa Teste/)).toBeNull()
    expect(screen.queryByRole('button', { name: /convite|senha/ })).toBeNull()
  })
}

test('another session sees only its address and can sign out to read the invitation', async () => {
  const state = hub({ kind: 'OTHER', signedInAs: DAVI.email })
  server.use(
    http.delete('*/api/sessions/current', () => {
      state.invitation = { kind: 'NEW', email: DAVI.email, ...DETAILS }
      return new HttpResponse(null, { status: 204 })
    }),
  )
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Sair e abrir o convite' }))
  expect(await screen.findByLabelText('Nome')).toBeTruthy()
})

test('password confirmation waits for blur and success remains while session and invitation refresh', async () => {
  const state = hub({ kind: 'NEW', email: DAVI.email, ...DETAILS })
  const sent: unknown[] = []
  server.use(
    http.put(`*/api/invitations/${ID}/password`, async ({ request }) => {
      sent.push(await request.json())
      state.invitation = { kind: 'INVITED', ...DETAILS, revision: 1 }
      return new HttpResponse(null, { status: 204 })
    }),
  )
  open()
  fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: DAVI.name } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-nova-1' } })
  fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'diferente' } })
  expect(screen.queryByText('As senhas não são iguais.')).toBeNull()
  fireEvent.blur(screen.getByLabelText('Confirmar senha'))
  expect(await screen.findByText('As senhas não são iguais.')).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Confirmar senha'), { target: { value: 'senha-nova-1' } })
  fireEvent.blur(screen.getByLabelText('Confirmar senha'))
  fireEvent.click(screen.getByRole('button', { name: 'Criar senha' }))
  expect(await screen.findByText('Senha criada. Você já entrou.')).toBeTruthy()
  expect(await screen.findByRole('button', { name: 'Aceitar convite' })).toBeTruthy()
  expect(sent).toEqual([{ name: DAVI.name, password: 'senha-nova-1', revision: 0 }])
  expect(screen.queryByRole('alert')).toBeNull()
})

test('password refusal preserves entered fields', async () => {
  hub({ kind: 'NEW', email: DAVI.email, ...DETAILS })
  server.use(http.put(`*/api/invitations/${ID}/password`, () => refusal('DATABASE_UNAVAILABLE')))
  open()
  fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: DAVI.name } })
  for (const label of ['Senha', 'Confirmar senha'])
    fireEvent.change(screen.getByLabelText(label), { target: { value: 'senha-nova-1' } })
  fireEvent.click(screen.getByRole('button', { name: 'Criar senha' }))
  expect(await screen.findByRole('alert')).toBeTruthy()
  expect(screen.getByRole('textbox', { name: 'Nome' })).toHaveProperty('value', DAVI.name)
})

test('existing password offers sign-in with the invited address and return path', async () => {
  hub({ kind: 'HAS_PASSWORD', email: DAVI.email, ...DETAILS })
  const router = open()
  fireEvent.click(await screen.findByRole('link', { name: 'Entrar' }))
  expect(await screen.findByLabelText('E-mail')).toHaveProperty('value', DAVI.email)
  expect(router.state.location.search).toEqual({ redirect: ENTRY })
})

test('declination is public, sends its revision and stays on the closed link', async () => {
  const state = hub({ kind: 'NEW', email: DAVI.email, ...DETAILS })
  const sent: unknown[] = []
  server.use(
    http.put(`*/api/invitations/${ID}/declination`, async ({ request }) => {
      sent.push(await request.json())
      state.invitation = { kind: 'CLOSED', state: 'DECLINED' }
      return new HttpResponse(null, { status: 204 })
    }),
  )
  const router = open()
  fireEvent.click(await screen.findByRole('button', { name: 'Recusar convite' }))
  expect(await screen.findByRole('heading', { name: 'Este convite foi recusado.' })).toBeTruthy()
  expect(sent).toEqual([{ revision: 0 }])
  expect(router.state.location.pathname).toBe(ENTRY)
})

test('acceptance is explicit and sends its revision before opening the company', async () => {
  hub({ kind: 'INVITED', ...DETAILS })
  const sent: unknown[] = []
  server.use(
    sessionRead(() => DAVI),
    http.put(`*/api/invitations/${ID}/acceptance`, async ({ request }) => {
      sent.push(await request.json())
      return HttpResponse.json(acceptInvitation.success.body.parse({ company: COMPANY }))
    }),
  )
  const router = open()
  fireEvent.click(await screen.findByRole('button', { name: 'Aceitar convite' }))
  await waitFor(() => expect(router.state.location.pathname).toBe(`/companies/${COMPANY.id}`))
  expect(sent).toEqual([{ revision: 0 }])
})

test('acceptance refusal preserves its actions and shows the company-capacity failure', async () => {
  hub({ kind: 'INVITED', ...DETAILS })
  server.use(http.put(`*/api/invitations/${ID}/acceptance`, () => refusal('COMPANY_FULL')))
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Aceitar convite' }))
  expect((await screen.findByRole('alert')).textContent).toBe(
    'A empresa já tem 100 pessoas. Fale com quem convidou você.',
  )
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Aceitar convite' }).hasAttribute('disabled')).toBe(
      false,
    ),
  )
})

test('unknown and malformed links show the common not-found page without invitation actions', async () => {
  hub({ kind: 'NEW', email: DAVI.email, ...DETAILS })
  server.use(http.get(`*/api/invitations/${ID}`, () => refusal('NOT_FOUND')))
  const conexus = createConexus(createMemoryHistory({ initialEntries: [ENTRY] }))
  render(<Conexus conexus={conexus} />)
  expect(await screen.findByRole('heading', { name: FAILURES.NOT_FOUND.phrase })).toBeTruthy()
  await conexus.router.navigate({ href: '/invitations/short' })
  expect(await screen.findByRole('heading', { name: FAILURES.NOT_FOUND.phrase })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Criar senha' })).toBeNull()
})

test('acceptance does not flash the joined invitation while the company is still loading', async () => {
  const state = hub({ kind: 'INVITED', ...DETAILS })
  let accepted = false
  let release: () => void = () => undefined
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  server.use(
    sessionRead(() => DAVI),
    http.put(`*/api/invitations/${ID}/acceptance`, () => {
      accepted = true
      state.invitation = { kind: 'JOINED', company: COMPANY }
      return HttpResponse.json(acceptInvitation.success.body.parse({ company: COMPANY }))
    }),
    http.get(`*/api/companies/${COMPANY.id}`, async () => {
      await held
      return HttpResponse.json(
        getCompany.success.body.parse({ company: COMPANY, role: 'admin', mayInviteAs: [] }),
      )
    }),
  )
  open()
  const button = await screen.findByRole('button', { name: 'Aceitar convite' })
  let flashed = false
  const watch = new MutationObserver(() => {
    flashed ||= document.body.textContent?.includes('Você já faz parte') === true
  })
  watch.observe(document.body, { childList: true, subtree: true, characterData: true })
  try {
    fireEvent.click(button)
    await waitFor(() => expect(accepted).toBe(true))
    expect(screen.getByRole('button', { name: 'Aceitando…' })).toBeTruthy()
    release()
    expect(await screen.findByRole('heading', { name: COMPANY.name })).toBeTruthy()
    expect(flashed).toBe(false)
  } finally {
    release()
    watch.disconnect()
  }
})

test('a current member opens the joined company without accepting again', async () => {
  hub({ kind: 'JOINED', company: COMPANY })
  open()
  expect(await screen.findByRole('link', { name: 'Abrir empresa' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Aceitar convite' })).toBeNull()
})
