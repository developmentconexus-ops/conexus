import { CompanyId } from '@conexus/hub-api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import type { ReactNode } from 'react'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import { KIT_SANKHYA } from '../../platform/test-kit.ts'
import { useConnectorCatalog } from './connector-catalog.ts'
import { wordsOf } from './connector-words.ts'
import { appBuilderRoom } from './room.ts'

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
      HttpResponse.json({ connectors: [KIT_SANKHYA], connections: [], mayManage: false }),
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

test('a sala do Builder toma do catálogo o nome e a logo, e a recusa de conector segue a do Builder', () => {
  const room = appBuilderRoom(wordsOf([KIT_SANKHYA]), CompanyId.parse(COMPANY.id), () => undefined)
  expect(room.connectors.name('sankhya')).toBe('Sankhya')
  expect(room.connectors.logo('sankhya')).toBe(KIT_SANKHYA.logo)
  expect(room.connectors.refusal('sankhya', { kind: 'UNREACHABLE' })).toBe(
    'Não conseguiu ler o sistema da empresa.',
  )
})
