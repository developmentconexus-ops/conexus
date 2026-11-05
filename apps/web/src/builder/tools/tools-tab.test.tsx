import { ProjectId } from '@conexus/hub-api'
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS, refusal } from '../../platform/test-hub.tsx'
import {
  AGENT,
  AREA,
  agent,
  OTHER_AGENT,
  TOOL,
  TOOL_V1,
  toolSummary,
} from '../agents/test-agents.ts'
import { agentScreens } from '../agents/test-hub.tsx'

// A aba Ferramentas da área Agentes (step 24.3.1, U7, criterion 32).
const server = hubServer()
const { at } = agentScreens(server)
const TABS = `${AREA}/tools`
const ESTOQUE = ProjectId.parse('e'.repeat(32))
const USERS = [
  { id: AGENT, projectId: PEDIDOS.id, name: 'Conferente de metas' },
  { id: OTHER_AGENT, projectId: ESTOQUE, name: 'Resumo de estoque' },
]

test('Apagar uma ferramenta usada recebe TOOL_IN_USE e mostra os agentes, sem tirá-la da lista', async () => {
  const hub = at(TABS, { agents: [agent()], tools: [toolSummary({ usedBy: USERS })] })
  const row = (await screen.findByText('vendas_de_ontem')).closest('tr')
  if (row === null) throw new Error('a ferramenta não está numa linha')
  fireEvent.click(within(row).getByRole('button', { name: 'Apagar vendas_de_ontem' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar ferramenta' }))
  const said = await screen.findByText(/^Usada por /)
  expect(said.textContent).toBe('Usada por Conferente de metas, Resumo de estoque.')
  expect(within(said).getByRole('link', { name: 'Conferente de metas' }).getAttribute('href')).toBe(
    `${AREA}/${AGENT}`,
  )
  expect(within(said).getByRole('link', { name: 'Resumo de estoque' }).getAttribute('href')).toBe(
    `/companies/${COMPANY.id}/projects/${ESTOQUE}/agents/${OTHER_AGENT}`,
  )
  expect(screen.getByText('Conferente de metas · Resumo de estoque')).toBeTruthy()
  expect(screen.getByText('vendas_de_ontem')).toBeTruthy()
  expect(hub.writes().map((one) => one.method)).toEqual(['DELETE'])
})

test('Apagar uma ferramenta que o Hub já não acha (TOOL_NOT_FOUND) a tira da lista, relida', async () => {
  const tools = [toolSummary()]
  at(TABS, { agents: [agent()], tools })
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar vendas_de_ontem' }))
  tools.length = 0
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar ferramenta' }))
  expect(await screen.findByText(/^Nenhuma ferramenta ainda\./)).toBeTruthy()
})

test('Apagar uma ferramenta que ninguém usa a tira da lista', async () => {
  at(TABS, { agents: [agent()], tools: [toolSummary()] })
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar vendas_de_ontem' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar ferramenta' }))
  expect(await screen.findByText(/^Nenhuma ferramenta ainda\./)).toBeTruthy()
})

test('a lista é uma tabela com Ferramenta, Lê de, Efeito, Usada por e Versão', async () => {
  at(TABS, {
    agents: [agent()],
    tools: [toolSummary({ latest: { id: TOOL_V1, number: 3 }, usedBy: USERS })],
  })
  const row = (await screen.findByText('vendas_de_ontem')).closest('tr')
  if (row === null) throw new Error('a ferramenta não está numa linha')
  expect(within(row).getByText('Vendas de ontem por vendedor.')).toBeTruthy()
  expect(within(row).getByText('Matriz')).toBeTruthy()
  expect(within(row).getByText('Pedidos')).toBeTruthy()
  expect(within(row).getByText('Lê')).toBeTruthy()
  expect(within(row).getByText('v3')).toBeTruthy()
  expect(within(row).getByText('Conferente de metas · Resumo de estoque')).toBeTruthy()
  const heads = screen.getAllByRole('columnheader').map((one) => one.textContent)
  expect(heads).toEqual(['Ferramenta', 'Lê de', 'Efeito', 'Usada por', 'Versão', 'Ações'])
})

