import {
  getCompany,
  listConnections,
  listInvitations,
  listMembers,
  listProjects,
  listRoles,
  RoleView,
} from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { memberView, refusal, sessionRead } from '../../platform/test-hub.tsx'
import { companyAppAccessRead } from '../../platform/test-hub-access.tsx'
import { mayOf } from '../../platform/test-may.ts'
import { SANKHYA } from '../connectors/fixtures.ts'
import { server } from './test-people.tsx'

export { server } from './test-people.tsx'

const EVERY = SANKHYA.subjects.flatMap((subject) => subject.operations)
const READS = EVERY.filter((operation) => operation.effect === 'READ')

function viewOf(role: string, label: string, kind: RoleView['kind'], ops: readonly string[], members = 0) {
  return RoleView.parse({ role, label, kind, connectors: { sankhya: ops }, members })
}

/** The four roles every company has, as a company that created none sees them. */
export const FIXED = [
  viewOf('owner', 'Dono', 'ALL', EVERY.map((one) => one.id), 1),
  viewOf('admin', 'Administrador', 'ALL', EVERY.map((one) => one.id)),
  viewOf('developer', 'Desenvolvedor', 'EDITABLE', READS.map((one) => one.id)),
  viewOf('member', 'Membro', 'EDITABLE', READS.map((one) => one.id), 1),
]

export const ATENDENTE = viewOf('atendente', 'Atendente', 'CUSTOM', ['pedidos'], 1)

export function customRole(label: string, role: string, ops: readonly string[], members = 0) {
  return viewOf(role, label, 'CUSTOM', ops, members)
}

type View = {
  /** The viewer's role in the company. */
  as: 'owner' | 'admin' | 'developer' | 'member'
  roles?: RoleView[]
  people?: Parameters<typeof memberView>[0][]
  mayInviteAs?: string[]
}

/** The Hub as one person sees it; the roles written are kept, and each write recorded. */
export function hub(view: View) {
  const roles = [...(view.roles ?? FIXED)]
  const written: { method: string; path: string; body?: unknown }[] = []
  server.use(
    sessionRead(() => ANA),
    companyAppAccessRead(undefined, view.as !== 'member'),
    http.get(`*/api/companies/${COMPANY.id}`, () =>
      HttpResponse.json(
        getCompany.success.body.parse({
          company: COMPANY,
          role: view.as,
          mayInviteAs: view.mayInviteAs ?? (view.as === 'owner' || view.as === 'admin' ? ['admin', 'member'] : []),
          may: mayOf(view.as),
        }),
      ),
    ),
    http.get(`*/api/companies/${COMPANY.id}/members`, () =>
      HttpResponse.json(
        listMembers.success.body.parse({
          members: (view.people ?? []).map((one) => memberView(one)),
          next: { kind: 'END' },
        }),
      ),
    ),
    http.get(`*/api/companies/${COMPANY.id}/invitations`, () =>
      HttpResponse.json(
        listInvitations.success.body.parse({ invitations: [], next: { kind: 'END' } }),
      ),
    ),
    http.get(`*/api/companies/${COMPANY.id}/projects`, () =>
      HttpResponse.json(
        listProjects.success.body.parse({ projects: [], next: { kind: 'END' }, databaseReady: true }),
      ),
    ),
    http.get(`*/api/companies/${COMPANY.id}/connections`, () =>
      HttpResponse.json(
        listConnections.success.body.parse({
          connectors: [SANKHYA],
          connections: [],
          mayManage: true,
        }),
      ),
    ),
    http.get(`*/api/companies/${COMPANY.id}/roles`, () =>
      view.as === 'owner' || view.as === 'admin'
        ? HttpResponse.json(listRoles.success.body.parse({ roles }))
        : refusal('NOT_FOUND'),
    ),
  )
  return { roles, written, server }
}

export function open(path = '/settings/roles') {
  const conexus = createConexus(
    createMemoryHistory({ initialEntries: [`/companies/${COMPANY.id}${path}`] }),
  )
  return { ...render(<Conexus conexus={conexus} />), router: conexus.router }
}
