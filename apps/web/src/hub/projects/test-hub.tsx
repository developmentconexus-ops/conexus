import type { ProjectAccess, ProjectConnections } from '@conexus/hub-api'
import { ConnectionList, ConnectorEntry, ProjectConnections as ListShape } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { render, screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import type { hubServer } from '../../platform/test-hub.tsx'
import { PEDIDOS, projectsRead } from '../../platform/test-hub.tsx'

const PROJECT = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}`
export const API = `*/api/companies/${COMPANY.id}`
const LOGO =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><rect width="28" height="28"/></svg>'
const SHARED = { version: '1.0.0', summary: 'Resumo.', logo: LOGO, subjects: [], fields: [] }
export const ASK = 'Peça ao dono ou a um administrador.'

const catalog = [
  { id: 'sankhya', name: 'Sankhya', category: 'ERP', auth: 'client_credentials', lake: null },
  {
    id: 'mercado-livre',
    name: 'Mercado Livre',
    category: 'Marketplace',
    auth: 'oauth2_code',
    lake: 'EXCLUSIVE_CREDENTIAL',
  },
].map((one) => ConnectorEntry.parse({ ...one, lakeUnavailable: one.lake, ...SHARED }))

const LineShape = ListShape.shape.connectors.element.shape.connections.element
type Line = ProjectConnections['connectors'][number]['connections'][number]
let made = 0
export function line(name: string, fields: Partial<Line> = {}): Line {
  made += 1
  return LineShape.parse({
    id: `00000000-0000-4000-8000-${String(made).padStart(12, '0')}`,
    name,
    state: 'ACTIVE',
    account: null,
    access: NOT_RELEASED,
    ...fields,
  })
}
const GRANT = { by: 'Ana', at: '2026-10-30T12:00:00.000Z' }
const NOT_RELEASED: ProjectAccess = { kind: 'NOT_RELEASED' }
export const READS: ProjectAccess = { kind: 'READS', grant: GRANT }
export const RELEASED_NOT_WORKING: ProjectAccess = { kind: 'RELEASED_NOT_WORKING', grant: GRANT }
export const NOT_RELEASED_NOT_WORKING: ProjectAccess = { kind: 'NOT_RELEASED_NOT_WORKING' }

export type View = { sankhya: Line[]; ml: Line[]; mayManage: boolean }
export const sent: { method: string; path: string }[] = []

function hub(view: View) {
  function lines() {
    return [...view.sankhya, ...view.ml]
  }
  return [
    http.get(`${API}/projects/${PEDIDOS.id}/connections`, () =>
      HttpResponse.json(
        ListShape.parse({
          connectors: [
            { connector: catalog[0], perProject: 'one', connections: view.sankhya },
            { connector: catalog[1], perProject: 'many', connections: view.ml },
          ],
        }),
      ),
    ),
    http.get(`${API}/connections`, () =>
      HttpResponse.json(
        ConnectionList.parse({ connectors: catalog, connections: [], mayManage: view.mayManage }),
      ),
    ),
    http.put(`${API}/projects/${PEDIDOS.id}/connections/:connectionId`, ({ params, request }) => {
      sent.push({ method: request.method, path: new URL(request.url).pathname })
      const found = lines().find((one) => one.id === params.connectionId)
      if (found) found.access = READS
      return HttpResponse.json({ access: READS })
    }),
    http.delete(
      `${API}/projects/${PEDIDOS.id}/connections/:connectionId`,
      ({ params, request }) => {
        sent.push({ method: request.method, path: new URL(request.url).pathname })
        const found = lines().find((one) => one.id === params.connectionId)
        if (found) found.access = NOT_RELEASED
        return new HttpResponse(null, { status: 204 })
      },
    ),
  ]
}

export function open(server: ReturnType<typeof hubServer>, view: View) {
  sent.length = 0
  const role = view.mayManage ? 'owner' : 'member'
  server.use(
    ...hub(view),
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: false, role }),
  )
  render(
    <Conexus
      conexus={createConexus(createMemoryHistory({ initialEntries: [`${PROJECT}/integrations`] }))}
    />,
  )
}

export async function row(name: string) {
  const heading = await screen.findByText(name)
  const item = heading.closest('li')
  if (item === null) throw new Error(`sem linha para ${name}`)
  return within(item)
}
