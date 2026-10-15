import {
  FAILURES,
  getCompany,
  listInvitations,
  listMembers,
  Problem,
  SessionState,
} from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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

const DAVI = { personId: 'person-davi', name: 'Davi Costa', email: 'davi@example.test' }
const PENDING = {
  id: 'p'.repeat(32),
  email: 'bia@example.test',
  role: 'admin',
  expiresAt: '2026-10-17T12:00:00.000Z',
}

type View = {
  role: string
  mayInviteAs: string[]
  membersNext?: unknown
  invitations?: (typeof PENDING)[]
}

/** The Hub as one person of the company sees it; each list read is recorded by its query string. */
function hub(view: View) {
  const reads: string[] = []
  server.use(
    http.get('*/api/sessions/current', () =>
      HttpResponse.json(SessionState.parse({ state: 'SIGNED_IN', person: ANA })),
    ),
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
  )
  return reads
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
    'bia@example.testAdministrador',
  ])
  expect(screen.getByRole('heading', { name: 'Convidar pessoa' })).toBeTruthy()
})

test('membro: só as pessoas; sem convites pendentes, sem formulário e sem pedir a lista de convites', async () => {
  const reads = hub({ role: 'member', mayInviteAs: [] })
  open()
  expect(await screen.findByRole('heading', { name: 'Pessoas' })).toBeTruthy()
  expect(screen.queryByRole('heading', { name: 'Convites pendentes' })).toBeNull()
  expect(screen.queryByRole('heading', { name: 'Convidar pessoa' })).toBeNull()
  expect(reads).toEqual(['members'])
})

test('a página dos membros fica no endereço: "Ver mais" pede a que segue', async () => {
  const reads = hub({
    role: 'owner',
    mayInviteAs: ['admin'],
    membersNext: { kind: 'MORE', page: 'm'.repeat(32) },
  })
  const router = open()
  fireEvent.click(await screen.findByRole('link', { name: 'Ver mais' }))
  await waitFor(() => expect(router.state.location.search).toEqual({ members: 'm'.repeat(32) }))
  expect(await screen.findByRole('link', { name: 'Primeira página' })).toBeTruthy()
  expect(reads).toContain(`members?page=${'m'.repeat(32)}`)
})

test('um id que não tem 32 letras e dígitos: a frase de "não encontrado"', async () => {
  const conexus = createConexus(createMemoryHistory({ initialEntries: ['/companies/curto'] }))
  server.use(
    http.get('*/api/sessions/current', () =>
      HttpResponse.json(SessionState.parse({ state: 'SIGNED_IN', person: ANA })),
    ),
  )
  render(<Conexus conexus={conexus} />)
  expect(await screen.findByText(/Não encontramos o que você procurou/)).toBeTruthy()
})

test('uma empresa que o Hub responde 404: a página de "não encontrado", não a de erro', async () => {
  server.use(
    http.get('*/api/sessions/current', () =>
      HttpResponse.json(SessionState.parse({ state: 'SIGNED_IN', person: ANA })),
    ),
    http.get(`*/api/companies/${COMPANY.id}`, () =>
      HttpResponse.json(
        Problem.parse({
          type: 'urn:conexus:problem:NOT_FOUND',
          title: FAILURES.NOT_FOUND.phrase,
          status: 404,
          code: 'NOT_FOUND',
          traceId: 'a1b2c3',
        }),
        { status: 404 },
      ),
    ),
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
