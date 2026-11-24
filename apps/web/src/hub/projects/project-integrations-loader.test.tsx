import { CompanyId, ConnectionList, ProjectConnections, ProjectId } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { HttpResponse, http } from 'msw'
import { beforeEach, expect, test } from 'vitest'
import { createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { conversationsNone, hubServer, PEDIDOS, projectsRead } from '../../platform/test-hub.tsx'
import { versionsRead } from '../../platform/test-hub-versions.tsx'
import { connectionsQuery, projectConnectionsQuery } from '../connectors/public.ts'

const server = hubServer()
const API = `*/api/companies/${COMPANY.id}`

beforeEach(() => server.use(conversationsNone, versionsRead({ versions: [] })))

test('a rota espera as leituras das ligações antes de mostrar a página: a primeira imagem não sai em branco', async () => {
  server.use(
    http.get(`${API}/projects/${PEDIDOS.id}/connections`, () =>
      HttpResponse.json(ProjectConnections.parse({ connectors: [] })),
    ),
    http.get(`${API}/connections`, () =>
      HttpResponse.json(ConnectionList.parse({ connectors: [], connections: [], mayManage: true })),
    ),
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: false, role: 'owner' }),
  )
  const conexus = createConexus(
    createMemoryHistory({
      initialEntries: [`/companies/${COMPANY.id}/projects/${PEDIDOS.id}/integrations`],
    }),
  )
  await conexus.router.load()
  const { queryClient } = conexus
  const companyId = CompanyId.parse(COMPANY.id)
  const projectId = ProjectId.parse(PEDIDOS.id)
  expect(
    queryClient.getQueryData(projectConnectionsQuery(companyId, projectId).queryKey),
  ).toBeDefined()
  expect(queryClient.getQueryData(connectionsQuery(companyId).queryKey)).toBeDefined()
})
