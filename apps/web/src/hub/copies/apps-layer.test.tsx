import type { AppTables } from '@conexus/hub-api'
import { ProjectSummary, AppTables as TablesShape } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { LIST, openData } from './test-hub.tsx'

// Dados, camada Apps: as tabelas que cada app guarda, por Projeto (Dados, parte 1, 10.1 a 10.5).
const server = hubServer()
const APPS = `${LIST}?layer=apps`

function project(letter: string, name: string, versions: [number | null, number | null]) {
  return ProjectSummary.parse({
    id: letter.repeat(32),
    name,
    createdAt: '2026-10-17T12:00:00.000Z',
    appVersion: versions[0],
    publishedVersion: versions[1],
  })
}
const CRM = project('c', 'CRM', [3, 3])
const ACOMPANHAMENTO = project('a', 'Acompanhamento', [1, null])
const SEM_APP = project('s', 'Sem app', [null, null])

function table(name: string, rows: object) {
  return { name, rows }
}
function tablesOf(...tables: object[]) {
  return TablesShape.parse({ kind: 'TABLES', tables })
}

/** What each Projeto answers to `listAppTables`, by its id. */
function answering(byProject: Record<string, AppTables | Response>) {
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/projects/:projectId/tables`, ({ params }) => {
      const answer = byProject[String(params.projectId)] ?? refusal('NOT_FOUND')
      return answer instanceof Response ? answer : HttpResponse.json(answer)
    }),
  )
}

test('Apps: as tabelas por Projeto, com a versão e as linhas', async () => {
  answering({
    [CRM.id]: tablesOf(table('clientes', { kind: 'EXACT', rows: 1284 })),
    [ACOMPANHAMENTO.id]: tablesOf(table('metas', { kind: 'EXACT', rows: 0 })),
  })
  openData(server, {}, APPS, 'owner', [CRM, ACOMPANHAMENTO])
  const crm = within(await screen.findByRole('region', { name: 'CRM' }))
  expect(crm.getByText('CRM · 1 tabela')).toBeTruthy()
  expect(crm.getByText('clientes')).toBeTruthy()
  expect(crm.getByText('Publicado · v3')).toBeTruthy()
  expect(crm.getByText('1.284')).toBeTruthy()
  const building = within(await screen.findByRole('region', { name: 'Acompanhamento' }))
  expect(building.getByText('Em construção · v1')).toBeTruthy()
  expect(building.getByText('0')).toBeTruthy()
})

test('Apps: um Projeto sem app não aparece', async () => {
  answering({
    [CRM.id]: tablesOf(table('clientes', { kind: 'EXACT', rows: 3 })),
    [SEM_APP.id]: TablesShape.parse({ kind: 'NO_APP' }),
  })
  openData(server, {}, APPS, 'owner', [CRM, SEM_APP])
  await screen.findByRole('region', { name: 'CRM' })
  expect(screen.queryByText(/Sem app/)).toBeNull()
})

test('Apps: um Projeto que o Hub diz sem app também não aparece', async () => {
  answering({ [CRM.id]: TablesShape.parse({ kind: 'NO_APP' }) })
  openData(server, {}, APPS, 'owner', [CRM])
  expect(await screen.findByText('Nenhum app guarda tabelas ainda.')).toBeTruthy()
  expect(screen.queryByRole('region', { name: 'CRM' })).toBeNull()
})

test('Apps: nenhum app', async () => {
  openData(server, {}, APPS, 'owner', [SEM_APP])
  expect(await screen.findByText('Nenhum app guarda tabelas ainda.')).toBeTruthy()
})

test('Apps: a contagem indisponível', async () => {
  answering({ [CRM.id]: tablesOf(table('sobras', { kind: 'UNKNOWN' })) })
  openData(server, {}, APPS, 'owner', [CRM])
  expect(await screen.findByText('indisponível')).toBeTruthy()
})

test('Apps: o Projeto que não responde diz só no grupo dele', async () => {
  answering({
    [CRM.id]: tablesOf(table('clientes', { kind: 'EXACT', rows: 3 })),
    [ACOMPANHAMENTO.id]: refusal('DATABASE_UNAVAILABLE'),
  })
  openData(server, {}, APPS, 'owner', [CRM, ACOMPANHAMENTO])
  const failed = within(await screen.findByRole('region', { name: 'Acompanhamento' }))
  expect(failed.getByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
  expect(failed.getByRole('link', { name: 'Abrir o Projeto' })).toBeTruthy()
  expect(screen.getByRole('region', { name: 'CRM' })).toBeTruthy()
})

test('Apps: Abrir o Projeto leva à página Dados do Projeto', async () => {
  answering({ [CRM.id]: tablesOf(table('clientes', { kind: 'EXACT', rows: 3 })) })
  openData(server, {}, APPS, 'owner', [CRM])
  const link = await screen.findByRole('link', { name: 'Abrir o Projeto' })
  expect(link.getAttribute('href')).toBe(`/companies/${COMPANY.id}/projects/${CRM.id}/data`)
})

test('Apps: o grupo Apps abre a camada Apps', async () => {
  answering({ [CRM.id]: tablesOf(table('clientes', { kind: 'EXACT', rows: 3 })) })
  openData(server, {}, LIST, 'owner', [CRM])
  fireEvent.click(await screen.findByRole('link', { name: 'Apps' }))
  await waitFor(() => expect(screen.getByText('clientes')).toBeTruthy())
})

test('Apps: a segunda página de Projetos só é lida no toque em Mais Projetos', async () => {
  const asked: (string | null)[] = []
  answering({
    [CRM.id]: tablesOf(table('clientes', { kind: 'EXACT', rows: 3 })),
    [ACOMPANHAMENTO.id]: tablesOf(table('metas', { kind: 'EXACT', rows: 0 })),
  })
  openData(server, {}, APPS, 'owner', [CRM])
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/projects`, ({ request }) => {
      const page = new URL(request.url).searchParams.get('page')
      asked.push(page)
      const first = page === null
      return HttpResponse.json({
        projects: [first ? CRM : ACOMPANHAMENTO],
        next: first ? { kind: 'MORE', page: 'UDI' } : { kind: 'END' },
        databaseReady: true,
      })
    }),
  )
  await screen.findByRole('region', { name: 'CRM' })
  expect(asked.filter((page) => page !== null)).toEqual([])
  fireEvent.click(screen.getByRole('button', { name: 'Mais Projetos' }))
  await screen.findByRole('region', { name: 'Acompanhamento' })
  expect(asked.filter((page) => page !== null)).toEqual(['UDI'])
  expect(screen.queryByRole('button', { name: 'Mais Projetos' })).toBeNull()
})
