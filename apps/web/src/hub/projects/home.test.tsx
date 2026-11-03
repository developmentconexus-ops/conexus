import type { ProjectSummary } from '@conexus/hub-api'
import { FAILURES, listModelAccounts, listModelProviders, ProjectId } from '@conexus/hub-api'
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

test('Início: o título, a caixa, os exemplos e o bloco Projetos, nessa ordem', async () => {
  hub([PEDIDOS])
  open()
  const title = await screen.findByRole('heading', { name: /^(Bom dia|Boa tarde|Boa noite)/ })
  const box = await screen.findByRole('textbox', { name: 'Mensagem para o Builder' })
  expect(box.getAttribute('placeholder')).toBe('Descreva o app que você quer…')
  const examples = screen.getByRole('list', { name: 'Exemplos' })
  expect(within(examples).getAllByRole('button')).toHaveLength(3)
  const main = screen.getByRole('main')
  const projects = await within(main).findByRole('region', { name: 'Projetos' })
  const inDom = [projects, examples, box, title].sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  )
  expect(inDom).toEqual([title, box, examples, projects])
  // The only place to create a Projeto beside the box is the sidebar's +, not the page.
  for (const name of ['Criar projeto', '+ Novo projeto', 'Novo projeto']) {
    expect(within(main).queryByRole('button', { name })).toBeNull()
    expect(within(main).queryByRole('link', { name })).toBeNull()
  }
  expect(screen.queryByLabelText(/Memória da conversa/)).toBeNull()
})

test('o bloco Projetos: a linha com o nome e o estado em palavras, e a empresa sem Projetos diz a frase', async () => {
  hub([PEDIDOS])
  open()
  const block = within(await screen.findByRole('region', { name: 'Projetos' }))
  const link = await block.findByRole('link', { name: /Pedidos/ })
  expect(within(link).getByText('Pedidos')).toBeTruthy()
  expect(within(link).getByText('Ainda sem app')).toBeTruthy()
  cleanup()
  hub([])
  open()
  const empty = within(await screen.findByRole('region', { name: 'Projetos' }))
  expect(await empty.findByText('Nenhum projeto ainda.')).toBeTruthy()
  expect(empty.queryByRole('link', { name: /Pedidos/ })).toBeNull()
})

test('o bloco Projetos: a linha abre o Projeto', async () => {
  hub([PEDIDOS])
  const router = open()
  const block = within(await screen.findByRole('region', { name: 'Projetos' }))
  fireEvent.click(await block.findByRole('link', { name: /Pedidos/ }))
  expect(await screen.findAllByRole('heading', { name: 'Pedidos' })).not.toHaveLength(0)
  expect(router.state.location.pathname).toBe(`${PROJECTS}/${PEDIDOS.id}`)
})

test('o bloco Projetos mostra cinco linhas e "Mais N"; "Todos →" abre todos os Projetos', async () => {
  const many = [1, 2, 3, 4, 5, 6, 7].map((number) => ({
    ...PEDIDOS,
    id: ProjectId.parse(String(number).repeat(32)),
    name: `Projeto ${number}`,
  }))
  hub(many)
  const router = open()
  const block = within(await screen.findByRole('region', { name: 'Projetos' }))
  await block.findByRole('link', { name: /Projeto 1/ })
  expect(block.getAllByRole('link', { name: /^Projeto / })).toHaveLength(5)
  expect(block.getByRole('link', { name: 'Mais 2' })).toBeTruthy()
  fireEvent.click(block.getByRole('link', { name: 'Todos →' }))
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

test('a empresa que o Hub não acha: o bloco de Projetos diz a frase, com Tentar de novo', async () => {
  hub([])
  server.use(http.get(`*/api/companies/${COMPANY.id}/projects`, () => refusal('NOT_FOUND')))
  open()
  expect(
    await screen.findByText('Não encontramos o que você procurou.', { exact: false }),
  ).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
})
