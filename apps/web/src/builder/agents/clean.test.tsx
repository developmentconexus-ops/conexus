import { OperationId } from '@conexus/hub-api'
import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { onPhone } from '../conversation/test-hub.tsx'
import { AGENT, AREA, agent, MATRIZ, TEST_CHAT, toolSummary } from './test-agents.ts'
import { agentScreens } from './test-hub.tsx'

// As telas de Agentes mais limpas (step 24.3, conserto C1 a C11): uma linha por coisa, o nome e o estado.
const server = hubServer()
const { at } = agentScreens(server)
const PAGE = `${AREA}/${AGENT}`

function ready(operation: string, label: string) {
  return {
    connectionId: MATRIZ,
    operation: OperationId.parse(operation),
    label,
    summary: `Texto para o modelo de ${label}: a página começa em 0.`,
    slug: `${operation}_aaaaaa`,
  }
}

test('Escolher lista pelo nome da leitura, em dois grupos, sem o texto do modelo nem o slug', async () => {
  at(PAGE, {
    agents: [agent({ tools: [] })],
    tools: [toolSummary()],
    ready: [ready('pedidos', 'Pedidos'), ready('clientes', 'Clientes')],
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Escolher' }))
  const dialog = await screen.findByRole('dialog')
  expect(await within(dialog).findByRole('switch', { name: /Pedidos/ })).toBeTruthy()
  expect(within(dialog).getByRole('region', { name: 'Da biblioteca' })).toBeTruthy()
  expect(within(dialog).getByRole('region', { name: 'Prontas do conector' })).toBeTruthy()
  expect(within(dialog).queryByText(/a página começa em 0/)).toBeNull()
  expect(within(dialog).queryByText(/pedidos_aaaaaa/)).toBeNull()
  expect(within(dialog).queryByRole('checkbox')).toBeNull()
  expect(within(dialog).queryByRole('searchbox')).toBeNull()
})

test('Escolher busca a partir de sete linhas', async () => {
  const labels = ['Pedidos', 'Clientes', 'Vendedores', 'Metas', 'Estoque', 'Notas', 'Empresas']
  at(PAGE, {
    agents: [agent({ tools: [] })],
    ready: labels.map((label) => ready(label.toLowerCase(), label)),
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Escolher' }))
  const dialog = await screen.findByRole('dialog')
  fireEvent.change(await within(dialog).findByRole('searchbox', { name: 'Buscar ferramenta' }), {
    target: { value: 'metas' },
  })
  expect(within(dialog).getAllByRole('switch')).toHaveLength(1)
})

test('a ferramenta pronta do painel tem o nome da leitura; a feita à mão, a descrição', async () => {
  const pronta = agent().tools[0]
  if (pronta === undefined) throw new Error('the fixture has a tool')
  at(PAGE, {
    agents: [
      agent({
        tools: [{ ...pronta, version: { ...pronta.version, description: 'Pedidos de venda' } }],
      }),
    ],
  })
  const panel = await screen.findByRole('region', { name: 'Configuração' })
  expect(await within(panel).findByText('Pedidos')).toBeTruthy()
  expect(within(panel).queryByText('vendas_de_ontem')).toBeNull()
})

test('sem conversa aberta, o meio da página diz uma frase', async () => {
  at(PAGE, { agents: [agent()] })
  expect(await screen.findByText('Escolha uma conversa ou comece uma nova.')).toBeTruthy()
})

test('Apagar fica só no menu ⋯, também no computador', async () => {
  at(PAGE, { agents: [agent()] })
  await screen.findByRole('button', { name: /^Mais ações/ })
  expect(screen.queryByRole('button', { name: 'Apagar' })).toBeNull()
})

test('Publicar é o botão principal da página', async () => {
  at(PAGE, { agents: [agent()] })
  const publish = await screen.findByRole('button', { name: 'Publicar' })
  expect(publish.className).toContain('bg-ink')
})

test('a conversa de teste fica na folha branca', async () => {
  at(`${PAGE}/${TEST_CHAT}`, {
    agents: [agent()],
    conversations: [
      {
        id: TEST_CHAT,
        agentId: AGENT,
        draft: true,
        title: 'x',
        updatedAt: '2026-11-02T12:00:00.000Z',
      },
    ],
  })
  const box = (await screen.findAllByRole('textbox', { name: /^Mensagem para/ }))[0]
  expect(box?.closest('.bg-surface, .bg-canvas')?.className).toContain('bg-surface')
})

test('o formulário Criar usa os seletores da Pauta, não os do navegador', async () => {
  at(PAGE, { agents: [agent({ tools: [] })] })
  fireEvent.click(await screen.findByRole('button', { name: 'Criar' }))
  const dialog = await screen.findByRole('dialog')
  expect(within(dialog).getByRole('combobox', { name: 'Ligação' })).toBeTruthy()
  expect(dialog.querySelector('select')).toBeNull()
})

test('a caixa do Construtor mostra o Projeto fixo e o modelo que responde', async () => {
  at(AREA, { agents: [] })
  await screen.findByRole('textbox', { name: 'Mensagem para o Construtor' })
  expect(screen.getByText('Claude Sonnet 4')).toBeTruthy()
})

test('no celular, Apagar também fica no menu ⋯', async () => {
  await onPhone(async () => {
    at(PAGE, { agents: [agent()] })
    expect(await screen.findByRole('button', { name: /^Mais ações/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Apagar' })).toBeNull()
  })
})
