import { getCompany, listCompanies, listProjects } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { hubServer, sessionRead } from '../../platform/test-hub.tsx'

const server = hubServer()

const OTHER = { ...COMPANY, id: 'c'.repeat(32), name: 'Outra Empresa', nickname: 'outra-empresa' }

afterEach(() => localStorage.clear())

/** Ana in the companies listed; each one opens as her own, with no Project. */
function hub(listed: (typeof COMPANY)[]) {
  server.use(
    sessionRead(() => ANA),
    http.get('*/api/companies', () =>
      HttpResponse.json(
        listCompanies.success.body.parse({
          companies: listed.map((company) => ({ company, role: 'owner' })),
          mayOperate: false,
          next: { kind: 'END' },
        }),
      ),
    ),
    http.get('*/api/companies/:companyId', ({ params }) => {
      const company = listed.find((one) => one.id === params.companyId)
      return HttpResponse.json(
        getCompany.success.body.parse({ company, role: 'owner', mayInviteAs: [] }),
      )
    }),
    http.get('*/api/companies/:companyId/projects', () =>
      HttpResponse.json(
        listProjects.success.body.parse({
          projects: [],
          next: { kind: 'END' },
          databaseReady: true,
        }),
      ),
    ),
  )
}

function open(company: typeof COMPANY) {
  const conexus = createConexus(
    createMemoryHistory({ initialEntries: [`/companies/${company.id}`] }),
  )
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

test('com mais de uma empresa, a troca lista todas; escolher uma abre o Início dela', async () => {
  hub([COMPANY, OTHER])
  const router = open(COMPANY)
  fireEvent.click(
    await screen.findByRole('button', { name: 'Trocar de empresa. Agora: Empresa Teste' }),
  )
  expect(await screen.findByRole('menuitem', { name: 'Empresa Teste' })).toBeTruthy()
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Outra Empresa' }))
  expect(await screen.findByRole('heading', { name: 'Pergunte ou peça um app' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(`/companies/${OTHER.id}`)
  expect(
    await screen.findByRole('button', { name: 'Trocar de empresa. Agora: Outra Empresa' }),
  ).toBeTruthy()
})

test('com uma empresa só, a barra mostra o nome e não oferece troca', async () => {
  hub([COMPANY])
  open(COMPANY)
  const nav = await screen.findByRole('navigation', { name: 'Navegação' })
  await waitFor(() => expect(nav.textContent).toContain('Empresa Teste'))
  expect(screen.queryByRole('button', { name: /Trocar de empresa/ })).toBeNull()
})

test('abrir uma empresa pelo endereço a faz a última lembrada', async () => {
  hub([COMPANY, OTHER])
  open(OTHER)
  await screen.findByRole('heading', { name: 'Pergunte ou peça um app' })
  expect(localStorage.getItem(`conexus-remembered:${ANA.id}:companies`)).toBe(OTHER.id)
})

test('escolher a outra empresa na troca a faz a última lembrada (critério 6)', async () => {
  hub([COMPANY, OTHER])
  open(COMPANY)
  fireEvent.click(
    await screen.findByRole('button', { name: 'Trocar de empresa. Agora: Empresa Teste' }),
  )
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Outra Empresa' }))
  await screen.findByRole('button', { name: 'Trocar de empresa. Agora: Outra Empresa' })
  expect(localStorage.getItem(`conexus-remembered:${ANA.id}:companies`)).toBe(OTHER.id)
})
