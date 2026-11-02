import { ProjectId } from '@conexus/hub-api'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer, PEDIDOS, refusal } from '../../platform/test-hub.tsx'
import { choose } from '../conversation/test-hub.tsx'
import {
  assistantScreens,
  COMPANY_ROOT,
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

/** An alert that is not the one of a block of Início, which reads the same list on its own. */
async function alertOutside(block: string) {
  return waitFor(() => {
    const found = screen
      .getAllByRole('alert')
      .find((alert) => alert.closest(`section[aria-label="${block}"]`) === null)
    if (found === undefined) throw new Error('no alert outside the block')
    return found
  })
}

async function ask(question: string) {
  fireEvent.change(await box(), { target: { value: question } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
}

test('o dono vê a caixa do Assistente com as ligações todas escolhidas e o seletor de Projeto', async () => {
  at(COMPANY_ROOT)
  expect(
    await screen.findByRole('heading', { name: /^(Bom dia|Boa tarde|Boa noite)/ }),
  ).toBeTruthy()
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

test('com 31 Projetos, o seletor oferece os 30 da primeira página e, em "Mais Projetos", o 31º', async () => {
  const projects = Array.from({ length: 31 }, (_, n) => ({
    id: ProjectId.parse(`${'q'.repeat(29)}${String(n).padStart(3, '0')}`),
    name: `Projeto ${n + 1}`,
    createdAt: '2026-10-17T12:00:00.000Z',
    appVersion: null,
    publishedVersion: null,
  }))
  const { writes, asked } = at(COMPANY_ROOT)
  server.use(
    http.get('*/api/companies/:companyId/projects', ({ request }) => {
      const more = new URL(request.url).searchParams.has('page')
      return HttpResponse.json({
        projects: more ? projects.slice(30) : projects.slice(0, 30),
        next: more ? { kind: 'END' } : { kind: 'MORE', page: 'segunda' },
        databaseReady: true,
      })
    }),
  )
  await barOf()
  fireEvent.click(await screen.findByRole('button', { name: 'Mais Projetos' }))
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Mais Projetos' })).toBeNull())
  await choose(screen.getByRole('combobox', { name: 'Projeto da conversa' }), 'Projeto 31')
  await waitFor(() => expect(asked.at(-1)).toContain(`projectId=${projects[30]?.id}`))
  await ask('Como foram as vendas?')
  await waitFor(() => expect(writes()[0]?.body).toMatchObject({ projectId: projects[30]?.id }))
})

test('a ligação tirada sem Projeto volta ligada ao escolher um Projeto: a escolha é do lugar (K28)', async () => {
  const { asked } = at(COMPANY_ROOT)
  const bar = await barOf()
  await turnOff(bar, 'Sankhya · Estoque')
  await waitFor(() => expect(within(bar).queryByText('Sankhya · Estoque')).toBeNull())
  await choose(screen.getByRole('combobox', { name: 'Projeto da conversa' }), PEDIDOS.name)
  await waitFor(() => expect(asked.at(-1)).toContain(`projectId=${PEDIDOS_ID}`))
  const placed = await barOf()
  fireEvent.click(within(placed).getByRole('button', { name: 'Ajustar' }))
  expect(
    (await screen.findByRole('switch', { name: 'Sankhya · Estoque' })).getAttribute('aria-checked'),
  ).toBe('true')
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
  expect(await alertOutside('Ligações')).toBeTruthy()
})

test('se a lista dos Projetos falha depois de lida, o seletor diz a frase', async () => {
  const { conexus } = at(COMPANY_ROOT)
  await barOf()
  server.use(http.get('*/api/companies/:companyId/projects', () => refusal('DATABASE_UNAVAILABLE')))
  await act(() => conexus.queryClient.invalidateQueries())
  expect(await alertOutside('Projetos')).toBeTruthy()
})

test('sem conversas, o Início mostra a caixa, a barra e os exemplos, e a lista só tem Nova conversa', async () => {
  at(COMPANY_ROOT)
  await barOf()
  expect(screen.queryByRole('heading', { name: 'Conversas' })).toBeNull()
  expect(screen.getByRole('list', { name: 'Exemplos' })).toBeTruthy()
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
  expect((await screen.findAllByRole('link', { name: /Conversa de/ })).length).toBeGreaterThan(0)
})
