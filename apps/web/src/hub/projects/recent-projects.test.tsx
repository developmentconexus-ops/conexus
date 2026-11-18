import { CompanyId, PersonId } from '@conexus/hub-api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { PEDIDOS } from '../../platform/test-hub.tsx'
import { rememberProject, useRecentProjects } from './recent-projects.tsx'

const companyId = CompanyId.parse(COMPANY.id)
const personId = PersonId.parse(ANA.id)

beforeEach(() => globalThis.localStorage.clear())

function Names() {
  const recent = useRecentProjects(companyId, personId, [PEDIDOS])
  return <p>{recent.map((project) => project.name).join(', ') || 'nenhum'}</p>
}

test('um seletor já montado mostra o Projeto que se grava depois, sem outra renderização por fora (roteiro de uso 5)', () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Names />
    </QueryClientProvider>,
  )
  expect(screen.getByText('nenhum')).toBeTruthy()
  act(() => rememberProject({ personId, companyId, projectId: PEDIDOS.id }))
  expect(screen.getByText(PEDIDOS.name)).toBeTruthy()
})

test('outra aba que grava a lista também aparece no seletor montado (evento storage)', () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <Names />
    </QueryClientProvider>,
  )
  expect(screen.getByText('nenhum')).toBeTruthy()
  act(() => {
    globalThis.localStorage.setItem(
      `conexus-remembered:${personId}:projects.${companyId}`,
      PEDIDOS.id,
    )
    globalThis.dispatchEvent(new StorageEvent('storage'))
  })
  expect(screen.getByText(PEDIDOS.name)).toBeTruthy()
})
