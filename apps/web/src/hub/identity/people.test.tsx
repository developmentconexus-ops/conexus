import {
  cancelInvitation,
  createInvitation,
  FAILURES,
  getCompany,
  listInvitations,
  listMembers,
  renewInvitation,
} from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal, sessionRead } from '../../platform/test-hub.tsx'

const server = hubServer()

const DAVI = { personId: 'person-davi', name: 'Davi Costa', email: 'davi@example.test' }
const PENDING = {
  id: 'p'.repeat(32),
  email: 'bia@example.test',
  role: 'admin',
  expiresAt: '2026-10-17T12:00:00.000Z',
  revision: 0,
  state: 'PENDING',
}
const EXPIRED = {
  id: 'e'.repeat(32),
  email: 'eva@example.test',
  role: 'member',
  expiresAt: '2026-10-14T12:00:00.000Z',
  revision: 0,
  state: 'EXPIRED',
}

type View = {
  role: string
  mayInviteAs: string[]
  membersNext?: unknown
  invitations?: (typeof PENDING)[]
  answer?: () => Response
}

/**
 * The Hub as one person of the company sees it; each list read is recorded by its query string,
 * each invitation written by its key and body.
 */
function hub(view: View) {
  const reads: string[] = []
  const sent: { key: string | null; body: unknown }[] = []
  server.use(
    sessionRead(() => ANA),
    http.get(`*/api/companies/${COMPANY.id}`, () =>
      HttpResponse.json(
        getCompany.success.body.parse({
          company: COMPANY,
          role: view.role,
          mayInviteAs: view.mayInviteAs,
        }),
      ),
    ),
    http.get(`*/api/companies/${COMPANY.id}/members`, ({ request }) => {
      reads.push(`members${new URL(request.url).search}`)
      return HttpResponse.json(
        listMembers.success.body.parse({
          members: [
            { personId: ANA.id, name: ANA.name, email: ANA.email, role: 'owner' },
            { ...DAVI, role: 'member' },
          ],
          next: view.membersNext ?? { kind: 'END' },
        }),
      )
    }),
    http.get(`*/api/companies/${COMPANY.id}/invitations`, ({ request }) => {
      reads.push(`invitations${new URL(request.url).search}`)
      return HttpResponse.json(
        listInvitations.success.body.parse({
          invitations: view.invitations ?? [PENDING],
          next: { kind: 'END' },
        }),
      )
    }),
    http.post(`*/api/companies/${COMPANY.id}/invitations`, async ({ request }) => {
      sent.push({ key: request.headers.get('idempotency-key'), body: await request.json() })
      return view.answer?.() ?? refusal('INTERNAL_UNEXPECTED')
    }),
  )
  return { reads, sent }
}

function sectionOf(heading: HTMLElement): HTMLElement {
  const section = heading.closest('section')
  if (section === null) throw new Error('the heading sits in no section')
  return section
}

function open(search = '') {
  const conexus = createConexus(
    createMemoryHistory({ initialEntries: [`/companies/${COMPANY.id}${search}`] }),
  )
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

test('dono: os membros com o papel, os convites pendentes e o formulário "Convidar pessoa"', async () => {
  hub({ role: 'owner', mayInviteAs: ['owner', 'admin', 'member'] })
  open()
  expect(await screen.findByRole('heading', { name: 'Empresa Teste' })).toBeTruthy()
  const people = within(sectionOf(screen.getByRole('heading', { name: 'Pessoas' })))
  expect(people.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
    'Ana Limaana@example.testDono',
    'Davi Costadavi@example.testMembro',
  ])
  const pending = within(
    sectionOf(await screen.findByRole('heading', { name: 'Convites pendentes' })),
  )
  expect(pending.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
    'bia@example.testVence em 17/10/2026, 09:00AdministradorReenviarCancelar',
  ])
  expect(screen.getByRole('heading', { name: 'Convidar pessoa' })).toBeTruthy()
})

test('membro: só as pessoas; sem convites pendentes, sem formulário e sem pedir a lista de convites', async () => {
  const { reads } = hub({ role: 'member', mayInviteAs: [] })
  open()
  expect(await screen.findByRole('heading', { name: 'Pessoas' })).toBeTruthy()
  expect(screen.queryByRole('heading', { name: 'Convites pendentes' })).toBeNull()
  expect(screen.queryByRole('heading', { name: 'Convidar pessoa' })).toBeNull()
  expect(reads).toEqual(['members'])
})

test('a página dos membros fica no endereço: "Ver mais" pede a que segue', async () => {
  const { reads } = hub({
    role: 'owner',
    mayInviteAs: ['admin'],
    membersNext: { kind: 'MORE', page: 'm'.repeat(32) },
  })
  const router = open()
  fireEvent.click(await screen.findByRole('link', { name: 'Ver mais: Pessoas' }))
  await waitFor(() => expect(router.state.location.search).toEqual({ members: 'm'.repeat(32) }))
  expect(await screen.findByRole('link', { name: 'Primeira página: Pessoas' })).toBeTruthy()
  expect(reads).toContain(`members?page=${'m'.repeat(32)}`)
})

test('um id que não tem 32 letras e dígitos: a frase de "não encontrado"', async () => {
  const conexus = createConexus(createMemoryHistory({ initialEntries: ['/companies/curto'] }))
  server.use(sessionRead(() => ANA))
  render(<Conexus conexus={conexus} />)
  expect(await screen.findByText(/Não encontramos o que você procurou/)).toBeTruthy()
})

