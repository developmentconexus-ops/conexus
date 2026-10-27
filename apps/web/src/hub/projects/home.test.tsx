import type { ProjectSummary } from '@conexus/hub-api'
import { FAILURES, listModelAccounts, listModelProviders } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS, projectsRead, refusal } from '../../platform/test-hub.tsx'

const server = hubServer()
const HOME = `/companies/${COMPANY.id}`
const PROJECTS = `${HOME}/projects`
const SONNET = 'anthropic/claude-sonnet-4'
const { providers: PROVIDERS } = listModelProviders.success.body.parse({
  providers: [
    {
      id: 'anthropic',
      name: 'Anthropic',
      models: [{ id: SONNET, efforts: ['off', 'low', 'high'] }],
    },
  ],
})

/** The Hub with `projects` as the company's Projects and a model for the box to start on. */
function hub(projects: ProjectSummary[]) {
  server.use(
    ...projectsRead({
      projects,
      databaseReady: projects.length > 0,
      mayDelete: true,
      role: 'member',
    }),
    http.get(`*/api/companies/${COMPANY.id}/model-accounts`, () =>
      HttpResponse.json(
        listModelAccounts.success.body.parse({
          company: [],
          mine: [],
          order: [],
          kinds: [],
          defaults: {
            company: null,
            mine: null,
            start: { model: SONNET, effort: 'off', from: 'company', account: 'Claude da empresa' },
            companyStart: null,
          },
          choices: { mine: PROVIDERS, company: PROVIDERS },
          fallback: { enabled: false, chain: [], revision: 0 },
          usableProviders: ['anthropic'],
          mayManage: false,
        }),
      ),
    ),
    http.get('*/api/model-providers', () =>
      HttpResponse.json(listModelProviders.success.body.parse({ providers: PROVIDERS })),
    ),
  )
}

function open(path = HOME) {
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

test('Início: o título, a caixa, os exemplos e os Projetos', async () => {
  hub([PEDIDOS])
  open()
  const title = await screen.findByRole('heading', { name: 'O que vamos construir?' })
  const box = await screen.findByRole('textbox', { name: 'Mensagem para o Builder' })
  expect(box.getAttribute('placeholder')).toBe('Descreva o app que você quer…')
  const examples = screen.getByRole('list', { name: 'Exemplos' })
  expect(within(examples).getAllByRole('button')).toHaveLength(3)
  const projects = within(screen.getByRole('main')).getByRole('heading', { name: /^Projetos/ })
  expect(projects.textContent).toBe('Projetos1')
  const inDom = [projects, examples, box, title].sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  )
  expect(inDom).toEqual([title, box, examples, projects])
  for (const name of ['Criar projeto', '+ Novo projeto', 'Novo projeto']) {
    expect(screen.queryByRole('button', { name })).toBeNull()
    expect(screen.queryByRole('link', { name })).toBeNull()
  }
  expect(screen.queryByLabelText(/Memória da conversa/)).toBeNull()
})

test('Início: o cartão com a prévia e a empresa sem Projetos', async () => {
  hub([PEDIDOS])
  open()
  const link = await within(await screen.findByRole('main')).findByRole('link', { name: /Pedidos/ })
  const letter = within(link).getByText('P')
  expect(letter.getAttribute('aria-hidden')).toBe('true')
  expect(within(link).getByText('Pedidos')).toBeTruthy()
  expect(link.textContent).toContain('Criado em 17/10/2026')
  cleanup()
  hub([])
  open()
  const main = within(await screen.findByRole('main'))
  expect(await main.findByText('Nenhum projeto ainda.')).toBeTruthy()
  expect(main.queryByRole('link', { name: /Pedidos/ })).toBeNull()
})

test('cada cartão: o nome, "Criado em" e o link que abre o Projeto', async () => {
  hub([PEDIDOS])
  const router = open()
  const link = await within(await screen.findByRole('main')).findByRole('link', { name: /Pedidos/ })
  expect(link.textContent).toContain('Criado em 17/10/2026')
  fireEvent.click(link)
  expect(await screen.findByRole('heading', { name: 'Pedidos' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(`${PROJECTS}/${PEDIDOS.id}`)
})

test('"Todos os projetos" só aparece no Início quando há mais Projetos', async () => {
  hub([PEDIDOS])
  open()
  const main = within(await screen.findByRole('main'))
  await main.findByRole('link', { name: /Pedidos/ })
  expect(main.queryByRole('link', { name: 'Todos os projetos' })).toBeNull()
  cleanup()
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/projects`, () =>
      HttpResponse.json({
        projects: [PEDIDOS],
        next: { kind: 'MORE', page: 'c'.repeat(32) },
        databaseReady: true,
      }),
    ),
  )
  const router = open()
  const more = await within(await screen.findByRole('main')).findByRole('link', {
    name: 'Todos os projetos',
  })
  fireEvent.click(more)
  expect(await screen.findByRole('heading', { name: 'Todos os projetos' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(PROJECTS)
})

test('o banco indisponível: o aviso do Hub na área, com a barra', async () => {
  hub([])
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/projects`, () => refusal('DATABASE_UNAVAILABLE')),
  )
  open()
  expect((await screen.findByRole('alert')).textContent).toContain(
    FAILURES.DATABASE_UNAVAILABLE.phrase,
  )
  expect(screen.getByRole('navigation', { name: 'Navegação' })).toBeTruthy()
})

test('a empresa que o Hub não acha: a página de "não encontrado"', async () => {
  hub([])
  server.use(http.get(`*/api/companies/${COMPANY.id}/projects`, () => refusal('NOT_FOUND')))
  open()
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
})
