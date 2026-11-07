import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { AGENT, AREA, agent, FILIAL, MATRIZ } from './test-agents.ts'
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
        { operation: 'pedidos', label: 'Pedidos', summary: 'Os pedidos de venda.' },
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
        { operation: 'consultar', label: 'Consulta', summary: 'Roda uma consulta SQL.' },
        { operation: 'pedidos', label: 'Pedidos', summary: 'Os pedidos de venda.' },
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
  const held = agent({ offered: [offered(MATRIZ, 'Matriz')] })
  held.draft.connections = []
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
