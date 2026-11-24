import { ConnectionList, ConnectorEntry, ProjectConnections } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { unconfirmedText } from '../../platform/hub.ts'
import {
  conversationsNone,
  hubServer,
  PEDIDOS,
  projectsRead,
  refusal,
} from '../../platform/test-hub.tsx'
import { versionsRead } from '../../platform/test-hub-versions.tsx'

// Tirar in a Projeto's Integrações: it asks first, as Apagar does, and says what stops working.
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
const READS = { kind: 'READS', grant: { by: 'Ana', at: '2026-10-30T12:00:00.000Z' } }
const MATRIZ = '00000000-0000-4000-8000-000000000001'

/** The Projeto's Integrações with Matriz released, and a Tirar answered by `revoked`. */
function opened(revoked: () => Response) {
  let access: object = READS
  const deletes: string[] = []
  server.use(
    conversationsNone,
    versionsRead({ versions: [] }),
    http.get(`${API}/projects/${PEDIDOS.id}/connections`, () =>
      HttpResponse.json(
        ProjectConnections.parse({
          connectors: [
            {
              connector: sankhya,
              perProject: 'one',
              connections: [{ id: MATRIZ, name: 'Matriz', state: 'ACTIVE', account: null, access }],
            },
          ],
        }),
      ),
    ),
    http.get(`${API}/connections`, () =>
      HttpResponse.json(
        ConnectionList.parse({ connectors: [sankhya], connections: [], mayManage: true }),
      ),
    ),
    http.delete(`${API}/projects/${PEDIDOS.id}/connections/:connectionId`, ({ params }) => {
      deletes.push(String(params.connectionId))
      const answer = revoked()
      if (answer.ok) access = { kind: 'NOT_RELEASED' }
      return answer
    }),
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
  return deletes
}

async function asked() {
  const item = (await screen.findByText('Matriz')).closest('li')
  if (item === null) throw new Error('sem linha para Matriz')
  fireEvent.click(within(item).getByRole('button', { name: 'Tirar: Matriz' }))
  return { item, dialog: await screen.findByRole('alertdialog') }
}

test('Tirar pede a confirmação com o que deixa de funcionar no Projeto, e Cancelar não tira nada', async () => {
  const deletes = opened(() => new HttpResponse(null, { status: 204 }))
  const { item, dialog } = await asked()
  expect(within(dialog).getByText('Tirar Matriz deste Projeto?')).toBeTruthy()
  expect(
    within(dialog).getByText(
      'O app, o Conexus e os agentes deste Projeto deixam de usar o Sankhya da empresa. O que dependia dele para de funcionar até alguém liberar de novo.',
    ),
  ).toBeTruthy()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(deletes).toEqual([])
  expect(within(item).getByRole('button', { name: 'Tirar: Matriz' })).toBeTruthy()
})

test('Tirar confirmado tira a liberação e a linha volta a "não liberado"', async () => {
  const deletes = opened(() => new HttpResponse(null, { status: 204 }))
  const { dialog } = await asked()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Tirar' }))
  expect(await screen.findByRole('button', { name: 'Liberar para ler: Matriz' })).toBeTruthy()
  expect(screen.queryByRole('alertdialog')).toBeNull()
  expect(deletes).toEqual([MATRIZ])
})

test('Tirar que o banco não confirmou diz no diálogo, em um bloco, que a mudança não se confirmou', async () => {
  opened(() => refusal('DATABASE_UNAVAILABLE'))
  const { dialog } = await asked()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Tirar' }))
  const alert = await within(dialog).findByRole('alert')
  expect(alert.textContent).toBe(unconfirmedText('a mudança', 'Veja a lista.'))
  expect(alert.closest('span')).toBeNull()
})
