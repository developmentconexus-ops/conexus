import {
  createInvitation,
  getAccountKinds,
  getCompany,
  listInvitations,
  listMembers,
  listModelAccounts,
  listModelProviders,
  listProjects,
  ModelAccount,
  setCompanyNickname,
} from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import type { HttpHandler } from 'msw'
import { HttpResponse, http } from 'msw'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { memberView, refusal, sessionRead } from '../../platform/test-hub.tsx'

const BASE = `*/api/companies/${COMPANY.id}`
const ROLES = { owner: ['owner', 'admin', 'member'], admin: ['admin', 'member'], member: [] }

/** What the Hub holds of a company in its first entry: a write changes it, a read shows it. */
export type CompanyView = {
  role: 'owner' | 'admin' | 'member'
  nickname: string | null
  /** People of the company besides Ana. */
  others: number
  invitations: { id: string; email: string; role: string; state: string }[]
  /** Model accounts the company has linked. */
  accounts: number
}

export function companyView(fields: Partial<CompanyView> = {}): CompanyView {
  return {
    role: 'owner',
    nickname: null,
    others: 0,
    invitations: [],
    accounts: 0,
    ...fields,
  }
}

function peopleOf(view: CompanyView, invited: unknown[]): HttpHandler[] {
  return [
    http.get(`${BASE}/members`, () =>
      HttpResponse.json(
        listMembers.success.body.parse({
          members: [
            memberView({ ...ANA, personId: ANA.id, role: view.role }),
            ...Array.from({ length: view.others }, (_, index) =>
              memberView({
                personId: `person-${index}`,
                name: `Pessoa ${index}`,
                email: `pessoa${index}@example.test`,
                role: 'member',
              }),
            ),
          ],
          next: { kind: 'END' },
        }),
      ),
    ),
    http.get(`${BASE}/invitations`, () =>
      HttpResponse.json(
        listInvitations.success.body.parse({
          invitations: view.invitations.map((row) => ({
            ...row,
            expiresAt: '2026-10-30T12:00:00.000Z',
            revision: 0,
          })),
          next: { kind: 'END' },
        }),
      ),
    ),
    http.post(`${BASE}/invitations`, async ({ request }) => {
      const body = createInvitation.input.body.parse(await request.json())
      invited.push(body)
      const invitation = { ...body, state: 'PENDING', id: 'i'.repeat(32) }
      view.invitations.push(invitation)
      return HttpResponse.json(
        createInvitation.success.body.parse({
          invitation: { ...invitation, expiresAt: '2026-10-30T12:00:00.000Z', revision: 0 },
        }),
        { status: 201 },
      )
    }),
  ]
}

function accountsOf(count: number) {
  return Array.from({ length: count }, (_, index) =>
    ModelAccount.parse({
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      owner: 'company',
      kind: 'api_key',
      provider: 'anthropic',
      label: `Time ${index + 1}`,
      position: index,
      state: 'ready',
      kindOff: false,
      hint: 'x7Qa',
      linkedBy: ANA.name,
      limitedUntil: null,
      linkedAt: '2026-10-19T12:00:00.000Z',
      assignees: [],
      revision: 0,
    }),
  )
}

function modelAccountsOf(view: CompanyView): HttpHandler[] {
  return [
    http.get(`${BASE}/model-accounts`, () =>
      HttpResponse.json(
        listModelAccounts.success.body.parse({
          company: accountsOf(view.accounts),
          mine: [],
          order: [],
          kinds: [],
          defaultModel: null,
          mayManage: true,
          fallback: { enabled: false, chain: [], revision: 0 },
          usableProviders: [],
        }),
      ),
    ),
    http.get('*/api/model-providers', () =>
      HttpResponse.json(listModelProviders.success.body.parse({ providers: [] })),
    ),
    http.get('*/api/clients/:companyId/account-kinds', () =>
      HttpResponse.json(getAccountKinds.success.body.parse({ kinds: [] })),
    ),
  ]
}

/** Saving the nickname: the Hub's answer, `saved` by default. */
export type SaveNickname = (nickname: string) => Response | Promise<Response>

/**
 * The Hub as a person of Empresa Teste sees it, with the model accounts, the people and the
 * invitations of `view`. The Hub answers 404 for a company without nickname to anyone but its owner.
 */
export function companyHub(
  view: CompanyView,
  save: SaveNickname = (nickname) => saved(view, nickname),
) {
  const nicknames: unknown[] = []
  const invited: unknown[] = []
  const handlers: HttpHandler[] = [
    sessionRead(() => ANA),
    http.get(BASE, () =>
      view.nickname === null && view.role !== 'owner'
        ? refusal('NOT_FOUND')
        : HttpResponse.json(
            getCompany.success.body.parse({
              company: { ...COMPANY, nickname: view.nickname },
              role: view.role,
              mayInviteAs: ROLES[view.role],
            }),
          ),
    ),
    http.put(`${BASE}/nickname`, async ({ request }) => {
      const body = setCompanyNickname.input.body.parse(await request.json())
      nicknames.push(body)
      return save(body.nickname)
    }),
    ...peopleOf(view, invited),
    ...modelAccountsOf(view),
    http.get(`${BASE}/projects`, () =>
      HttpResponse.json(
        listProjects.success.body.parse({
          projects: [],
          next: { kind: 'END' },
          databaseReady: true,
        }),
      ),
    ),
  ]
  return { handlers, nicknames, invited }
}

/** The save the Hub accepts: the company has its nickname from then on. */
export function saved(view: CompanyView, nickname: string) {
  view.nickname = nickname
  return HttpResponse.json(
    setCompanyNickname.success.body.parse({ company: { ...COMPANY, nickname } }),
  )
}

export function openAt(path: string) {
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

export const COMPANY_PATH = `/companies/${COMPANY.id}`
