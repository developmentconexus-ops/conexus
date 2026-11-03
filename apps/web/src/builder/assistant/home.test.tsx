import { ProjectId } from '@conexus/hub-api'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer, PEDIDOS, refusal } from '../../platform/test-hub.tsx'
import {
  assistantScreens,
  COMPANY_ROOT,
  LOJA,
  LOJA_OFFER,
  OFFERED,
  PEDIDOS_ID,
  SALES,
  STOCK,
} from './test-hub.tsx'

const COUNT = /^(\d+ ferramentas?|Sem ferramentas)$/

// Início of the owner: the Assistant's box, its folder and its tools in the box's row (step 24.1, criteria 23 and 23a; step 13.3, criteria 13 to 17).
const server = hubServer()
const { at } = assistantScreens(server)

async function box() {
  return screen.findByRole('textbox', { name: 'Mensagem para o Assistente' })
}

/** The tools button of the box's row, once the offer is read. */
async function toolsOf(name = '2 ferramentas') {
  return screen.findByRole('button', { name })
}

async function turnOff(name: string) {
  fireEvent.click(await screen.findByRole('button', { name: COUNT }))
  fireEvent.click(await screen.findByRole('switch', { name }))
  fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
}

/** Opens the folder's list and picks the Projeto by its name. */
async function chooseProject(name: string) {
  fireEvent.click(await screen.findByRole('button', { name: 'Projeto da conversa' }))
  fireEvent.click(await screen.findByRole('button', { name }))
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

test('o dono vê a caixa do Assistente com as ferramentas todas ligadas, a pasta e nenhuma barra embaixo', async () => {
  at(COMPANY_ROOT)
  expect(
    await screen.findByRole('heading', { name: /^(Bom dia|Boa tarde|Boa noite)/ }),
  ).toBeTruthy()
  await toolsOf()
  expect(screen.getByRole('button', { name: 'Projeto da conversa' })).toBeTruthy()
  expect(screen.queryByRole('group', { name: 'Ligações da conversa' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Ajustar' })).toBeNull()
  expect(screen.queryByRole('button', { name: /Memória da conversa/ })).toBeNull()
  expect(await box()).toBeTruthy()
  expect(screen.getByRole('list', { name: 'Exemplos' })).toBeTruthy()
})

test('perguntar sem mexer na barra cria a conversa com todas as ligações que o lugar oferece', async () => {
  const { writes, conexus } = at(COMPANY_ROOT)
  await toolsOf()
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
  await toolsOf()
  await turnOff('Sankhya · Estoque')
  await toolsOf('1 ferramenta')
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
  await toolsOf()
  await turnOff('Sankhya · Estoque')
  await toolsOf('1 ferramenta')
  offering([...OFFERED, LOJA_OFFER])
  await act(() => conexus.queryClient.invalidateQueries())
  fireEvent.click(await toolsOf('2 ferramentas'))
  expect(
    (await screen.findByRole('switch', { name: 'Sankhya · Loja' })).getAttribute('aria-checked'),
  ).toBe('true')
  expect(
    screen.getByRole('switch', { name: 'Sankhya · Estoque' }).getAttribute('aria-checked'),
  ).toBe('false')
  fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Escape' })
  await ask('Como foram as vendas?')
  await waitFor(() => expect(writes()).not.toHaveLength(0))
  expect(writes()[0]?.body).toMatchObject({ connections: [SALES, LOJA] })
})

test('enquanto a lista das ligações não chegou, o Enviar espera e a caixa diz "Lendo as ferramentas…"', async () => {
  let arrive: () => void = () => undefined
  const held = new Promise<void>((resolve) => {
    arrive = resolve
  })
  const { writes } = at(COMPANY_ROOT, {
    answers: { offer: async () => void (await held) },
  })
  fireEvent.change(await box(), { target: { value: 'Como foram as vendas?' } })
  expect(screen.getByRole('button', { name: 'Enviar' }).hasAttribute('disabled')).toBe(true)
  expect(screen.queryByRole('button', { name: COUNT })).toBeNull()
  expect(screen.getByText('Lendo as ferramentas…')).toBeTruthy()
  arrive()
  await toolsOf()
  await waitFor(() =>
    expect(screen.getByRole('button', { name: 'Enviar' }).hasAttribute('disabled')).toBe(false),
  )
  expect(writes()).toHaveLength(0)
})

test('se a lista das ligações falha, a caixa diz a frase com Tentar de novo e o Enviar espera', async () => {
  let failing = true
  at(COMPANY_ROOT, {
    answers: { offer: () => (failing ? refusal('DATABASE_UNAVAILABLE') : undefined) },
  })
  fireEvent.change(await box(), { target: { value: 'Como foram as vendas?' } })
  const retry = await screen.findByRole('button', { name: 'Tentar de novo' })
  expect(screen.getByRole('button', { name: 'Enviar' }).hasAttribute('disabled')).toBe(true)
  failing = false
  fireEvent.click(retry)
  await toolsOf()
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
  await toolsOf()
  await chooseProject(PEDIDOS.name)
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
  await toolsOf()
  fireEvent.click(await screen.findByRole('button', { name: 'Projeto da conversa' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Mais Projetos' }))
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Mais Projetos' })).toBeNull())
  fireEvent.click(await screen.findByRole('button', { name: 'Projeto 31' }))
  await waitFor(() => expect(asked.at(-1)).toContain(`projectId=${projects[30]?.id}`))
  await ask('Como foram as vendas?')
  await waitFor(() => expect(writes()[0]?.body).toMatchObject({ projectId: projects[30]?.id }))
})

test('a ligação tirada sem Projeto volta ligada ao escolher um Projeto: a escolha é do lugar (K28)', async () => {
  const { asked } = at(COMPANY_ROOT)
  await toolsOf()
  await turnOff('Sankhya · Estoque')
  await toolsOf('1 ferramenta')
  await chooseProject(PEDIDOS.name)
  await waitFor(() => expect(asked.at(-1)).toContain(`projectId=${PEDIDOS_ID}`))
  fireEvent.click(await toolsOf())
  expect(
    (await screen.findByRole('switch', { name: 'Sankhya · Estoque' })).getAttribute('aria-checked'),
  ).toBe('true')
})

test('sem ligação no lugar, a contagem diz "Sem ferramentas" e o menu leva a Integrações', async () => {
  at(COMPANY_ROOT, { offered: [] })
  fireEvent.click(await screen.findByRole('button', { name: 'Sem ferramentas' }))
  expect(await screen.findByText('Nenhuma ferramenta ligada à empresa')).toBeTruthy()
  const link = screen.getByRole('link', { name: 'Conectar outra ferramenta' })
  expect(link.getAttribute('href')).toBe(`${COMPANY_ROOT}/integrations`)
})

test('com todas as ferramentas desligadas, a contagem diz Sem ferramentas', async () => {
  at(COMPANY_ROOT)
  await toolsOf()
  await turnOff('Sankhya · Estoque')
  await turnOff('Sankhya · Vendas')
  expect(await screen.findByRole('button', { name: 'Sem ferramentas' })).toBeTruthy()
})

test('se o catálogo dos sistemas falha, a caixa diz a frase e as ferramentas levam o nome que há', async () => {
  at(COMPANY_ROOT)
  server.use(
    http.get('*/api/companies/:companyId/connections', () => refusal('DATABASE_UNAVAILABLE')),
  )
  fireEvent.click(await screen.findByRole('button', { name: '2 ferramentas' }))
  expect(await screen.findByRole('switch', { name: 'sankhya · Vendas' })).toBeTruthy()
  expect(await alertOutside('Ligações')).toBeTruthy()
})

test('se a lista dos Projetos falha ao abrir o Início, a página abre e o bloco diz a frase com Tentar de novo', async () => {
  at(COMPANY_ROOT)
  server.use(http.get('*/api/companies/:companyId/projects', () => refusal('DATABASE_UNAVAILABLE')))
  expect(await box()).toBeTruthy()
  expect(screen.queryByText('Não foi possível abrir esta página')).toBeNull()
  expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
})

test('se a lista dos Projetos falha depois de lida, a lista da pasta diz a frase', async () => {
  const { conexus } = at(COMPANY_ROOT)
  await toolsOf()
  server.use(http.get('*/api/companies/:companyId/projects', () => refusal('DATABASE_UNAVAILABLE')))
  await act(() => conexus.queryClient.invalidateQueries())
  fireEvent.click(await screen.findByRole('button', { name: 'Projeto da conversa' }))
  expect(await alertOutside('Projetos')).toBeTruthy()
})

test('sem conversas, o Início mostra a caixa, a contagem e os exemplos, e a lista só tem Nova conversa', async () => {
  at(COMPANY_ROOT)
  await toolsOf()
  expect(screen.queryByRole('heading', { name: 'Conversas' })).toBeNull()
  expect(screen.getByRole('list', { name: 'Exemplos' })).toBeTruthy()
})

test('voltar ao Início depois de perguntar mostra a conversa nova entre as recentes', async () => {
  const { conexus } = at(COMPANY_ROOT)
  await toolsOf()
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

test('a pasta: abre Sem Projeto e os Projetos, e a busca só aparece a partir de 7', async () => {
  const projects = Array.from({ length: 7 }, (_, n) => ({
    ...PEDIDOS,
    id: ProjectId.parse(`${'r'.repeat(29)}${String(n).padStart(3, '0')}`),
    name: n === 0 ? 'Vendas' : `Projeto ${n}`,
  }))
  at(COMPANY_ROOT)
  server.use(
    http.get('*/api/companies/:companyId/projects', () =>
      HttpResponse.json({
        projects: projects.slice(0, 3),
        next: { kind: 'END' },
        databaseReady: true,
      }),
    ),
  )
  await toolsOf()
  fireEvent.click(await screen.findByRole('button', { name: 'Projeto da conversa' }))
  const none = await screen.findByRole('button', { name: 'Sem Projeto' })
  expect(screen.getByText('Em qual Projeto?')).toBeTruthy()
  expect(none.getAttribute('aria-pressed')).toBe('true')
  expect(none.querySelector('svg')).not.toBeNull()
  expect(screen.getByRole('button', { name: 'Vendas' }).querySelector('svg')).toBeNull()
  expect(screen.queryByRole('searchbox', { name: 'Buscar Projeto' })).toBeNull()
})

test('a pasta: com 7 Projetos a busca filtra pelo nome e escolher Vendas fecha a lista', async () => {
  const projects = Array.from({ length: 7 }, (_, n) => ({
    ...PEDIDOS,
    id: ProjectId.parse(`${'r'.repeat(29)}${String(n).padStart(3, '0')}`),
    name: n === 0 ? 'Vendas' : `Projeto ${n}`,
  }))
  const { asked } = at(COMPANY_ROOT)
  server.use(
    http.get('*/api/companies/:companyId/projects', () =>
      HttpResponse.json({ projects, next: { kind: 'END' }, databaseReady: true }),
    ),
  )
  await toolsOf()
  fireEvent.click(await screen.findByRole('button', { name: 'Projeto da conversa' }))
  const search = await screen.findByRole('searchbox', { name: 'Buscar Projeto' })
  fireEvent.change(search, { target: { value: 'vend' } })
  fireEvent.click(screen.getByRole('button', { name: 'Vendas' }))
  await waitFor(() => expect(asked.at(-1)).toContain(`projectId=${projects[0]?.id}`))
  expect(screen.queryByRole('searchbox', { name: 'Buscar Projeto' })).toBeNull()
})
