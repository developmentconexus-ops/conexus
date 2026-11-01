import { AutomationId } from '@conexus/hub-api'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer, PEDIDOS, refusal } from '../../platform/test-hub.tsx'
import { choose } from '../conversation/test-hub.tsx'
import {
  ASKED,
  assistantConversation,
  assistantScreens,
  COMPANY_ROOT,
  ELSEWHERE,
  LOJA,
  LOJA_OFFER,
  OFFERED,
  PEDIDOS_ID,
  SALES,
  STOCK,
  THIRD,
} from './test-hub.tsx'

// Início of the owner: the Assistant's box, its bar and the recent conversations (step 24.1, criteria 23 and 23a).
const server = hubServer()
const { at } = assistantScreens(server)
const AUTOMATION = AutomationId.parse(
  'schedule_conexus-automation-11111111-1111-4111-8111-111111111111',
)

async function box() {
  return screen.findByRole('textbox', { name: 'Mensagem para o Assistente' })
}

async function barOf() {
  const bar = await screen.findByRole('group', { name: 'Ligações da conversa' })
  await waitFor(() => expect(within(bar).getByText('Sankhya · Estoque')).toBeTruthy())
  return bar
}

async function turnOff(bar: HTMLElement, name: string) {
  fireEvent.click(within(bar).getByRole('button', { name: 'Ajustar' }))
  fireEvent.click(await screen.findByRole('switch', { name }))
  fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
}

async function ask(question: string) {
  fireEvent.change(await box(), { target: { value: question } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
}

test('o dono vê a caixa do Assistente com as ligações todas escolhidas e o seletor de Projeto', async () => {
  at(COMPANY_ROOT)
  expect(await screen.findByRole('heading', { name: 'Pergunte ou peça um app' })).toBeTruthy()
  const bar = await barOf()
  expect(within(bar).getByText('Sankhya · Vendas')).toBeTruthy()
  expect(within(bar).getByRole('combobox', { name: 'Projeto da conversa' })).toBeTruthy()
  expect(await box()).toBeTruthy()
  expect(screen.getByRole('list', { name: 'Exemplos' })).toBeTruthy()
})

test('perguntar sem mexer na barra cria a conversa com todas as ligações que o lugar oferece', async () => {
  const { writes, conexus } = at(COMPANY_ROOT)
  await barOf()
  await ask('Como foram as vendas?')
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toMatch(
      new RegExp(`${COMPANY_ROOT}/conversations/`),
    ),
  )
  expect(writes()[0]?.body).toMatchObject({ connections: [SALES, STOCK] })
})

test('perguntar cria a conversa com as ligações da barra e abre o chat com a pergunta enviada uma vez', async () => {
  const { writes, conexus } = at(COMPANY_ROOT)
  const bar = await barOf()
  await turnOff(bar, 'Sankhya · Estoque')
  expect(within(bar).queryByText('Sankhya · Estoque')).toBeNull()
  await ask('Como foram as vendas?')
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toMatch(
      new RegExp(`${COMPANY_ROOT}/conversations/`),
    ),
  )
  const [created] = writes()
  expect(created?.path).toMatch(/assistant\/conversations$/)
  expect(created?.body).toMatchObject({ connections: [SALES] })
  expect(created?.key).not.toBeNull()
  await waitFor(() =>
    expect(writes().filter((one) => one.path.endsWith('/messages'))).toHaveLength(1),
  )
})

test('uma ligação desligada continua desligada quando a lista das ligações é lida de novo antes de perguntar', async () => {
  const { writes, offering, conexus } = at(COMPANY_ROOT)
  const bar = await barOf()
  await turnOff(bar, 'Sankhya · Estoque')
  offering([...OFFERED, LOJA_OFFER])
  await act(() => conexus.queryClient.invalidateQueries())
  await waitFor(() => expect(within(bar).getByText('Sankhya · Loja')).toBeTruthy())
  expect(within(bar).queryByText('Sankhya · Estoque')).toBeNull()
  await ask('Como foram as vendas?')
  await waitFor(() => expect(writes()).not.toHaveLength(0))
  expect(writes()[0]?.body).toMatchObject({ connections: [SALES, LOJA] })
})

