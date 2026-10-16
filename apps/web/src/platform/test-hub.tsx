import type { FailureCode } from '@conexus/hub-api'
import { FAILURES, getCompany, listCompanies, listMembers, SessionState } from '@conexus/hub-api'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { ANA, COMPANY, problemOf } from './fixtures.ts'

export const NO_COMPANIES = listCompanies.success.body.parse({
  companies: [],
  mayCreate: false,
  next: { kind: 'END' },
})
export const STATUS = {
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

/** The company page's reads: the company as `role` sees it, and its members. */
export function companyRead(view: {
  role: string
  mayInviteAs?: string[]
  members?: { personId: string; name: string; email: string; role: string }[]
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

/** The Hub as a test sees it: no request goes unanswered, and each test starts with no handler. */
export function hubServer() {
  const server = setupServer()
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())
  return server
}

/** The Hub's refusal for a failure code, as the server sends it. */
export function refusal(code: FailureCode) {
  return HttpResponse.json(problemOf(code), {
    status: FAILURES[code].status,
    headers: { 'content-type': 'application/problem+json' },
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
