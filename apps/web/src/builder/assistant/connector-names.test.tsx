import { CompanyId } from '@conexus/hub-api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import type { ReactNode } from 'react'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import { useConnectorCatalog } from './connector-names.ts'
import { SANKHYA } from './test-hub.tsx'

const server = hubServer()

function wrapper() {
  const client = new QueryClient()
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

test('o nome do conector fica o mesmo objeto enquanto o catálogo não muda', async () => {
  server.use(
    http.get('*/api/companies/:companyId/connections', () =>
      HttpResponse.json({ connectors: [SANKHYA], connections: [], mayManage: false }),
    ),
  )
  const { result, rerender } = renderHook(() => useConnectorCatalog(CompanyId.parse(COMPANY.id)), {
    wrapper: wrapper(),
  })
  expect(result.current.name('sankhya')).toBe('sankhya')
  await waitFor(() => expect(result.current.name('sankhya')).toBe('Sankhya'))
  const before = result.current.name
  rerender()
  expect(result.current.name).toBe(before)
})
