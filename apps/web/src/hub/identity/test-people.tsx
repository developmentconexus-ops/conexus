import { getCompany, listInvitations, listMembers, listProjects } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import type { within } from '@testing-library/react'
import { render } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { hubServer, memberView, refusal, sessionRead } from '../../platform/test-hub.tsx'
import { companyAppAccessRead } from '../../platform/test-hub-access.tsx'

export const server = hubServer()

const DAVI = { personId: 'person-davi', name: 'Davi Costa', email: 'davi@example.test' }
export const PENDING = {
  id: 'p'.repeat(32),
  email: 'bia@example.test',
  role: 'admin',
  expiresAt: '2026-10-17T12:00:00.000Z',
  revision: 0,
  state: 'PENDING',
}
export const EXPIRED = {
  id: 'e'.repeat(32),
  email: 'eva@example.test',
  role: 'member',
  expiresAt: '2026-10-14T12:00:00.000Z',
  revision: 0,
  state: 'EXPIRED',
}

export type View = {
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
export function hub(view: View) {
  const reads: string[] = []
  const sent: { key: string | null; body: unknown }[] = []
  server.use(
    sessionRead(() => ANA),
    companyAppAccessRead(undefined, view.role !== 'member'),
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
            memberView({ personId: ANA.id, name: ANA.name, email: ANA.email, role: 'owner' }),
            memberView({ ...DAVI, role: 'member', mayChangeTo: ['admin'], mayRemove: true }),
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
    http.get(`*/api/companies/${COMPANY.id}/projects`, () =>
      HttpResponse.json(
        listProjects.success.body.parse({
          projects: [],
          next: { kind: 'END' },
          databaseReady: true,
        }),
      ),
    ),
    http.post(`*/api/companies/${COMPANY.id}/invitations`, async ({ request }) => {
      sent.push({ key: request.headers.get('idempotency-key'), body: await request.json() })
      return view.answer?.() ?? refusal('INTERNAL_UNEXPECTED')
    }),
  )
  return { reads, sent }
}

export function sectionOf(heading: HTMLElement): HTMLElement {
  const section = heading.closest('section')
  if (section === null) throw new Error('the heading sits in no section')
  return section
}

/** The rows of a section's table, its header row left out. */
export function bodyRows(section: ReturnType<typeof within>): HTMLElement[] {
  return section.getAllByRole('row').slice(1)
}

export function open(search = '') {
  const conexus = createConexus(
    createMemoryHistory({ initialEntries: [`/companies/${COMPANY.id}/settings/people${search}`] }),
  )
  render(<Conexus conexus={conexus} />)
  return conexus.router
}
