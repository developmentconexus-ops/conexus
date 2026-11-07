import type { ToolSummary } from '@conexus/hub-api'
import { OperationId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { AGENT, AREA, agent, FILIAL, MATRIZ, TOOL, TOOL_V1, toolSummary } from './test-agents.ts'
import { bare, offered, readyOf } from './test-connection-tools.ts'
import { agentScreens } from './test-hub.tsx'
import { catalog } from './test-hub-tools.tsx'

// As ligações do agente como seletores, com as ferramentas embaixo (decisão E4, critério 24).
const server = hubServer()
const { at } = agentScreens(server)
const PAGE = `${AREA}/${AGENT}`

async function connections() {
  return within(await screen.findByRole('region', { name: 'Ligações' }))
}

test('selecionar a ligação mostra as ferramentas dela, nenhuma marcada, e a consulta livre no fim com o aviso', async () => {
  const hub = at(PAGE, { agents: [bare()], ready: readyOf(MATRIZ) })
  server.use(catalog)
  const section = await connections()
  expect(section.queryByRole('list', { name: 'Ferramentas de Matriz' })).toBeNull()
  fireEvent.click(await section.findByRole('checkbox', { name: /Sankhya · Matriz/ }))
  await waitFor(() => expect(hub.writes()).toHaveLength(1))
  expect(hub.writes()[0]?.body).toMatchObject({ connections: [MATRIZ] })
  const tools = within(await section.findByRole('list', { name: 'Ferramentas de Matriz' }))
  const boxes = tools.getAllByRole('checkbox')
  expect(boxes.map((box) => box.getAttribute('aria-checked'))).toEqual(['false', 'false', 'false'])
  const rows = tools.getAllByRole('listitem').map((row) => row.textContent)
  expect(rows).toEqual([
    'PedidosOs pedidos de venda.',
    'Contas a receberOs títulos a receber.',
    'ConsultaRoda uma consulta SQL de leitura.Consulta livre: roda qualquer SQL no banco inteiro',
  ])
})

test('sem selecionar, nenhuma ferramenta da ligação aparece', async () => {
  at(PAGE, { agents: [bare()], ready: readyOf(MATRIZ) })
  server.use(catalog)
  const section = await connections()
  expect(await section.findByRole('checkbox', { name: /Sankhya · Matriz/ })).toBeTruthy()
  expect(section.queryByText('Pedidos')).toBeNull()
})

test('tirar a seleção tira as ferramentas dela do rascunho', async () => {
  const hub = at(PAGE, { agents: [agent()] })
  server.use(catalog)
  const section = await connections()
  fireEvent.click(await section.findByRole('checkbox', { name: /Sankhya · Matriz/ }))
  await waitFor(() => expect(hub.writes()).toHaveLength(1))
  expect(hub.writes()[0]?.body).toMatchObject({ connections: [], tools: [] })
})

test('duas ligações do mesmo sistema: o nome da ligação titula o grupo', async () => {
  const two = bare({ offered: [offered(MATRIZ, 'Matriz'), offered(FILIAL, 'Filial')] })
  two.draft.connections = [MATRIZ, FILIAL]
  at(PAGE, { agents: [two], ready: [...readyOf(MATRIZ), ...readyOf(FILIAL)] })
  server.use(catalog)
  const section = await connections()
  expect((await section.findByRole('heading', { name: 'Matriz' })).tagName).toBe('H4')
  expect(section.getByRole('heading', { name: 'Filial' })).toBeTruthy()
})

test('uma ferramenta fora do papel de quem edita aparece sem poder marcar', async () => {
  const limited = bare({
    offered: [
      offered(MATRIZ, 'Matriz', [
        { operation: 'pedidos', label: 'Pedidos', summary: 'Os pedidos de venda.', allowed: true },
        {
          operation: 'contasAReceber',
          label: 'Contas a receber',
          summary: 'Os títulos.',
          allowed: false,
        },
      ]),
    ],
  })
  limited.draft.connections = [MATRIZ]
  at(PAGE, { agents: [limited], ready: readyOf(MATRIZ) })
  server.use(catalog)
  const section = await connections()
  const box = await section.findByRole('checkbox', { name: /Contas a receber/ })
  expect(box.hasAttribute('disabled') || box.getAttribute('aria-disabled') === 'true').toBe(true)
  expect(section.getByText('Fora do seu papel')).toBeTruthy()
})

test('a consulta livre fica no fim mesmo quando o Projeto a oferece primeiro', async () => {
  const first = bare({
    offered: [
      offered(MATRIZ, 'Matriz', [
        {
          ...{ operation: 'consultar', label: 'Consulta', summary: 'Roda uma consulta SQL.' },
          allowed: true,
        },
        { operation: 'pedidos', label: 'Pedidos', summary: 'Os pedidos de venda.', allowed: true },
      ]),
    ],
  })
  first.draft.connections = [MATRIZ]
  at(PAGE, { agents: [first], ready: readyOf(MATRIZ) })
  server.use(catalog)
  const section = await connections()
  const tools = within(await section.findByRole('list', { name: 'Ferramentas de Matriz' }))
  const rows = tools.getAllByRole('listitem').map((row) => row.textContent)
  expect(rows[0]).toContain('Pedidos')
  expect(rows[1]).toContain('Consulta')
})

test('uma lista só: a ferramenta de uma ligação não selecionada não aparece em lugar nenhum', async () => {
  const held = bare()
  at(PAGE, { agents: [held], ready: readyOf(MATRIZ) })
  server.use(catalog)
  const section = await connections()
  await section.findByRole('checkbox', { name: /Sankhya · Matriz/ })
  expect(screen.queryByRole('list', { name: 'Ferramentas de Matriz' })).toBeNull()
  expect(screen.queryByRole('checkbox', { name: /Pedidos/ })).toBeNull()
  expect(screen.queryByText(/vendas_de_ontem/)).toBeNull()
  fireEvent.click(
    within(screen.getByRole('region', { name: 'Ferramentas' })).getByRole('button', {
      name: 'Adicionar da biblioteca',
    }),
  )
  const dialog = within(await screen.findByRole('dialog'))
  expect(await dialog.findByRole('switch', { name: 'Pesquisar na web' })).toBeTruthy()
  expect(dialog.queryByRole('switch', { name: /Pedidos/ })).toBeNull()
})

const COMPANY_TOOL = {
  kind: 'CODE',
  id: TOOL,
  slug: 'titulos_da_empresa',
  connectionId: MATRIZ,
  description: 'Títulos a receber da empresa 1.',
  connectionName: 'Matriz',
  effect: 'READ',
  latest: { id: TOOL_V1, number: 1 },
  usedBy: [],
  reads: [OperationId.parse('contasAReceber')],
  readLabels: { contasAReceber: 'Contas a receber' },
} satisfies ToolSummary

function limited(allowedContas: boolean) {
  const page = bare({
    offered: [
      offered(MATRIZ, 'Matriz', [
        { operation: 'pedidos', label: 'Pedidos', summary: 'Os pedidos.', allowed: true },
        {
          ...{ operation: 'contasAReceber', label: 'Contas a receber', summary: 'Os títulos.' },
          allowed: allowedContas,
        },
        {
          ...{ operation: 'carregar', label: 'Leitura genérica', summary: 'Carrega registros.' },
          allowed: true,
        },
        {
          ...{ operation: 'consultar', label: 'Consulta', summary: 'Roda uma consulta SQL.' },
          allowed: true,
        },
      ]),
    ],
  })
  page.draft.connections = [MATRIZ]
  return page
}

test('uma ferramenta da empresa que lê fora do papel aparece travada, depois das leituras do kit e antes da consulta livre, sem repetir a descrição', async () => {
  at(PAGE, { agents: [limited(false)], tools: [COMPANY_TOOL] })
  server.use(catalog)
  const tools = within(
    await (await connections()).findByRole('list', { name: 'Ferramentas de Matriz' }),
  )
  const rows = (await tools.findAllByRole('listitem')).map((row) => row.textContent)
  expect(rows).toEqual([
    'PedidosOs pedidos.',
    'Contas a receberFora do seu papel',
    'Leitura genéricaCarrega registros.',
    'Títulos a receber da empresa 1.Fora do seu papel',
    'ConsultaRoda uma consulta SQL.Consulta livre: roda qualquer SQL no banco inteiro',
  ])
  const box = tools.getByRole('checkbox', { name: /Títulos a receber da empresa 1/ })
  expect(box.hasAttribute('disabled') || box.getAttribute('aria-disabled') === 'true').toBe(true)
})

test('uma ferramenta da empresa que o papel tem mostra o que lê, não a descrição outra vez, e marca', async () => {
  const hub = at(PAGE, { agents: [limited(true)], tools: [COMPANY_TOOL] })
  server.use(catalog)
  const tools = within(
    await (await connections()).findByRole('list', { name: 'Ferramentas de Matriz' }),
  )
  const row = (await tools.findByRole('checkbox', { name: /Títulos a receber/ })).closest('li')
  expect(row?.textContent).toBe('Títulos a receber da empresa 1.Lê Contas a receber')
  fireEvent.click(tools.getByRole('checkbox', { name: /Títulos a receber/ }))
  await waitFor(() => expect(hub.writes()).toHaveLength(1))
  expect(hub.writes()[0]?.body).toMatchObject({ tools: [TOOL_V1] })
})

test('uma leitura já marcada e fora do papel se desmarca; a que não está marcada não se marca', async () => {
  const marked = limited(false)
  const [base] = agent().tools
  if (base?.kind !== 'PRESET') throw new Error('o agente de teste leva uma ferramenta do kit')
  const contas = OperationId.parse('contasAReceber')
  marked.tools = [{ ...base, operation: contas }]
  const hub = at(PAGE, {
    agents: [marked],
    tools: [toolSummary({ operation: contas })],
    ready: readyOf(MATRIZ),
  })
  server.use(catalog)
  const section = await connections()
  const box = await section.findByRole('checkbox', { name: /Contas a receber/ })
  expect(box.getAttribute('aria-checked')).toBe('true')
  expect(box.hasAttribute('disabled')).toBe(false)
  fireEvent.click(box)
  await waitFor(() => expect(hub.writes()).toHaveLength(1))
  expect(hub.writes()[0]?.body).toMatchObject({ tools: [] })
})

test('um rascunho antigo com ferramenta de ligação não selecionada mostra a ligação selecionada e a ferramenta', async () => {
  const old = agent({ offered: [offered(MATRIZ, 'Matriz')] })
  old.draft.connections = []
  at(PAGE, { agents: [old], ready: readyOf(MATRIZ), tools: [toolSummary()] })
  server.use(catalog)
  const section = await connections()
  const box = await section.findByRole('checkbox', { name: /Sankhya · Matriz/ })
  expect(box.getAttribute('aria-checked')).toBe('true')
  const pedidos = await section.findByRole('checkbox', { name: /Pedidos/ })
  expect(pedidos.getAttribute('aria-checked')).toBe('true')
})