test('/companies/new, a página que criava empresa, não existe mais: a frase de "não encontrado"', async () => {
  const conexus = createConexus(createMemoryHistory({ initialEntries: ['/companies/new'] }))
  server.use(sessionRead(() => ANA))
  render(<Conexus conexus={conexus} />)
  expect(await screen.findByText(/Não encontramos o que você procurou/)).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Criar empresa' })).toBeNull()
})

test('uma empresa que o Hub responde 404: a página de "não encontrado", não a de erro', async () => {
  server.use(
    sessionRead(() => ANA),
    http.get(`*/api/companies/${COMPANY.id}`, () => refusal('NOT_FOUND')),
  )
  open()
  expect(await screen.findByRole('heading', { name: FAILURES.NOT_FOUND.phrase })).toBeTruthy()
  expect(screen.queryByText('Não foi possível abrir o Conexus')).toBeNull()
})

test('sem convites pendentes: a frase "Nenhum convite pendente."', async () => {
  hub({ role: 'owner', mayInviteAs: ['admin'], invitations: [] })
  open()
  const pending = within(
    sectionOf(await screen.findByRole('heading', { name: 'Convites pendentes' })),
  )
  expect(pending.getByText('Nenhum convite pendente.')).toBeTruthy()
  expect(pending.queryAllByRole('listitem')).toEqual([])
})

test('convites: o vivo diz "Vence em" com dia e hora no fuso de quem lê; o vencido diz "Vencido" e oferece "Convidar de novo"', async () => {
  hub({ role: 'owner', mayInviteAs: ['admin', 'member'], invitations: [PENDING, EXPIRED] })
  open()
  const pending = within(
    sectionOf(await screen.findByRole('heading', { name: 'Convites pendentes' })),
  )
  expect(pending.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
    'bia@example.testVence em 17/10/2026, 09:00AdministradorReenviarCancelar',
    'eva@example.testVencidoMembroReenviarCancelar',
  ])
  expect(pending.getAllByRole('button').map((button) => button.textContent)).toEqual([
    'Reenviar',
    'Cancelar',
    'Reenviar',
    'Cancelar',
  ])
})

test('"Convidar de novo" manda o mesmo e-mail e papel com uma chave de tentativa, e a lista é lida de novo', async () => {
  const { reads, sent } = hub({
    role: 'owner',
    mayInviteAs: ['admin', 'member'],
    invitations: [EXPIRED],
    answer: () =>
      HttpResponse.json(
        createInvitation.success.body.parse({
          invitation: {
            ...EXPIRED,
            state: 'PENDING',
            id: 'n'.repeat(32),
            expiresAt: '2026-10-18T12:00:00.000Z',
          },
        }),
        { status: 201 },
      ),
  })
  open()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Reenviar convite para eva@example.test' }),
  )
  // The two lists are read side by side, in no set order: each is read once more after the send.
  await waitFor(() => expect(reads.length).toBe(4))
  expect([reads.slice(0, 2).sort(), reads.slice(2).sort()]).toEqual([
    ['invitations', 'members'],
    ['invitations', 'members'],
  ])
  expect(sent.map(({ body }) => body)).toEqual([
    { email: 'eva@example.test', role: 'member', replaces: { id: EXPIRED.id, revision: 0 } },
  ])
  expect(sent[0]?.key).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  )
})

test('"Convidar de novo" recusado: a frase da recusa na linha do convite', async () => {
  hub({
    role: 'owner',
    mayInviteAs: ['admin', 'member'],
    invitations: [EXPIRED],
    answer: () => refusal('MEMBER_EXISTS'),
  })
  open()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Reenviar convite para eva@example.test' }),
  )
  const row = within((await screen.findByRole('alert')).closest('li') ?? document.body)
  expect(row.getByRole('alert').textContent).toBe('Essa pessoa já está na empresa.')
  expect(row.getByText('eva@example.test')).toBeTruthy()
})

test('live invitation renews with its revision; cancellation requires the exact email and preserves a refusal', async () => {
  const calls: unknown[] = []
  hub({ role: 'owner', mayInviteAs: ['admin'], invitations: [PENDING] })
  server.use(
    http.put(`*/api/companies/${COMPANY.id}/invitations/${PENDING.id}`, async ({ request }) => {
      calls.push(renewInvitation.input.body.parse(await request.json()))
      return HttpResponse.json(
        renewInvitation.success.body.parse({ invitation: { ...PENDING, revision: 1 } }),
      )
    }),
    http.delete(`*/api/companies/${COMPANY.id}/invitations/${PENDING.id}`, async ({ request }) => {
      calls.push(cancelInvitation.input.body.parse(await request.json()))
      return refusal('INVITATION_STALE')
    }),
  )
  open()
  fireEvent.click(
    await screen.findByRole('button', { name: 'Reenviar convite para bia@example.test' }),
  )
  await waitFor(() => expect(calls).toEqual([{ revision: 0 }]))
  fireEvent.click(
    await screen.findByRole('button', { name: 'Cancelar convite para bia@example.test' }),
  )
  const confirmName = `Confirmar cancelamento de convite para ${PENDING.email}`
  fireEvent.click(screen.getByRole('button', { name: confirmName }))
  expect(await screen.findByText('Digite o e-mail do convite.')).toBeTruthy()
  expect(calls).toHaveLength(1)
  fireEvent.change(screen.getByLabelText('Confirmar e-mail'), { target: { value: PENDING.email } })
  fireEvent.click(screen.getByRole('button', { name: confirmName }))
  expect(await screen.findByText('Este convite mudou. Recarregue a página.')).toBeTruthy()
  expect(screen.getByLabelText('Confirmar e-mail')).toHaveProperty('value', PENDING.email)
  expect(calls).toEqual([{ revision: 0 }, { revision: 0 }])
})
