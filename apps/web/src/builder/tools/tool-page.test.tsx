import assert from 'node:assert/strict'
import type { ToolSummary, ToolVersionDetail } from '@conexus/hub-api'
import { ConnectionId, OperationId, ToolId, ToolVersionId } from '@conexus/hub-api'
import { cleanup, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { AREA, agent } from '../agents/test-agents.ts'
import { agentScreens } from '../agents/test-hub.tsx'

// A ferramenta em código na aba e na página da versão (step 24.4, U2, criterion 4).
const server = hubServer()
const { at } = agentScreens(server)
const TABS = `${AREA}/tools`
const CODE_TOOL = ToolId.parse('55555555-aaaa-4aaa-8aaa-555555555555')
const CODE_V1 = ToolVersionId.parse('66666666-aaaa-4aaa-8aaa-666666666666')
const SOURCE =
  'export default {\n  async fetch() {\n    return Response.json({ total: 5 })\n  },\n}'

const summary: ToolSummary = {
  kind: 'CODE',
  id: CODE_TOOL,
  slug: 'vendas_por_vendedor',
  connectionId: ConnectionId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  reads: [OperationId.parse('pedidos')],
  readLabels: { pedidos: 'Pedidos' },
  description: 'Soma as vendas de cada vendedor num mês.',
  connectionName: 'Matriz',
  effect: 'READ',
  latest: { id: CODE_V1, number: 1 },
  usedBy: [],
}

const version: ToolVersionDetail = {
  kind: 'CODE',
  id: CODE_V1,
  number: 1,
  description: summary.description,
  source: SOURCE,
  reads: [OperationId.parse('pedidos')],
  inputSchema: { type: 'object' },
  outputSchema: { type: 'object' },
  test: { passed: true, rows: 251, at: '2026-11-05T12:00:00.000Z' },
}

test('a lista marca a ferramenta Em código e não oferece Nova versão nela', async () => {
  at(TABS, { agents: [agent()], tools: [summary] })
  expect(await screen.findByText('vendas_por_vendedor')).toBeTruthy()
  expect(screen.getByText('Em código')).toBeTruthy()
  const row = screen.getByText('vendas_por_vendedor').closest('tr')
  assert.ok(row, 'the tool row')
  expect(within(row).getByText('Pedidos')).toBeTruthy()
  expect(screen.queryByRole('button', { name: /Nova versão/ })).toBeNull()
  expect(screen.getByRole('button', { name: 'Apagar vendas_por_vendedor' })).toBeTruthy()
})

test('a página da versão mostra o código e o resultado do teste; o membro, no mesmo endereço, recebe não encontrado', async () => {
  at(`${TABS}/${CODE_TOOL}`, { agents: [agent()], tools: [summary], toolVersions: [version] })
  expect(await screen.findByText('Versão 1')).toBeTruthy()
  expect(screen.getByText('Em código')).toBeTruthy()
  const code = screen.getByText(/Response\.json/)
  expect(code.textContent).toContain('total: 5')
  expect(screen.getByText('Teste passou · 251 linhas lidas')).toBeTruthy()
  expect(screen.getByText(/Lê: Matriz · Pedidos/)).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Nova versão' })).toBeNull()
  expect(within(document.body).queryByText(/"module"/)).toBeNull()
  cleanup()
  at(`${TABS}/${CODE_TOOL}`, { agents: [], member: true }, { role: 'member' })
  expect(await screen.findByText(/Não encontramos o que você procurou\./)).toBeTruthy()
})
