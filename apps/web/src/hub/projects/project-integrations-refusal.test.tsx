import { ConnectionList, ConnectorEntry, ProjectConnections } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { beforeEach, expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { sentenceOfCode } from '../../platform/hub.ts'
import {
  conversationsNone,
  hubServer,
  PEDIDOS,
  projectCopiesNone,
  projectsRead,
  refusal,
} from '../../platform/test-hub.tsx'
import { versionsRead } from '../../platform/test-hub-versions.tsx'

const server = hubServer()
const API = `*/api/companies/${COMPANY.id}`
const LOGO =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><rect width="28" height="28"/></svg>'
const sankhya = ConnectorEntry.parse({
  id: 'sankhya',
  name: 'Sankhya',
  category: 'ERP',
  auth: 'client_credentials',
  version: '1.0.0',
  summary: 'Resumo.',
  logo: LOGO,
  subjects: [],
  fields: [],
})
const matriz = {
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Matriz',
  state: 'ACTIVE',
  account: null,
  access: { kind: 'READS', grant: { by: 'Ana', at: '2026-10-30T12:00:00.000Z' } },
}

beforeEach(() => server.use(conversationsNone, projectCopiesNone, versionsRead({ versions: [] })))

test('Tirar recusado diz a frase em um bloco, não dentro de um span', async () => {
  server.use(
    http.get(`${API}/projects/${PEDIDOS.id}/connections`, () =>
      HttpResponse.json(
        ProjectConnections.parse({
          connectors: [{ connector: sankhya, perProject: 'one', connections: [matriz] }],
        }),
      ),
    ),
    http.get(`${API}/connections`, () =>
      HttpResponse.json(
        ConnectionList.parse({ connectors: [sankhya], connections: [], mayManage: true }),
      ),
    ),
    http.delete(`${API}/projects/${PEDIDOS.id}/connections/:connectionId`, () =>
      refusal('DATABASE_UNAVAILABLE'),
    ),
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: false, role: 'owner' }),
  )
  render(
    <Conexus
      conexus={createConexus(
        createMemoryHistory({
          initialEntries: [`/companies/${COMPANY.id}/projects/${PEDIDOS.id}/integrations`],
        }),
      )}
    />,
  )
  const item = (await screen.findByText('Matriz')).closest('li')
  if (item === null) throw new Error('sem linha para Matriz')
  fireEvent.click(within(item).getByRole('button', { name: 'Tirar: Matriz' }))
  const alert = await within(item).findByRole('alert')
  expect(alert.textContent).toBe(sentenceOfCode('DATABASE_UNAVAILABLE'))
  expect(alert.closest('span')).toBeNull()
})