test('sem ferramenta, a aba diz que nenhuma existe ainda', async () => {
  at(TABS, { agents: [], tools: [] })
  expect(
    await screen.findByText(
      'Nenhuma ferramenta ainda. O Construtor faz as primeiras quando monta um agente.',
    ),
  ).toBeTruthy()
})

test('a leitura que falha diz a frase da falha, e Tentar de novo lê outra vez', async () => {
  let failing = true
  at(TABS, {
    agents: [agent()],
    tools: [toolSummary()],
    answers: { tools: () => (failing ? refusal('DATABASE_UNAVAILABLE') : undefined) },
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }))
  failing = false
  expect(await screen.findByText('vendas_de_ontem')).toBeTruthy()
})

test('o dono vê a aba; o membro, no mesmo endereço, recebe não encontrado', async () => {
  at(TABS, { agents: [], tools: [toolSummary()] })
  expect(await screen.findByText('vendas_de_ontem')).toBeTruthy()
  cleanup()
  at(TABS, { agents: [], member: true }, { role: 'member' })
  expect(await screen.findByText(/Não encontramos o que você procurou\./)).toBeTruthy()
})

test('Nova versão abre o formulário com a versão de agora e grava a seguinte', async () => {
  const hub = at(`${TABS}/${TOOL}`, {
    agents: [agent()],
    tools: [toolSummary()],
    toolVersions: [
      {
        id: TOOL_V1,
        number: 1,
        description: 'Vendas de ontem por vendedor.',
        bound: { dias: 1 },
        open: ['vendedor'],
      },
    ],
  })
  expect(await screen.findByText('Versão 1')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Nova versão' }))
  const bound = await screen.findByRole<HTMLTextAreaElement>('textbox', {
    name: 'Valores fixos (JSON)',
  })
  expect(JSON.parse(bound.value)).toEqual({ dias: 1 })
  expect(screen.queryByRole('combobox', { name: 'Ligação' })).toBeNull()
  const kept = within(screen.getByRole('dialog'))
  expect(kept.getByText('Matriz')).toBeTruthy()
  expect(kept.getByText('Pedidos')).toBeTruthy()
  fireEvent.change(bound, { target: { value: '{"dias": 7}' } })
  fireEvent.click(screen.getByRole('button', { name: 'Gravar versão' }))
  expect(await screen.findByText('Versão 2')).toBeTruthy()
  const [sent] = hub.writes()
  expect(sent?.path).toMatch(/\/tools\/.+\/versions$/)
  expect(sent?.body).toMatchObject({ bound: { dias: 7 }, open: ['vendedor'] })
  expect(sent?.key).not.toBeNull()
})

test('Nova versão na linha da lista abre o formulário da ferramenta, sem sair da lista', async () => {
  at(TABS, {
    agents: [agent()],
    tools: [toolSummary()],
    toolVersions: [
      {
        id: TOOL_V1,
        number: 1,
        description: 'Vendas de ontem por vendedor.',
        bound: { dias: 1 },
        open: ['vendedor'],
      },
    ],
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Nova versão de vendas_de_ontem' }))
  const bound = await screen.findByRole<HTMLTextAreaElement>('textbox', {
    name: 'Valores fixos (JSON)',
  })
  expect(JSON.parse(bound.value)).toEqual({ dias: 1 })
  expect(screen.getByRole('button', { name: 'Gravar versão' })).toBeTruthy()
})

test('uma ferramenta que o Hub não acha dá não encontrado, e a que ele acha abre', async () => {
  at(`${TABS}/${TOOL}`, { agents: [agent()], tools: [toolSummary()] })
  expect(await screen.findByText('Versão 1')).toBeTruthy()
  cleanup()
  at(`${TABS}/${TOOL}`, { agents: [agent()], tools: [] })
  expect(await screen.findByText(/Não encontramos o que você procurou\./)).toBeTruthy()
})

test('Apagar pede a confirmação com o nome da ferramenta, e Cancelar não grava nada', async () => {
  const hub = at(TABS, { agents: [agent()], tools: [toolSummary()] })
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar vendas_de_ontem' }))
  expect(await screen.findByText('Apagar vendas_de_ontem?')).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByText('Apagar vendas_de_ontem?')).toBeNull())
  expect(hub.writes()).toHaveLength(0)
  expect(screen.getByText('vendas_de_ontem')).toBeTruthy()
})
