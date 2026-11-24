import { AppTables } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../../../main.tsx'
import { COMPANY } from '../../../../platform/fixtures.ts'
import { hubServer, PEDIDOS, projectsRead } from '../../../../platform/test-hub.tsx'

// The old addresses of a copy of the company's database redirect to Dados (U14, criterion 73).
const server = hubServer()

const COMPANY_ROOT = `/companies/${COMPANY.id}`
const PROJECT_ROOT = `${COMPANY_ROOT}/projects/${PEDIDOS.id}`
const COPY = '11111111-1111-4111-8111-111111111111'

function open(path: string) {
  server.use(
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: false, role: 'owner' }),
    http.get(`*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/tables`, () =>
      HttpResponse.json(AppTables.parse({ kind: 'TABLES', tables: [] })),
    ),
  )
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

test.each([
  ['/data/<id>', `${COMPANY_ROOT}/data/${COPY}?tab=runs&page=NTA`],
  ['/copies/<id>', `${COMPANY_ROOT}/copies/${COPY}?tab=sample`],
  ['/copies', `${COMPANY_ROOT}/copies`],
])('o endereço antigo %s de uma cópia leva à página Dados', async (_name, path) => {
  const router = open(path)
  expect(await screen.findByRole('heading', { name: 'Dados' })).toBeTruthy()
  await waitFor(() => expect(router.state.location.pathname).toBe(`${COMPANY_ROOT}/data`))
  expect(router.state.location.searchStr).toBe('')
})

test('o endereço antigo das linhas de uma cópia liberada leva aos Dados do Projeto', async () => {
  const router = open(`${PROJECT_ROOT}/data/copies/sankhya_vendas?page=NTA`)
  expect(await screen.findByText('O app ainda não criou tabelas.')).toBeTruthy()
  await waitFor(() => expect(router.state.location.pathname).toBe(`${PROJECT_ROOT}/data`))
  expect(router.state.location.searchStr).toBe('')
})
