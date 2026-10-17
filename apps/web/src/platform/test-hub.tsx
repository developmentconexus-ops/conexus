import type { FailureCode, Member as MemberRow } from '@conexus/hub-api'
import {
  Client,
  FAILURES,
  getCompany,
  listCompanies,
  listInvitations,
  listMembers,
  Member,
  PROBLEM_MEDIA_TYPE,
  SessionState,
} from '@conexus/hub-api'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { ANA, COMPANY, problemOf } from './fixtures.ts'

export const NO_COMPANIES = listCompanies.success.body.parse({
  companies: [],
  mayOperate: false,
  next: { kind: 'END' },
})
const STATUS = {
  version: 'v0.1.0',
  lastStart: { state: 'NONE' },
  previousStart: { state: 'NONE' },
} as const

/** The session read: the person `signedIn` returns, or nobody when it returns undefined. */
export function sessionRead(signedIn: () => typeof ANA | undefined) {
  return http.get('*/api/sessions/current', () => {
    const person = signedIn()
    return HttpResponse.json(
      SessionState.parse(person ? { state: 'SIGNED_IN', person } : { state: 'SIGNED_OUT' }),
    )
  })
}

type MemberFields = {
  personId: string
  name: string
  email: string
  role: MemberRow['role']
} & Partial<Pick<MemberRow, 'mayRemove' | 'mayChangeTo' | 'invitationsSent'>>

/** A person of a company as the Hub lists them: nothing to do to them unless the test says so. */
export function memberView(person: MemberFields) {
  return Member.parse({ mayRemove: false, mayChangeTo: [], invitationsSent: 0, ...person })
}

/** The company page's reads: the company as `role` sees it, and its members. */
export function companyRead(view: {
  role: string
  mayInviteAs?: string[]
  members?: MemberFields[]
}) {
  return [
    http.get(`*/api/companies/${COMPANY.id}`, () =>
      HttpResponse.json(
        getCompany.success.body.parse({
          company: COMPANY,
          role: view.role,
          mayInviteAs: view.mayInviteAs ?? [],
        }),
      ),
    ),
    http.get(`*/api/companies/${COMPANY.id}/members`, () =>
      HttpResponse.json(
        listMembers.success.body.parse({ members: view.members ?? [], next: { kind: 'END' } }),
      ),
    ),
  ]
}

/**
 * The Hub a person lands on after signing in as Ana: the session (signing in sets `state`), the
 * status and the company list, which `onCompaniesRead` sees with its query string.
 */
export function homeHub(
  state: { signedIn: boolean },
  companies: unknown = NO_COMPANIES,
  onCompaniesRead: (search: string) => void = () => undefined,
) {
  return [
    sessionRead(() => (state.signedIn ? ANA : undefined)),
    http.put('*/api/sessions/current', () => {
      state.signedIn = true
      return HttpResponse.json({ person: ANA })
    }),
    http.get('*/api/status', () => HttpResponse.json(STATUS)),
    http.get('*/api/companies', ({ request }) => {
      onCompaniesRead(new URL(request.url).search)
      return HttpResponse.json(listCompanies.success.body.parse(companies))
    }),
  ]
}

const COMPANY_ID = 'b'.repeat(32)

/** A client of the Central awaiting its administrator, its owner invitation in `state`. */
export function awaitingClient(state: 'PENDING' | 'EXPIRED' | 'DECLINED' | 'CANCELED' = 'PENDING') {
  return Client.parse({
    companyId: COMPANY_ID,
    cnpj: '12ABC34501DE35',
    legalName: 'Empresa Teste Ltda',
    name: 'Empresa Teste',
    registeredAt: '2026-10-16T12:00:00.000Z',
    revision: 0,
    state: {
      kind: 'AWAITING_OWNER',
      ownerInvitation: {
        id: 'c'.repeat(32),
        email: 'davi@example.test',
        state,
        expiresAt: '2026-10-18T12:00:00.000Z',
        revision: 0,
      },
    },
  })
}

export const ACTIVE_CLIENT = Client.parse({
  ...awaitingClient(),
  state: {
    kind: 'ACTIVE',
    activeSince: '2026-10-17T12:00:00.000Z',
    owners: [{ name: 'Davi Costa', email: 'davi@example.test' }],
  },
})

/** The Hub as the operator sees it: the Central's list and each client of it. */
export function centralHub(clients: Client[]) {
  return [
    ...homeHub({ signedIn: true }, { ...NO_COMPANIES, mayOperate: true }),
    http.get('*/api/clients', () => HttpResponse.json({ clients, next: { kind: 'END' } })),
    http.get('*/api/clients/:companyId', ({ params }) => {
      const client = clients.find((one) => one.companyId === params.companyId)
      return client ? HttpResponse.json({ client }) : refusal('NOT_FOUND')
    }),
    http.get(`*/api/companies/:companyId/members`, () =>
      HttpResponse.json(
        listMembers.success.body.parse({
          members: [
            memberView({
              personId: 'person-davi',
              name: 'Davi Costa',
              email: 'davi@example.test',
              role: 'owner',
              mayRemove: true,
              mayChangeTo: ['admin', 'member'],
            }),
          ],
          next: { kind: 'END' },
        }),
      ),
    ),
    http.get(`*/api/companies/:companyId/invitations`, () =>
      HttpResponse.json(
        listInvitations.success.body.parse({ invitations: [], next: { kind: 'END' } }),
      ),
    ),
  ]
}

/**
 * The Hub as a test sees it: no request goes unanswered, and each test starts with nobody signed in
 * and no company, which the account menu reads on every page of the frame.
 */
export function hubServer() {
  const server = setupServer(
    sessionRead(() => undefined),
    http.get('*/api/companies', () => HttpResponse.json(NO_COMPANIES)),
  )
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())
  return server
}

/** The Hub's refusal for a failure code, as the server sends it. */
export function refusal(code: FailureCode) {
  return HttpResponse.json(problemOf(code), {
    status: FAILURES[code].status,
    headers: { 'content-type': PROBLEM_MEDIA_TYPE },
  })
}

function edgePage(status: number) {
  return new HttpResponse('<html><body>Gateway</body></html>', {
    status,
    headers: { 'content-type': 'text/html' },
  })
}

/**
 * Replies after which the browser cannot tell whether the Hub acted: the key stays (code C37, web
 * W24). `cut` is the start of a write's success body, cut off.
 */
export function undecided(cut: string): [string, () => Response][] {
  return [
    ['resposta cortada', () => new HttpResponse(cut, { status: 201 })],
    ['502 da borda', () => edgePage(502)],
    ['504 da borda', () => edgePage(504)],
    ['banco sem resposta', () => refusal('DATABASE_UNAVAILABLE')],
  ]
}