test('enquanto a lista das ligações não chegou, o Enviar espera e a barra é um esqueleto', async () => {
  let arrive: () => void = () => undefined
  const held = new Promise<void>((resolve) => {
    arrive = resolve
  })
  const { writes } = at(COMPANY_ROOT, {
    answers: { offer: async () => void (await held) },
  })
  fireEvent.change(await box(), { target: { value: 'Como foram as vendas?' } })
  expect(screen.getByRole('button', { name: 'Enviar' }).hasAttribute('disabled')).toBe(true)
  expect(screen.queryByRole('group', { name: 'Ligações da conversa' })).toBeNull()
  arrive()
  await barOf()
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Enviar' }).hasAttribute('disabled')).toBe(false),
  )
  expect(writes()).toHaveLength(0)
})

test('se a lista das ligações falha, a barra diz a frase com Tentar de novo e o Enviar espera', async () => {
  let failing = true
  at(COMPANY_ROOT, {
    answers: { offer: () => (failing ? refusal('DATABASE_UNAVAILABLE') : undefined) },
  })
  fireEvent.change(await box(), { target: { value: 'Como foram as vendas?' } })
  const retry = await screen.findByRole('button', { name: 'Tentar de novo' })
  expect(screen.getByRole('button', { name: 'Enviar' }).hasAttribute('disabled')).toBe(true)
  failing = false
  fireEvent.click(retry)
  await barOf()
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Enviar' }).hasAttribute('disabled')).toBe(false),
  )
})

test('a caixa do Início se chama Mensagem para o Assistente', async () => {
  at(COMPANY_ROOT)
  expect(await box()).toBeTruthy()
  expect(screen.queryByRole('textbox', { name: 'Mensagem para o Builder' })).toBeNull()
})

test('escolher um Projeto no seletor cria a conversa nele, com as ligações dele, e abre no endereço dele', async () => {
  const { writes, asked, conexus } = at(COMPANY_ROOT)
  await barOf()
  await choose(screen.getByRole('combobox', { name: 'Projeto da conversa' }), PEDIDOS.name)
  await waitFor(() => expect(asked.at(-1)).toContain(`projectId=${PEDIDOS_ID}`))
  await ask('Como foram as vendas?')
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toContain(`/projects/${PEDIDOS_ID}/assistant/`),
  )
  expect(writes()[0]?.body).toMatchObject({ projectId: PEDIDOS_ID })
})

test('sem ligação no lugar, a barra diz onde ligar um sistema', async () => {
  at(COMPANY_ROOT, { offered: [] })
  expect(
    await screen.findByText(/Ligue um sistema em Integrações para perguntar sobre ele\./),
  ).toBeTruthy()
  const link = screen.getByRole('link', { name: 'Abrir Integrações' })
  expect(link.getAttribute('href')).toBe(`${COMPANY_ROOT}/integrations`)
})

test('com todas as ligações tiradas, a barra diz que nenhuma foi escolhida', async () => {
  at(COMPANY_ROOT)
  const bar = await barOf()
  await turnOff(bar, 'Sankhya · Estoque')
  await turnOff(bar, 'Sankhya · Vendas')
  expect(within(bar).getByText('Nenhuma ligação escolhida')).toBeTruthy()
})

test('se o catálogo dos sistemas falha, a barra diz a frase e mostra o nome que tem', async () => {
  at(COMPANY_ROOT)
  server.use(
    http.get('*/api/companies/:companyId/connections', () => refusal('DATABASE_UNAVAILABLE')),
  )
  const bar = await screen.findByRole('group', { name: 'Ligações da conversa' })
  await waitFor(() => expect(within(bar).getByText('sankhya · Vendas')).toBeTruthy())
  expect(await screen.findByRole('alert')).toBeTruthy()
})

test('se a lista dos Projetos falha depois de lida, o seletor diz a frase', async () => {
  const { conexus } = at(COMPANY_ROOT)
  await barOf()
  server.use(http.get('*/api/companies/:companyId/projects', () => refusal('DATABASE_UNAVAILABLE')))
  await act(() => conexus.queryClient.invalidateQueries())
  expect(await screen.findByRole('alert')).toBeTruthy()
})

test('as conversas recentes abrem a conversa e a de um Projeto leva a etiqueta dele', async () => {
  const { conexus } = at(COMPANY_ROOT, {
    conversations: [
      assistantConversation({ id: ELSEWHERE, projectId: PEDIDOS_ID, title: 'Pedidos do mês' }),
      assistantConversation(),
    ],
  })
  const company = await screen.findByRole('link', { name: /Vendas da semana/ })
  const project = screen.getByRole('link', { name: /Pedidos do mês/ })
  expect(within(project).getByText(PEDIDOS.name)).toBeTruthy()
  expect(within(company).queryByText(PEDIDOS.name)).toBeNull()
  fireEvent.click(company)
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toMatch(/\/conversations\/3{8}-/),
  )
})

