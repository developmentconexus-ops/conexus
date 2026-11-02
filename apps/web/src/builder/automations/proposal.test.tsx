import type { AutomationSummary, ProjectId } from '@conexus/hub-api'
import { ASSISTANT_TOOL, automationPath, CompanyId } from '@conexus/hub-api'
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS, projectsRead, refusal } from '../../platform/test-hub.tsx'
import {
  ASKED,
  assistantConversation,
  assistantScreens,
  COMPANY_ROOT,
  SALES,
  toolSaid,
} from '../assistant/test-hub.tsx'
import { cadenceText } from './cadence-text.ts'
import { automationsQuery } from './queries.ts'
import { automation, automationsHub, RESUMO } from './test-hub.tsx'

// Criar automação: the automation the Assistant proposed, created by one touch (step 24.2, criterion 18).
const server = hubServer()
const { at } = assistantScreens(server)
const OPEN = `${COMPANY_ROOT}/conversations/${ASKED}`
const PROPOSAL = {
  name: 'Resumo de vendas',
  prompt: 'Resuma as vendas de ontem, por vendedor.',
  cadence: { kind: 'DAILY', time: '07:00' },
  connections: [SALES],
}
const KEY = /^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

function proposing(projectId: ProjectId | null = null) {
  return assistantConversation({
    projectId,
    messages: [toolSaid(ASSISTANT_TOOL.proposeAutomation, PROPOSAL, PROPOSAL)],
  })
}

test('a cadência em português: todo dia, dias úteis, os dias da semana e o dia do mês', () => {
  expect(cadenceText({ kind: 'DAILY', time: '07:00' })).toBe('Todo dia às 07:00')
  expect(cadenceText({ kind: 'WEEKDAYS', time: '08:30' })).toBe('Dias úteis às 08:30')
  expect(cadenceText({ kind: 'WEEKLY', days: ['MON'], time: '08:00' })).toBe('Segunda às 08:00')
  expect(cadenceText({ kind: 'WEEKLY', days: ['THU', 'MON'], time: '08:00' })).toBe(
    'Segunda e quinta às 08:00',
  )
  expect(cadenceText({ kind: 'WEEKLY', days: ['FRI', 'MON', 'WED'], time: '08:00' })).toBe(
    'Segunda, quarta e sexta às 08:00',
  )
  expect(cadenceText({ kind: 'MONTHLY', day: 5, time: '09:00' })).toBe('Todo dia 5 às 09:00')
})

test('o cartão mostra o nome, a cadência, o lugar, as ligações e o pedido, e nada é criado antes do toque', async () => {
  const hub = automationsHub(server, { automations: [] })
  at(OPEN, { conversations: [proposing()] })
  expect(await screen.findByText('Resumo de vendas')).toBeTruthy()
  expect(screen.getByText(/Todo dia às 07:00 · Início · Vendas/)).toBeTruthy()
  expect(screen.getByText('Resuma as vendas de ontem, por vendedor.')).toBeTruthy()
  expect(hub.writes()).toHaveLength(0)
})

test('Criar automação cria com uma chave de tentativa, vira "Automação criada" com o caminho, e dois toques criam uma', async () => {
  const hub = automationsHub(server, { automations: [] })
  at(OPEN, { conversations: [proposing()] })
  const button = await screen.findByRole('button', { name: 'Criar automação' })
  fireEvent.click(button)
  fireEvent.click(button)
  expect(await screen.findByText('Automação criada')).toBeTruthy()
  expect(hub.writes()).toHaveLength(1)
  const [write] = hub.writes()
  expect(write?.key).toMatch(KEY)
  expect(write?.body).toEqual({
    name: 'Resumo de vendas',
    prompt: 'Resuma as vendas de ontem, por vendedor.',
    cadence: { kind: 'DAILY', time: '07:00' },
    connections: [SALES],
    origin: { conversationId: ASKED, toolCallId: expect.any(String) },
  })
  const link = screen.getByRole('link', { name: 'Ver automação' })
  expect(link.getAttribute('href')).toMatch(
    /^\/companies\/a+\/automations\/schedule_conexus-automation-/,
  )
})

