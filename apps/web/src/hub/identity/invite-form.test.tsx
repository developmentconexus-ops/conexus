import { createInvitation, FAILURES, listInvitations } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import {
  ANA,
  COMPANY,
  companyRead,
  hubServer,
  refusal,
  sessionRead,
  undecided,
} from '../../platform/test-hub.tsx'

const server = hubServer()

function accepted(email: string, role: string) {
  const invitation = { id: 'i'.repeat(32), email, role, expiresAt: '2026-10-17T12:00:00.000Z' }
  return HttpResponse.json(createInvitation.success.body.parse({ invitation }), { status: 201 })
}

const UNDECIDED = undecided('{"invitation":{"id":"iii')

type Sent = { key: string | null; body: unknown }

/** The Hub as a person of Empresa Teste sees it; `answer` replies to each invitation written. */
function hub(
  mayInviteAs: string[],
  answer: (body: Sent) => Response,
  listed: { id: string; email: string; role: string; expiresAt: string }[] = [],
) {
  const sent: Sent[] = []
  server.use(
    sessionRead(() => ANA),
    ...companyRead({ role: 'owner', mayInviteAs }),
    http.get(`*/api/companies/${COMPANY.id}/invitations`, () =>
      HttpResponse.json(
        listInvitations.success.body.parse({ invitations: listed, next: { kind: 'END' } }),
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

test('começa no menos privilegiado mesmo que o Hub liste os papéis em outra ordem', async () => {
  hub(['member', 'owner', 'admin'], () => refusal('INTERNAL_UNEXPECTED'))
  const { role } = await open()
  expect(role.textContent).toBe('Membro')
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
  const sentence = screen.getByRole('alert')
  expect(sentence.textContent).toBe('Você não pode convidar com esse papel.')
  expect(role.getAttribute('aria-describedby')).toBe(sentence.id)
  expect(sentence.id).not.toBe('')
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

for (const [name, reply] of UNDECIDED) {
  test(`${name}: a nova tentativa leva a mesma chave`, async () => {
    let calls = 0
    const sent = hub(['admin', 'member'], () =>
      ++calls === 1 ? reply() : accepted('davi@example.test', 'member'),
    )
    const { email } = await open()
    fireEvent.change(email, { target: { value: 'davi@example.test' } })
    send()
    await screen.findByRole('alert')
    send()
    await screen.findByRole('status')
    expect(sent.length).toBe(2)
    expect(sent[1]?.key).toBe(sent[0]?.key)
  })
}

test('502 MAIL_UNAVAILABLE: o convite foi gravado, então a nova tentativa leva outra chave', async () => {
  let calls = 0
  const sent = hub(['admin', 'member'], () =>
    ++calls === 1 ? refusal('MAIL_UNAVAILABLE') : accepted('davi@example.test', 'member'),
  )
  const { email } = await open()
  fireEvent.change(email, { target: { value: 'davi@example.test' } })
  send()
  await screen.findByRole('alert')
  send()
  await screen.findByRole('status')
  expect(sent[1]?.key).not.toBe(sent[0]?.key)
})

const PENDING_LIST = /^Convites pendentes$/

test('201: a lista de convites pendentes mostra o convite sem recarregar a página', async () => {
  const listed: Parameters<typeof hub>[2] = []
  hub(
    ['admin', 'member'],
    () => {
      listed.push({
        id: 'i'.repeat(32),
        email: 'davi@example.test',
        role: 'member',
        expiresAt: '2026-10-17T12:00:00.000Z',
      })
      return accepted('davi@example.test', 'member')
    },
    listed,
  )
  const { email } = await open()
  await screen.findByRole('heading', { name: PENDING_LIST })
  expect(screen.getByText('Nenhum convite pendente.')).toBeTruthy()
  fireEvent.change(email, { target: { value: 'davi@example.test' } })
  send()
  await screen.findByRole('status')
  expect(await screen.findByText('davi@example.test', { selector: 'span' })).toBeTruthy()
  expect(screen.queryByText('Nenhum convite pendente.')).toBeNull()
})

for (const code of ['MAIL_UNAVAILABLE', 'MAIL_BOUNCED'] as const) {
  test(`${code}: o convite ficou gravado, então a lista de convites pendentes o mostra`, async () => {
    const listed: Parameters<typeof hub>[2] = []
    hub(
      ['admin', 'member'],
      () => {
        listed.push({
          id: 'i'.repeat(32),
          email: 'davi@example.test',
          role: 'member',
          expiresAt: '2026-10-17T12:00:00.000Z',
        })
        return refusal(code)
      },
      listed,
    )
    const { email } = await open()
    await screen.findByText('Nenhum convite pendente.')
    fireEvent.change(email, { target: { value: 'davi@example.test' } })
    send()
    await screen.findByText(FAILURES[code].phrase, { exact: false })
    expect(await screen.findByText('davi@example.test', { selector: 'span' })).toBeTruthy()
  })
}