test('sem conversas, o Início mostra só a caixa, a barra e os exemplos', async () => {
  at(COMPANY_ROOT)
  await barOf()
  expect(screen.queryByRole('heading', { name: 'Conversas recentes' })).toBeNull()
  expect(screen.getByRole('list', { name: 'Exemplos' })).toBeTruthy()
})

test('as recentes passam de uma página: Ver mais leva à seguinte no endereço, e Primeira página volta', async () => {
  const { conexus } = at(COMPANY_ROOT, {
    pageSize: 2,
    conversations: [
      assistantConversation({ id: ELSEWHERE, title: 'Gama' }),
      assistantConversation({ title: 'Beta' }),
      assistantConversation({ id: THIRD, title: 'Alfa' }),
    ],
  })
  expect(await screen.findByRole('link', { name: /Gama/ })).toBeTruthy()
  expect(screen.queryByRole('link', { name: /Alfa/ })).toBeNull()
  fireEvent.click(screen.getByRole('link', { name: 'Ver mais: Conversas' }))
  expect(await screen.findByRole('link', { name: /Alfa/ })).toBeTruthy()
  expect(conexus.router.state.location.search).toMatchObject({ conversations: '2' })
  fireEvent.click(screen.getByRole('link', { name: 'Primeira página: Conversas' }))
  expect(await screen.findByRole('link', { name: /Gama/ })).toBeTruthy()
})

test('a etiqueta: a conversa que uma automação abriu mostra Automação · nome nas recentes e no topo da conversa; a outra não', async () => {
  const { conexus } = at(COMPANY_ROOT, {
    conversations: [
      assistantConversation({
        title: 'Resumo de ontem',
        automation: { automationId: AUTOMATION, name: 'Resumo de vendas' },
      }),
      assistantConversation({ id: ELSEWHERE, title: 'Conversa da pessoa' }),
    ],
  })
  const recent = (await screen.findByRole('link', { name: /Resumo de ontem/ })).closest('li')
  if (recent === null) throw new Error('the recent conversation has no row')
  expect(within(recent).getByText('Automação · Resumo de vendas')).toBeTruthy()
  const other = (await screen.findByRole('link', { name: /Conversa da pessoa/ })).closest('li')
  if (other === null) throw new Error('the other conversation has no row')
  expect(within(other).queryByText(/Automação ·/)).toBeNull()

  fireEvent.click(within(recent).getByRole('link', { name: /Resumo de ontem/ }))
  const header = await screen.findByRole('heading', { name: 'Resumo de ontem' })
  expect(header.parentElement?.textContent).toContain('Automação · Resumo de vendas')
  expect(conexus.router.state.location.pathname).toContain(ASKED)
})

test('voltar ao Início depois de perguntar mostra a conversa nova entre as recentes', async () => {
  const { conexus } = at(COMPANY_ROOT)
  await barOf()
  await ask('Como foram as vendas?')
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toMatch(
      new RegExp(`${COMPANY_ROOT}/conversations/`),
    ),
  )
  await screen.findByRole('textbox', { name: 'Mensagem para o Assistente' })
  act(() => conexus.router.history.back())
  expect(await screen.findByRole('link', { name: /Conversa de/ })).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Conversas recentes' })).toBeTruthy()
})

test('enquanto as recentes não chegam, o Início mostra um esqueleto no lugar delas', async () => {
  let arrive: () => void = () => undefined
  const held = new Promise<void>((resolve) => {
    arrive = resolve
  })
  at(COMPANY_ROOT, {
    conversations: [assistantConversation()],
    answers: { list: async () => void (await held) },
  })
  await barOf()
  expect(screen.queryByRole('link', { name: /Vendas da semana/ })).toBeNull()
  expect(document.querySelector('[data-slot="skeleton"]')).not.toBeNull()
  arrive()
  expect(await screen.findByRole('link', { name: /Vendas da semana/ })).toBeTruthy()
})

test('se as recentes falham, o Início diz a frase com Tentar de novo, que as lê de novo', async () => {
  let failing = true
  at(COMPANY_ROOT, {
    conversations: [assistantConversation()],
    answers: { list: () => (failing ? refusal('DATABASE_UNAVAILABLE') : undefined) },
  })
  const retry = await screen.findByRole('button', { name: 'Tentar de novo' })
  expect(screen.queryByRole('link', { name: /Vendas da semana/ })).toBeNull()
  failing = false
  fireEvent.click(retry)
  expect(await screen.findByRole('link', { name: /Vendas da semana/ })).toBeTruthy()
})
