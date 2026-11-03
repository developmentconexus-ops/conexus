import type { ConstrutorResult } from '@conexus/hub-api'
import { CompanyId } from '@conexus/hub-api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createMemoryHistory, RouterContextProvider } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS, refusal } from '../../platform/test-hub.tsx'
import { DraftCard } from './draft-card.tsx'
import { AGENT, AREA, agent } from './test-agents.ts'

// O cartão do rascunho na conversa do Construtor (step 24.3, U5, criterion 26).
const server = hubServer()
const AGENT_PATH = `*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/agents/${AGENT}`

function card(result: ConstrutorResult) {
  const conexus = createConexus(createMemoryHistory({ initialEntries: [AREA] }))
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <RouterContextProvider router={conexus.router}>
        <DraftCard companyId={CompanyId.parse(COMPANY.id)} projectId={PEDIDOS.id} result={result} />
      </RouterContextProvider>
    </QueryClientProvider>,
  )
}

function saved(fields: Parameters<typeof agent>[0] = {}): ConstrutorResult {
  return { kind: 'SAVED', agent: agent(fields) }
}

test('mostra o nome, o que faz, o que lê, o estado, Abrir e Publicar', async () => {
  server.use(http.get(AGENT_PATH, () => HttpResponse.json({ agent: agent() })))
  card(saved())
  expect(await screen.findByText('Conferente de metas')).toBeTruthy()
  expect(screen.getByText('Compara as vendas de ontem com as metas.')).toBeTruthy()
  expect(screen.getByText('Lê: Sankhya · Matriz · vendas_de_ontem')).toBeTruthy()
  expect(screen.getByText('Rascunho')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Abrir' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Publicar' })).toBeTruthy()
})

test('Publicar manda o revision que o cartão mostrou', async () => {
  const bodies: unknown[] = []
  server.use(
    http.get(AGENT_PATH, () => HttpResponse.json({ agent: agent() })),
    http.post(`${AGENT_PATH}/publish`, async ({ request }) => {
      bodies.push(await request.json())
      return HttpResponse.json({
        agent: agent({ state: { kind: 'PUBLISHED', version: 1, changed: false } }),
        version: {
          number: 1,
          message: '',
          active: true,
          publishedAt: '2026-11-02T12:00:00.000Z',
          publishedBy: null,
        },
      })
    }),
  )
  card(saved({ revision: 5 }))
  fireEvent.click(await screen.findByRole('button', { name: 'Publicar' }))
  await waitFor(() => expect(bodies).toEqual([{ revision: 5, message: '' }]))
  expect(await screen.findByText('Versão 1 · publicada')).toBeTruthy()
})

test.each([
  ['AGENT_DRAFT_STALE', 'O rascunho mudou. Abra o agente para ver.'],
  ['AGENT_DRAFT_INVALID', 'Falta um campo para publicar.'],
] as const)('Publicar recusado com %s diz o motivo', async (code, text) => {
  server.use(
    http.get(AGENT_PATH, () => HttpResponse.json({ agent: agent() })),
    http.post(`${AGENT_PATH}/publish`, () => refusal(code)),
  )
  card(saved())
  fireEvent.click(await screen.findByRole('button', { name: 'Publicar' }))
  expect((await screen.findByRole('alert')).textContent).toBe(text)
})

test('agente apagado: o cartão diz e não oferece Abrir nem Publicar', async () => {
  server.use(http.get(AGENT_PATH, () => refusal('AGENT_NOT_FOUND')))
  card(saved())
  expect(await screen.findByText('Este agente foi apagado.')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Publicar' })).toBeNull()
  expect(screen.queryByRole('link', { name: 'Abrir' })).toBeNull()
})

test('o Construtor recusado: o cartão diz a frase do código', () => {
  card({ kind: 'REFUSED', code: 'AGENT_DRAFT_STALE' })
  expect(screen.getByText(/mudou/i)).toBeTruthy()
})
