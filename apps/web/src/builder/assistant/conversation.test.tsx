import { ASSISTANT_TOOL, BUILDER_TOOL, createProject } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer, PEDIDOS, PEDIDOS_ADDRESS, refusal } from '../../platform/test-hub.tsx'
import {
  ASKED,
  assistantConversation,
  assistantScreens,
  COMPANY_ROOT,
  ELSEWHERE,
  PEDIDOS_ID,
  SALES,
  toolSaid,
} from './test-hub.tsx'

// A conversation with the Assistant: the bar, the rows, the address it lives at (step 24.1, criteria 23a to 26).
const server = hubServer()
const { at } = assistantScreens(server)
const OPEN = `${COMPANY_ROOT}/conversations/${ASKED}`

async function field() {
  return screen.findByRole('textbox', { name: 'Mensagem para o Assistente' })
}

async function barOf() {
  const bar = await screen.findByRole('group', { name: 'Ligações da conversa' })
  await waitFor(() => expect(within(bar).getByText('Sankhya · Vendas')).toBeTruthy())
  return bar
}

async function turnOff(bar: HTMLElement, name: string) {
  fireEvent.click(within(bar).getByRole('button', { name: 'Ajustar' }))
  fireEvent.click(await screen.findByRole('switch', { name }))
}

test('a conversa abre com a caixa do Assistente e a barra das ligações escolhidas', async () => {
  at(OPEN, { conversations: [assistantConversation()] })
  expect(await field()).toBeTruthy()
  expect(await screen.findByRole('heading', { name: 'Vendas da semana' })).toBeTruthy()
  const bar = await barOf()
  expect(within(bar).getByText('Sankhya · Estoque')).toBeTruthy()
})

test('tirar uma ligação da barra grava a escolha e a barra mostra o que o Hub respondeu', async () => {
  const { writes } = at(OPEN, { conversations: [assistantConversation()] })
  const bar = await barOf()
  await turnOff(bar, 'Sankhya · Estoque')
  await waitFor(() => expect(within(bar).queryByText('Sankhya · Estoque')).toBeNull())
  const [put] = writes()
  expect(put?.method).toBe('PUT')
  expect(put?.path).toMatch(/\/connections$/)
  expect(put?.body).toEqual({ connections: [SALES] })
  expect(within(bar).getByText('Sankhya · Vendas')).toBeTruthy()
})

test('o Hub recusar a troca devolve a barra à escolha de antes e diz que não confirmou', async () => {
  at(OPEN, {
    conversations: [assistantConversation()],
    answers: { choose: () => refusal('DATABASE_UNAVAILABLE') },
  })
  const bar = await barOf()
  await turnOff(bar, 'Sankhya · Estoque')
  expect(await screen.findByRole('alert')).toBeTruthy()
  await waitFor(() => expect(within(bar).getByText('Sankhya · Estoque')).toBeTruthy())
})

test('na conversa de um Projeto a barra oferece as ligações dele e o endereço é o do Projeto', async () => {
  at(`${COMPANY_ROOT}/projects/${PEDIDOS_ID}/assistant/${ASKED}`, {
    conversations: [assistantConversation({ projectId: PEDIDOS_ID })],
  })
  expect(await field()).toBeTruthy()
  await barOf()
})

test('a conversa de um Projeto no endereço da empresa não é encontrada', async () => {
  at(OPEN, { conversations: [assistantConversation({ projectId: PEDIDOS_ID })] })
  expect(await screen.findByText('Voltar ao início')).toBeTruthy()
  expect(screen.queryByRole('textbox', { name: 'Mensagem para o Assistente' })).toBeNull()
})

test('a conversa da empresa no endereço de um Projeto não é encontrada', async () => {
  at(`${COMPANY_ROOT}/projects/${PEDIDOS_ID}/assistant/${ASKED}`, {
    conversations: [assistantConversation()],
  })
  expect(await screen.findByText('Voltar ao início')).toBeTruthy()
})

test('uma conversa que não existe, ou que é de outra pessoa, não é encontrada', async () => {
  at(`${COMPANY_ROOT}/conversations/${ELSEWHERE}`, { conversations: [assistantConversation()] })
  expect(await screen.findByText('Voltar ao início')).toBeTruthy()
})

test('uma leitura de um sistema aparece como "Leu <Conector> · <ligação>" com as linhas', async () => {
  at(OPEN, {
    conversations: [
      assistantConversation({
        messages: [
          toolSaid(
            BUILDER_TOOL.connectorRead,
            { operation: 'sankhya.consultar', connection: 'Vendas' },
            { kind: 'OK', value: { linhas: [{}, {}, {}] }, complete: false },
          ),
        ],
      }),
    ],
  })
  expect(await screen.findByText(/Leu Sankhya · Vendas/)).toBeTruthy()
  expect(screen.getByText(/3 linhas, há mais/)).toBeTruthy()
})

test('uma leitura que o sistema recusou pede para conectar de novo, com o caminho para Integrações', async () => {
  at(OPEN, {
    conversations: [
      assistantConversation({
        messages: [
          toolSaid(
            BUILDER_TOOL.connectorRead,
            { operation: 'sankhya.consultar', connection: 'Vendas' },
            { kind: 'AUTH_REFUSED' },
          ),
        ],
      }),
    ],
  })
  expect(await screen.findByText(/Sankhya pediu para conectar de novo/)).toBeTruthy()
})

test('Criar app abre o nome do Projeto com o pedido resumido, e Cancelar não cria nada', async () => {
  const { writes } = at(OPEN, {
    conversations: [
      assistantConversation({
        messages: [
          toolSaid(
            ASSISTANT_TOOL.proposeApp,
            { summary: 'Um app de encomendas' },
            { summary: 'Um app de encomendas' },
          ),
        ],
      }),
    ],
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Criar app' }))
  const dialog = await screen.findByRole('dialog')
  expect(within(dialog).getByText('Um app de encomendas')).toBeTruthy()
  expect(within(dialog).getByLabelText('Nome do projeto')).toBeTruthy()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(writes()).toHaveLength(0)
})

test('Criar e começar cria o Projeto e abre o Builder com o pedido resumido enviado uma vez', async () => {
  const created: unknown[] = []
  server.use(
    http.post('*/api/companies/:companyId/projects', async ({ request }) => {
      created.push(await request.json())
      return HttpResponse.json(
        createProject.success.body.parse({
          project: {
            ...PEDIDOS,
            mayDelete: true,
            address: PEDIDOS_ADDRESS,
            appVersion: null,
            publishedVersion: null,
          },
        }),
        { status: 201 },
      )
    }),
  )
  const { conexus, writes } = at(OPEN, {
    conversations: [
      assistantConversation({
        messages: [
          toolSaid(
            ASSISTANT_TOOL.proposeApp,
            { summary: 'Um app de encomendas' },
            { summary: 'Um app de encomendas' },
          ),
        ],
      }),
    ],
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Criar app' }))
  const dialog = await screen.findByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('Nome do projeto'), {
    target: { value: 'Encomendas' },
  })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Criar e começar' }))
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toContain(
      `/projects/${PEDIDOS.id}/conversations/`,
    ),
  )
  expect(created).toHaveLength(1)
  await waitFor(() =>
    expect(writes().filter((one) => one.path.endsWith('/messages'))).toHaveLength(1),
  )
  expect(JSON.stringify(writes().find((one) => one.path.endsWith('/messages'))?.body)).toContain(
    'Um app de encomendas',
  )
})