test('recarregar a conversa depois de criar mostra "Automação criada" e não escreve de novo', async () => {
  const hub = automationsHub(server, { automations: [] })
  at(OPEN, { conversations: [proposing()] })
  fireEvent.click(await screen.findByRole('button', { name: 'Criar automação' }))
  await screen.findByText('Automação criada')
  cleanup()
  at(OPEN, { conversations: [proposing()] })
  expect(await screen.findByText('Automação criada')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Criar automação' })).toBeNull()
  expect(screen.getByRole('link', { name: 'Ver automação' })).toBeTruthy()
  expect(hub.writes()).toHaveLength(1)
})

test('a automação apagada devolve o cartão a "Criar automação", com a mesma chave de tentativa', async () => {
  const hub = automationsHub(server, { automations: [] })
  at(OPEN, { conversations: [proposing()] })
  fireEvent.click(await screen.findByRole('button', { name: 'Criar automação' }))
  await screen.findByText('Automação criada')
  cleanup()
  hub.forget()
  at(OPEN, { conversations: [proposing()] })
  fireEvent.click(await screen.findByRole('button', { name: 'Criar automação' }))
  await waitFor(() => expect(hub.writes()).toHaveLength(2))
  expect(hub.writes()[1]?.key).toBe(hub.writes()[0]?.key)
})

test('depois de criar, Ver automação abre o histórico da nova', async () => {
  automationsHub(server, { automations: [] })
  const { conexus } = at(OPEN, { conversations: [proposing()] })
  await conexus.queryClient.prefetchQuery(automationsQuery(CompanyId.parse(COMPANY.id), undefined))
  fireEvent.click(await screen.findByRole('button', { name: 'Criar automação' }))
  await screen.findByText('Automação criada')
  fireEvent.click(screen.getByRole('link', { name: 'Ver automação' }))
  expect(await screen.findByText('Resumo de vendas')).toBeTruthy()
  await waitFor(() => expect(screen.queryByText('Não encontramos o que você procurou.')).toBeNull())
  expect(conexus.router.state.location.pathname).toMatch(
    /\/automations\/schedule_conexus-automation-/,
  )
})

test('uma proposta sem ligações diz que não lê nenhum sistema, onde as outras listam os sistemas', async () => {
  const none = { ...PROPOSAL, connections: [] }
  automationsHub(server, { automations: [] })
  at(OPEN, {
    conversations: [
      assistantConversation({ messages: [toolSaid(ASSISTANT_TOOL.proposeAutomation, none, none)] }),
    ],
  })
  expect(
    await screen.findByText(/Todo dia às 07:00 · Início · Não lê nenhum sistema\./),
  ).toBeTruthy()
})

test('com a lista das automações no cache e sem ninguém a observar, a automação criada depois abre o histórico', async () => {
  const held: { automations: AutomationSummary[] } = { automations: [] }
  automationsHub(server, held)
  const { conexus } = at(COMPANY_ROOT)
  const key = automationsQuery(CompanyId.parse(COMPANY.id), undefined)
  await conexus.queryClient.prefetchQuery(key)
  expect(conexus.queryClient.getQueryData(key.queryKey)).toEqual({ automations: [] })
  held.automations.push(automation())
  await conexus.queryClient.invalidateQueries()
  await conexus.router.navigate({ to: automationPath(CompanyId.parse(COMPANY.id), null, RESUMO) })
  expect(await screen.findByText('Resumo de vendas')).toBeTruthy()
  expect(screen.queryByText('Não encontramos o que você procurou.')).toBeNull()
})

test('com a lista ainda lendo ou que falhou, o cartão não oferece Criar automação', async () => {
  const hub = automationsHub(server, { automations: [] })
  server.use(http.get('*/api/companies/:companyId/automations', () => refusal('NOT_FOUND')))
  at(OPEN, { conversations: [proposing()] })
  expect(await screen.findByText('Resumo de vendas')).toBeTruthy()
  expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Criar automação' })).toBeNull()
  expect(hub.writes()).toHaveLength(0)
})

test('voltar à conversa depois de criar mostra "Automação criada" e nenhum Criar automação', async () => {
  const hub = automationsHub(server, { automations: [] })
  const { conexus } = at(OPEN, { conversations: [proposing()] })
  fireEvent.click(await screen.findByRole('button', { name: 'Criar automação' }))
  await screen.findByText('Automação criada')
  fireEvent.click(screen.getByRole('link', { name: 'Ver automação' }))
  await waitFor(() => expect(conexus.router.state.location.pathname).toMatch(/automations\//))
  conexus.router.history.back()
  await waitFor(() => expect(conexus.router.state.location.pathname).toBe(OPEN))
  expect(await screen.findByText('Resuma as vendas de ontem, por vendedor.')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Criar automação' })).toBeNull()
  expect(screen.getByText('Automação criada')).toBeTruthy()
  expect(hub.writes()).toHaveLength(1)
})

test('numa conversa de Projeto, o cartão diz o Projeto e a criação o leva', async () => {
  const hub = automationsHub(server, { automations: [] })
  server.use(...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: true }))
  at(`${COMPANY_ROOT}/projects/${PEDIDOS.id}/assistant/${ASKED}`, {
    conversations: [proposing(PEDIDOS.id)],
  })
  expect(await screen.findByText(/Todo dia às 07:00 · Pedidos/)).toBeTruthy()
  fireEvent.click(await screen.findByRole('button', { name: 'Criar automação' }))
  await screen.findByText('Automação criada')
  expect(Object(hub.writes()[0]?.body).projectId).toBe(PEDIDOS.id)
})

test('a recusa mostra a frase do código no cartão, e o botão segue para outra tentativa', async () => {
  const hub = automationsHub(server, {
    automations: [],
    answers: { write: () => refusal('AUTOMATION_LIMIT') },
  })
  at(OPEN, { conversations: [proposing()] })
  fireEvent.click(await screen.findByRole('button', { name: 'Criar automação' }))
  const alert = await screen.findByRole('alert')
  expect(
    within(alert).getByText('A empresa chegou a 30 automações ativas. Pause ou apague uma.'),
  ).toBeTruthy()
  expect(screen.queryByText('Automação criada')).toBeNull()
  expect(screen.getByRole('button', { name: 'Criar automação' })).toBeTruthy()
  expect(hub.writes()).toHaveLength(1)
})

test('a resposta cortada não diz que criou: o cartão pede outro toque, com a mesma chave', async () => {
  const hub = automationsHub(server, {
    automations: [],
    answers: { write: () => HttpResponse.text('{"automation":', { status: 201 }) },
  })
  at(OPEN, { conversations: [proposing()] })
  const button = await screen.findByRole('button', { name: 'Criar automação' })
  fireEvent.click(button)
  expect((await screen.findByRole('alert')).textContent).toContain('Não confirmamos a criação')
  fireEvent.click(screen.getByRole('button', { name: 'Criar automação' }))
  await waitFor(() => expect(hub.writes()).toHaveLength(2))
  expect(hub.writes()[1]?.key).toBe(hub.writes()[0]?.key)
})

test('enquanto a criação não responde o botão diz Criando…, e depois vira "Automação criada"', async () => {
  let release: () => void = () => undefined
  const hold = new Promise<void>((resolve) => {
    release = resolve
  })
  automationsHub(server, { automations: [], answers: { hold } })
  at(OPEN, { conversations: [proposing()] })
  fireEvent.click(await screen.findByRole('button', { name: 'Criar automação' }))
  const busy = await screen.findByRole('button', { name: 'Criando…' })
  expect(busy.hasAttribute('disabled')).toBe(true)
  release()
  expect(await screen.findByText('Automação criada')).toBeTruthy()
})

test('o Projeto apagado: a criação dá a frase de não encontrado no cartão', async () => {
  automationsHub(server, { automations: [], answers: { write: () => refusal('NOT_FOUND') } })
  server.use(...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: true }))
  at(`${COMPANY_ROOT}/projects/${PEDIDOS.id}/assistant/${ASKED}`, {
    conversations: [proposing(PEDIDOS.id)],
  })
  fireEvent.click(await screen.findByRole('button', { name: 'Criar automação' }))
  expect((await screen.findByRole('alert')).textContent).toContain(
    'Não encontramos o que você procurou.',
  )
  expect(screen.queryByText('Automação criada')).toBeNull()
})
