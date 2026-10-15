import {
  createInvitation,
  FAILURES,
  getCompany,
  listInvitations,
  listMembers,
  Problem,
  SessionState,
} from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'

const ANA = { id: 'person-ana', name: 'Ana Lima', email: 'ana@example.test' }
const COMPANY = { id: 'a'.repeat(32), name: 'Empresa Teste' }
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function refusal(code: keyof typeof FAILURES) {
  const row = FAILURES[code]
  const body = Problem.parse({
    type: `urn:conexus:problem:${code}`,
    title: row.phrase,
    status: row.status,
    code,
    traceId: 'a1b2c3',
  })
  return HttpResponse.json(body, { status: row.status })
}

function accepted(email: string, role: string) {
  const invitation = { id: 'i'.repeat(32), email, role, expiresAt: '2026-10-17T12:00:00.000Z' }
  return HttpResponse.json(createInvitation.success.body.parse({ invitation }), { status: 201 })
}

type Sent = { key: string | null; body: unknown }

/** The Hub as a person of Empresa Teste sees it; `answer` replies to each invitation written. */
function hub(mayInviteAs: string[], answer: (body: Sent) => Response) {
  const sent: Sent[] = []
  server.use(
    http.get('*/api/sessions/current', () =>
      HttpResponse.json(SessionState.parse({ state: 'SIGNED_IN', person: ANA })),
    ),
    http.get(`*/api/companies/${COMPANY.id}`, () =>
      HttpResponse.json(
        getCompany.success.body.parse({ company: COMPANY, role: 'owner', mayInviteAs }),
      ),
    ),
    http.get(`*/api/companies/${COMPANY.id}/members`, () =>
      HttpResponse.json(listMembers.success.body.parse({ members: [], next: { kind: 'END' } })),
    ),
    http.get(`*/api/companies/${COMPANY.id}/invitations`, () =>
      HttpResponse.json(
        listInvitations.success.body.parse({ invitations: [], next: { kind: 'END' } }),
      ),
    ),
    http.post(`*/api/companies/${COMPANY.id}/invitations`, async ({ request }) => {
      const one = { key: request.headers.get('idempotency-key'), body: await request.json() }
      sent.push(one)
      return answer(one)
    }),
  )
  return sent
}

async function open() {
  const conexus = createConexus(
    createMemoryHistory({ initialEntries: [`/companies/${COMPANY.id}`] }),
  )
  render(<Conexus conexus={conexus} />)
  return {
    email: await screen.findByLabelText('E-mail'),
    role: await screen.findByLabelText('Papel'),
  }
}

async function choose(role: string) {
  fireEvent.click(await screen.findByLabelText('Papel'))
  const option = await screen.findByRole('option', { name: role })
  fireEvent.pointerDown(option)
  fireEvent.mouseDown(option)
  fireEvent.pointerUp(option)
  fireEvent.mouseUp(option)
  fireEvent.click(option)
}

function send() {
  fireEvent.click(screen.getByRole('button', { name: 'Enviar convite' }))
}

test('o dono escolhe entre os três papéis; o administrador, entre dois', async () => {
  hub(['owner', 'admin', 'member'], () => refusal('INTERNAL_UNEXPECTED'))
  const { role } = await open()
  fireEvent.click(role)
  expect((await screen.findAllByRole('option')).map((option) => option.textContent)).toEqual([
    'Dono',
    'Administrador',
    'Membro',
  ])
})

test('o administrador só vê Administrador e Membro, e começa no menos privilegiado', async () => {
  hub(['admin', 'member'], () => refusal('INTERNAL_UNEXPECTED'))
  const { role } = await open()
  expect(role.textContent).toBe('Membro')
  fireEvent.click(role)
  expect((await screen.findAllByRole('option')).map((option) => option.textContent)).toEqual([
    'Administrador',
    'Membro',
  ])
})

test('201: "Convite enviado para {e-mail}.", o formulário limpo e o pedido com e-mail, papel e chave', async () => {
  const sent = hub(['owner', 'admin', 'member'], () => accepted('davi@example.test', 'admin'))
  const { email } = await open()
  fireEvent.change(email, { target: { value: 'davi@example.test' } })
  await choose('Administrador')
  send()
  expect((await screen.findByRole('status')).textContent).toBe(
    'Convite enviado para davi@example.test.',
  )
  expect(sent.map((one) => one.body)).toEqual([{ email: 'davi@example.test', role: 'admin' }])
  expect(sent[0]?.key).toMatch(/^[0-9a-f-]{36}$/)
  await waitFor(() => expect(screen.getByLabelText('E-mail')).toHaveProperty('value', ''))
})

test('e-mail inválido: o erro no campo e nenhum pedido', async () => {
  const sent = hub(['admin', 'member'], () => accepted('x@example.test', 'member'))
  const { email } = await open()
  fireEvent.change(email, { target: { value: 'sem-arroba' } })
  send()
  expect(await screen.findByText('Escreva um e-mail.')).toBeTruthy()
  expect(email.getAttribute('aria-invalid')).toBe('true')
  expect(sent).toEqual([])
})

test('409 MEMBER_EXISTS: a frase fica no campo do e-mail', async () => {
  hub(['admin', 'member'], () => refusal('MEMBER_EXISTS'))
  const { email } = await open()
  fireEvent.change(email, { target: { value: 'davi@example.test' } })
  send()
  expect(await screen.findByText('Essa pessoa já está na empresa.')).toBeTruthy()
  expect(email.getAttribute('aria-invalid')).toBe('true')
})

test('403 INVITATION_ROLE_REFUSED: a frase fica no campo do papel', async () => {
  hub(['admin', 'member'], () => refusal('INVITATION_ROLE_REFUSED'))
  const { email, role } = await open()
  fireEvent.change(email, { target: { value: 'davi@example.test' } })
  send()
  expect(await screen.findByText('Você não pode convidar com esse papel.')).toBeTruthy()
  expect(role.getAttribute('aria-invalid')).toBe('true')
  expect(email.getAttribute('aria-invalid')).toBeNull()
})

test('502 MAIL_UNAVAILABLE: a frase fica no formulário, e o aviso de envio não aparece', async () => {
  hub(['admin', 'member'], () => refusal('MAIL_UNAVAILABLE'))
  const { email } = await open()
  fireEvent.change(email, { target: { value: 'davi@example.test' } })
  send()
  expect((await screen.findByRole('alert')).textContent).toBe(
    'O e-mail não pôde ser enviado agora. Tente de novo daqui a pouco.',
  )
  expect(screen.queryByRole('status')).toBeNull()
})
