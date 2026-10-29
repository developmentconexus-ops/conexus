import {
  AppAccessList,
  changeAppAccess,
  inviteToApp,
  listCompanyAppAccess,
  listMyApps,
} from '@conexus/hub-api'
import { HttpResponse, http } from 'msw'
import type { z } from 'zod'
import { COMPANY } from './fixtures.ts'
import { PEDIDOS } from './test-hub.tsx'

// The Hub's answers for who uses Pedidos' app, parsed through the contract as test-hub.tsx does.
const ACCESS_PATH = `*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/access`
const COMPANY_ACCESS_PATH = `*/api/companies/${COMPANY.id}/app-access`

const ROLES = [
  { name: 'vendedor', label: 'Vendedor' },
  { name: 'gerente', label: 'Gerente' },
]

export const CARLA = {
  personId: 'person-carla',
  name: 'Carla Souza',
  email: 'carla@example.test',
  role: 'vendedor',
  roleDeclared: true,
  grantedAt: '2026-10-28T12:00:00.000Z',
}

/** What the Hub answers for the Projeto's list: the owner's view, with Carla as Vendedor, unless the test says otherwise. */
export function accessView(fields: Partial<z.input<typeof AppAccessList>> = {}) {
  return AppAccessList.parse({
    roles: ROLES,
    published: true,
    members: [
      { personId: 'person-ana', name: 'Ana Lima', email: 'ana@example.test' },
      { personId: 'person-davi', name: 'Davi Costa', email: 'davi@example.test' },
    ],
    people: [CARLA],
    invitations: [
      {
        id: 'i'.repeat(32),
        email: 'carla2@example.test',
        role: 'gerente',
        expiresAt: '2026-11-04T12:00:00.000Z',
      },
    ],
    mayManage: true,
    ...fields,
  })
}

/** The list read, answered from `view.list` at each read; a test changes it between reads. */
export function accessRead(view: { list: z.output<typeof AppAccessList> }) {
  return http.get(ACCESS_PATH, () => HttpResponse.json(AppAccessList.parse(view.list)))
}

/** The Hub's 201 for an invitation to the app. */
export function invitedToApp(email: string, role: string | null) {
  return HttpResponse.json(
    inviteToApp.success.body.parse({
      invitation: {
        id: 'n'.repeat(32),
        email,
        role,
        expiresAt: '2026-11-04T12:00:00.000Z',
      },
    }),
    { status: 201 },
  )
}

/** The Hub's 200 for changing a person's role. */
export function changedRole(role: string) {
  return HttpResponse.json(changeAppAccess.success.body.parse({ person: { ...CARLA, role } }))
}

/** The company's list of the people who use its apps: Carla in Pedidos as Gerente, unless `people` says otherwise. */
export function companyAppAccessRead(people: unknown[] = [carlaOfCompany()]) {
  return http.get(COMPANY_ACCESS_PATH, () =>
    HttpResponse.json(listCompanyAppAccess.success.body.parse({ people, next: { kind: 'END' } })),
  )
}

function carlaOfCompany() {
  return {
    personId: CARLA.personId,
    name: CARLA.name,
    email: CARLA.email,
    apps: [
      { projectId: PEDIDOS.id, projectName: 'Pedidos', role: 'gerente', roleLabel: 'Gerente' },
    ],
  }
}

export const COMPANY_ACCESS_NONE = companyAppAccessRead([])

/** The apps a person without a company uses. */
export function myAppsRead(apps: unknown[]) {
  return http.get('*/api/apps', () => HttpResponse.json(listMyApps.success.body.parse({ apps })))
}

export const ENCOMENDAS = {
  projectName: 'Encomendas',
  companyName: 'Padaria Sol',
  address: 'encomendas--padaria-sol.apps.example.test',
}
