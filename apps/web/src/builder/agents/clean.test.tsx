import { OperationId } from '@conexus/hub-api'
import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer, PEDIDOS } from '../../platform/test-hub.tsx'
import { onPhone } from '../conversation/test-hub.tsx'
import { AGENT, AREA, agent, BUILDER_CHAT, MATRIZ, TEST_CHAT, toolSummary } from './test-agents.ts'
import { agentScreens } from './test-hub.tsx'
import { TEST_BANNER } from './text.ts'

// As telas de Agentes mais limpas (step 24.3, conserto C1 a C11): uma linha por coisa, o nome e o estado.
const server = hubServer()
const { at } = agentScreens(server)
const PAGE = `${AREA}/${AGENT}`

/** The form of the Construtor's box: its model button sits inside it, and no Projeto (the person is already in one). */
async function construtorBox() {
  const form = (await screen.findByRole('textbox', { name: 'Mensagem para o Construtor' })).closest(
    'form',
  )
  if (form === null) throw new Error('the box has no form')
  return form
}

function ready(operation: string, label: string) {
  return {
    connectionId: MATRIZ,
    operation: OperationId.parse(operation),
    label,
    summary: `Texto para o modelo de ${label}: a página começa em 0.`,
    slug: `${operation}_aaaaaa`,
  }
}

test('Adicionar da biblioteca lista pelo nome da leitura, por origem, sem o texto do modelo nem o slug', async () => {
  at(PAGE, {
    agents: [agent({ tools: [] })],
    tools: [toolSummary()],
    ready: [ready('pedidos', 'Pedidos'), ready('clientes', 'Clientes')],
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Adicionar da biblioteca' }))
  const dialog = await screen.findByRole('dialog')
  expect(await within(dialog).findByRole('switch', { name: /Pedidos/ })).toBeTruthy()
  expect(within(dialog).getByRole('region', { name: 'Da biblioteca' })).toBeTruthy()
  expect(within(dialog).getByRole('region', { name: 'Sankhya · prontas do conector' })).toBeTruthy()
  expect(within(dialog).queryByText(/a página começa em 0/)).toBeNull()
  expect(within(dialog).queryByText(/pedidos_aaaaaa/)).toBeNull()
  expect(within(dialog).queryByRole('checkbox')).toBeNull()
  expect(within(dialog).queryByRole('searchbox')).toBeNull()
})

test('Adicionar da biblioteca busca a partir de sete linhas', async () => {
  const labels = ['Pedidos', 'Clientes', 'Vendedores', 'Metas', 'Estoque', 'Notas', 'Empresas']
  at(PAGE, {
    agents: [agent({ tools: [] })],
    ready: labels.map((label) => ready(label.toLowerCase(), label)),
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Adicionar da biblioteca' }))
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
  const panel = await screen.findByRole('region', { name: 'Ferramentas' })
  expect(await within(panel).findByText('Pedidos')).toBeTruthy()
  expect(within(panel).queryByText('vendas_de_ontem')).toBeNull()
})

test('a ferramenta feita à mão mostra o nome dela junto da descrição, para distinguir duas parecidas', async () => {
  at(PAGE, { agents: [agent()] })
  const panel = await screen.findByRole('region', { name: 'Ferramentas' })
  expect(await within(panel).findByText('Vendas de ontem por vendedor.')).toBeTruthy()
  expect(within(panel).getByText('vendas_de_ontem')).toBeTruthy()
})

test('sem conversa aberta, o painel de teste diz a frase da matriz e traz os dois botões', async () => {
  at(PAGE, { agents: [agent()] })
  const panel = await screen.findByRole('region', { name: 'Testar' })
  expect(await within(panel).findByText('Ainda não há conversas com este agente.')).toBeTruthy()
  expect(within(panel).getByRole('button', { name: 'Testar rascunho' })).toBeTruthy()
  expect(screen.queryByText('Escolha uma conversa ou comece uma nova.')).toBeNull()
})

test('Apagar fica só no menu ⋯, também no computador', async () => {
  at(PAGE, { agents: [agent()] })
  await screen.findByRole('button', { name: /^Mais ações/ })
  expect(screen.queryByRole('button', { name: 'Apagar' })).toBeNull()
})

test('Publicar é o botão principal da página', async () => {
  at(PAGE, { agents: [agent()] })
  const publish = await screen.findByRole('button', { name: /^Publicar v\d/ })
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
  // The root of the conversation is the banner's parent, not a surface piece of the box inside it.
  const root = (await screen.findByText(TEST_BANNER)).parentElement
  expect(root?.className).toContain('bg-surface')
  expect(root?.className).not.toContain('bg-canvas')
})

test('a conversa com o Construtor fica na folha branca, com o botão do modelo na caixa e sem o Projeto', async () => {
  at(`${AREA}/construtor/${BUILDER_CHAT}`, {
    agents: [],
    construtor: [{ id: BUILDER_CHAT, title: 'Meu agente', updatedAt: '2026-11-02T12:00:00.000Z' }],
  })
  const title = await screen.findByRole('heading', { level: 1, name: 'Meu agente' })
  const root = title.parentElement?.parentElement
  expect(root?.className).toContain('bg-surface')
  expect(root?.className).not.toContain('bg-canvas')
  const form = await construtorBox()
  expect(await within(form).findByRole('combobox', { name: 'Modelo e raciocínio' })).toBeTruthy()
  expect(within(form).queryByText(PEDIDOS.name)).toBeNull()
})

test('o formulário Criar usa os seletores da Pauta, não os do navegador', async () => {
  at(PAGE, { agents: [agent({ tools: [] })] })
  fireEvent.click(await screen.findByRole('button', { name: 'Criar' }))
  const dialog = await screen.findByRole('dialog')
  expect(within(dialog).getByRole('combobox', { name: 'Ligação' })).toBeTruthy()
  expect(dialog.querySelector('select')).toBeNull()
})

test('a caixa do Construtor tem o botão do modelo e do raciocínio e não mostra o Projeto', async () => {
  at(AREA, { agents: [] })
  const form = await construtorBox()
  expect(await within(form).findByRole('combobox', { name: 'Modelo e raciocínio' })).toBeTruthy()
  expect(within(form).queryByText(PEDIDOS.name)).toBeNull()
})

test('no celular, Apagar também fica no menu ⋯', async () => {
  await onPhone(async () => {
    at(PAGE, { agents: [agent()] })
    expect(await screen.findByRole('button', { name: /^Mais ações/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Apagar' })).toBeNull()
  })
})
