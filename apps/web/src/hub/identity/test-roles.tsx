import type { CopySummary } from '@conexus/hub-api'
import {
  CopyId,
  getCompany,
  listConnections,
  listCopies,
  listCopyReaders,
  listInvitations,
  listMembers,
  listProjects,
  listRoles,
  RoleView,
  setRoleCopies,
} from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { memberView, sessionRead } from '../../platform/test-hub.tsx'
import { companyAppAccessRead } from '../../platform/test-hub-access.tsx'
import { KIT_SANKHYA as SANKHYA } from '../../platform/test-kit.ts'
import { mayOf } from '../../platform/test-may.ts'
import { server } from './test-people.tsx'

export { server } from './test-people.tsx'

const EVERY = SANKHYA.subjects.flatMap((subject) => subject.operations)
const READS = EVERY.filter((operation) => operation.effect === 'READ')

function viewOf(
  role: string,
  label: string,
  kind: RoleView['kind'],
  ops: readonly string[],
  members = 0,
) {
  return RoleView.parse({
    ...{ role, label, kind, connectors: { sankhya: ops }, members },
    unattended: kind === 'ALL',
  })
}

/** The four roles every company has, as a company that created none sees them. */
export const FIXED = [
  viewOf(
    'owner',
    'Dono',
    'ALL',
    EVERY.map((one) => one.id),
    1,
  ),
  viewOf(
    'admin',
    'Administrador',
    'ALL',
    EVERY.map((one) => one.id),
  ),
  viewOf(
    'developer',
    'Desenvolvedor',
    'EDITABLE',
    READS.map((one) => one.id),
  ),
  viewOf(
    'member',
    'Membro',
    'EDITABLE',
    READS.map((one) => one.id),
    1,
  ),
]

export const ATENDENTE = viewOf('atendente', 'Atendente', 'CUSTOM', ['pedidos'], 1)

export function customRole(label: string, role: string, ops: readonly string[], members = 0) {
  return viewOf(role, label, 'CUSTOM', ops, members)
}

export const VENDAS = CopyId.parse('11111111-1111-4111-8111-111111111111')
export const CLIENTES = CopyId.parse('22222222-2222-4222-8222-222222222222')

/** A copy of the Sankhya the Hub lists, as the roles screen needs it: its table, what it keeps, no runs. */
function copyOf(id: CopyId, name: string, label: string, description: string): CopySummary {
  return listCopies.success.body.shape.copies.element.parse({
    id,
    name,
    label,
    sources: [
      {
        connection: {
          id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          name: 'Matriz',
          connector: 'sankhya',
        },
      },
    ],
    interval: '30m',
    schedule: { kind: 'ACTIVE', nextRunAt: '2026-11-02T10:30:00.000Z' },
    run: null,
    rows: 118402,
    mode: { kind: 'WHOLE' },
    projects: [],
    shown: {
      source: { kind: 'QUERY', query: 'SELECT 1' },
      key: ['ID'],
      changedSince: null,
      window: null,
      description,
      columns: [],
    },
  })
}

/** The two copies of the Sankhya a company has when it copied something. */
const COPIES = [
  copyOf(VENDAS, 'sankhya_vendas', 'Vendas', 'Pedidos e notas de venda, um por linha.'),
  copyOf(CLIENTES, 'sankhya_clientes', 'Clientes', 'Cadastro de clientes e parceiros.'),
]

/** Who reads which copy: the owner and the administrator read both, Financeiro only the sales. */
const READERS = [
  { copyId: VENDAS, roles: ['owner', 'admin', 'financeiro'] },
  { copyId: CLIENTES, roles: ['owner', 'admin'] },
]

export const FINANCEIRO = viewOf('financeiro', 'Financeiro', 'CUSTOM', ['pedidos'], 2)

type View = {
  /** The copies the Hub lists; the Sankhya's two when absent. */
  copies?: CopySummary[]
  /** The viewer's role in the company. */
  as: 'owner' | 'admin' | 'developer' | 'member'
  roles?: RoleView[]
  /** What the copies' readers answer instead of its rows. */
  readers?: () => Response | undefined
  people?: Parameters<typeof memberView>[0][]
  mayInviteAs?: string[]
  /** The open invitations, one list for each page the Hub answers. */
  invitationPages?: { email: string; role: string }[][]
}

type Written = { method: string; path: string; body?: unknown }[]

/** The copies the roles screen reads and the two writes of an open role, each recorded in `written`. */
function copiesHub(view: View, roles: RoleView[], written: Written) {
  return [
    http.get(`*/api/companies/${COMPANY.id}/copies`, () =>
      HttpResponse.json(listCopies.success.body.parse({ copies: view.copies ?? COPIES })),
    ),
    http.get(
      `*/api/companies/${COMPANY.id}/copy-readers`,
      () =>
        view.readers?.() ??
        HttpResponse.json(
          listCopyReaders.success.body.parse({
            readers: (view.copies ?? COPIES).map((one) => ({
              copyId: one.id,
              roles: (READERS.find((row) => row.copyId === one.id)?.roles ?? []).map((role) => ({
                role,
                label: roles.find((row) => row.role === role)?.label ?? role,
                members: 1,
              })),
            })),
          }),
        ),
    ),
    http.put(`*/api/companies/${COMPANY.id}/roles/:role`, async ({ request, params }) => {
      written.push({ method: 'PUT', path: `roles/${params.role}`, body: await request.json() })
      return HttpResponse.json({ role: roles.find((one) => one.role === params.role) })
    }),
    http.put(`*/api/companies/${COMPANY.id}/roles/:role/copies`, async ({ request, params }) => {
      const body = setRoleCopies.input.body.parse(await request.json())
      written.push({ method: 'PUT', path: `roles/${params.role}/copies`, body })
      return HttpResponse.json(setRoleCopies.success.body.parse({ copies: body.copies }))
    }),
  ]
}

/** The Hub as one person sees it; the roles written are kept, and each write recorded. */
export function hub(view: View) {
  const roles = [...(view.roles ?? FIXED)]
  const written: Written = []
  server.use(
    sessionRead(() => ANA),
    companyAppAccessRead(undefined, view.as !== 'member'),
    http.get(`*/api/companies/${COMPANY.id}`, () =>
      HttpResponse.json(
        getCompany.success.body.parse({
          company: COMPANY,
          role: view.as,
          mayInviteAs:
            view.mayInviteAs ??
            (view.as === 'owner' || view.as === 'admin' ? ['admin', 'member'] : []),
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
    http.get(`*/api/companies/${COMPANY.id}/invitations`, ({ request }) => {
      const pages = view.invitationPages ?? [[]]
      const at = Number(new URL(request.url).searchParams.get('page') ?? 0)
      return HttpResponse.json(
        listInvitations.success.body.parse({
          invitations: (pages[at] ?? []).map((one, index) => ({
            id: `${at}${index}`.padEnd(32, 'i'),
            expiresAt: '2026-10-17T12:00:00.000Z',
            revision: 0,
            state: 'PENDING',
            ...one,
          })),
          next: at + 1 < pages.length ? { kind: 'MORE', page: String(at + 1) } : { kind: 'END' },
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
      HttpResponse.json(listRoles.success.body.parse({ roles })),
    ),
    ...copiesHub(view, roles, written),
  )
  return { roles, written, server }
}

export function open(path = '/settings/roles') {
  const conexus = createConexus(
    createMemoryHistory({ initialEntries: [`/companies/${COMPANY.id}${path}`] }),
  )
  return { ...render(<Conexus conexus={conexus} />), router: conexus.router }
}
