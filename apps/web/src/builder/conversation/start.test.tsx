import { ATTEMPT_KEY_HEADER, CompanyId, createProject, FAILURES, ModelId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import {
  hubServer,
  PEDIDOS,
  PEDIDOS_ADDRESS,
  projectsRead,
  refusal,
  undecided,
} from '../../platform/test-hub.tsx'
import type { Answers } from './test-hub.tsx'
import { PROJECT, SECOND, screens, typed, view } from './test-hub.tsx'
import { attach } from './test-stream.tsx'
import { EXAMPLES, REQUEST_NOT_SENT } from './text.ts'

const server = hubServer()
const { open } = screens(server)

afterEach(() => sessionStorage.clear())

const HOME = `/companies/${COMPANY.id}`
const REQUEST = 'Um app de encomendas com cliente, data de entrega e valor'
const START = {
  model: ModelId.parse('anthropic/claude-sonnet-4'),
  effort: 'high',
  from: 'company',
  account: 'Conta anthropic',
} as const
const UNCONFIRMED = 'Não confirmamos a criação. Tente de novo.'
const PDF = new File(['%PDF-1.4'], 'tabela.pdf', { type: 'application/pdf' })

type Sent = { key: string | null; body: unknown }

/**
 * Início, with a model to start on unless `start` is null; each Projeto written is recorded and
 * answered by `project` (PEDIDOS created when it answers nothing), and the conversation's writes by
 * `answers`.
 */
function home(
  options: {
    project?: () => Response | undefined
    answers?: Answers
    start?: typeof START | null
  } = {},
) {
  const shown = view({ start: options.start === null ? undefined : START })
  const hub = open(shown, HOME, options.answers)
  const projects: Sent[] = []
  server.use(
    http.post(`*/api/companies/${COMPANY.id}/projects`, async ({ request }) => {
      projects.push({ key: request.headers.get(ATTEMPT_KEY_HEADER), body: await request.json() })
      return (
        options.project?.() ??
        HttpResponse.json(
          createProject.success.body.parse({
            project: {
              ...PEDIDOS,
              mayDelete: true,
              mayManageVersions: true,
              address: PEDIDOS_ADDRESS,
              appVersion: null,
            },
          }),
          { status: 201 },
        )
      )
    }),
  )
  return {
    ...hub,
    projects,
    conversations: () => hub.sent.filter((one) => one.path.endsWith('/conversations')),
    messages: () => hub.sent.filter((one) => one.path.endsWith('/messages')),
  }
}

function box() {
  return screen.findByRole('textbox', { name: 'Mensagem para o Builder' })
}

async function request(text = REQUEST) {
  fireEvent.change(await box(), { target: { value: text } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
  return screen.findByLabelText('Nome do projeto')
}

function create(name: string) {
  fireEvent.change(screen.getByLabelText('Nome do projeto'), { target: { value: name } })
  fireEvent.click(screen.getByRole('button', { name: 'Criar e começar' }))
}

test('a caixa do Início tem o seu texto de espera', async () => {
  home()
  expect((await box()).getAttribute('placeholder')).toBe('Descreva o app que você quer…')
})

test('o exemplo vai para a caixa e nada sai', async () => {
  const { projects, conversations } = home()
  const field = await box()
  fireEvent.click(screen.getByRole('button', { name: EXAMPLES[0].label }))
  expect(typed(field)).toBe(EXAMPLES[0].text)
  expect(screen.queryByLabelText('Nome do projeto')).toBeNull()
  expect(projects).toHaveLength(0)
  expect(conversations()).toHaveLength(0)
})

test('o foco fica na caixa e outro exemplo troca o texto', async () => {
  home()
  const field = await box()
  fireEvent.click(screen.getByRole('button', { name: EXAMPLES[0].label }))
  await waitFor(() => expect(document.activeElement).toBe(field))
  fireEvent.click(screen.getByRole('button', { name: EXAMPLES[1].label }))
  expect(typed(field)).toBe(EXAMPLES[1].text)
  await waitFor(() => expect(document.activeElement).toBe(field))
})

test('sem conta, o aviso do Início no lugar da caixa e dos exemplos', async () => {
  const { conexus } = home({ start: null })
  expect(
    await screen.findByText(
      'Você ainda não tem uma conta de modelo. Peça a quem administra a empresa ou ligue a sua.',
    ),
  ).toBeTruthy()
  expect(screen.queryByRole('textbox', { name: 'Mensagem para o Builder' })).toBeNull()
  expect(screen.queryByRole('list', { name: 'Exemplos' })).toBeNull()
  const link = screen.getByRole('link', { name: 'Minhas contas de modelo' })
  expect(link.className).not.toContain('underline')
  fireEvent.click(link)
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toBe(`${HOME}/settings/my-model-accounts`),
  )
})

test('enviar pede o nome, vazio, e nada sai', async () => {
  const { projects, conversations } = home()
  await box()
  attach(PDF)
  await screen.findByRole('button', { name: 'Tirar tabela.pdf' })
  const name = await request()
  expect(screen.queryByRole('textbox', { name: 'Mensagem para o Builder' })).toBeNull()
  expect(screen.getByText(REQUEST)).toBeTruthy()
  const files = screen.getByRole('group', { name: 'Arquivos do pedido' })
  expect(within(files).getByText('tabela.pdf')).toBeTruthy()
  expect(typed(name)).toBe('')
  await waitFor(() => expect(document.activeElement).toBe(name))
  fireEvent.change(name, { target: { value: 'Encomendas' } })
  expect(await screen.findByText('encomendas--empresa-teste.apps.example.test')).toBeTruthy()
  expect(projects).toHaveLength(0)
  expect(conversations()).toHaveLength(0)
})

test('Voltar devolve o pedido à caixa', async () => {
  home()
  await box()
  attach(PDF)
  await screen.findByRole('button', { name: 'Tirar tabela.pdf' })
  await request()
  fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
  expect(typed(await box())).toBe(REQUEST)
  expect(screen.getByRole('button', { name: 'Tirar tabela.pdf' })).toBeTruthy()
})

test('o nome vazio fica no campo', async () => {
  const { projects } = home()
  await request()
  create('   ')
  expect(await screen.findByText(/Escreva o nome do Projeto/)).toBeTruthy()
  expect(projects).toHaveLength(0)
})

test('criar leva o nome, o modelo e as chaves, e abre a conversa', async () => {
  const { projects, conversations, messages, conexus } = home()
  await request()
  create('Pedidos')
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toBe(`${PROJECT}/conversations/${SECOND}`),
  )
  expect(projects).toEqual([{ key: expect.any(String), body: { name: 'Pedidos' } }])
  expect(conversations().map((one) => one.body)).toEqual([
    { model: START.model, effort: START.effort },
  ])
  expect(conversations()[0]?.attemptKey).toMatch(/^[0-9a-f-]{36}$/)
  expect(conversations()[0]?.attemptKey).not.toBe(projects[0]?.key)
  await waitFor(() => expect(messages()).toHaveLength(1))
  expect(messages()[0]?.body).toEqual({ message: REQUEST })
})

test('com o banco da empresa: "Criando…"; sem ele: "Preparando o banco da empresa…"', async () => {
  const held = Promise.withResolvers<void>()
  home({ project: () => undefined })
  server.use(
    ...projectsRead({ projects: [], databaseReady: false, mayDelete: true }),
    http.post(`*/api/companies/${COMPANY.id}/projects`, async () => {
      await held.promise
      return refusal('PROJECT_NAME_TAKEN')
    }),
  )
  await request()
  create('Pedidos')
  expect(
    await screen.findByRole('button', { name: 'Preparando o banco da empresa…' }),
  ).toHaveProperty('disabled', true)
  held.resolve()
  await screen.findByText(FAILURES.PROJECT_NAME_TAKEN.phrase, { exact: false })
})

for (const code of [
  'PROJECT_NAME_TAKEN',
  'PROJECT_ADDRESS_TAKEN',
  'PROJECT_NAME_NO_ADDRESS',
] as const) {
  test(`${code}: a frase no campo do nome, e o pedido fica`, async () => {
    home({ project: () => refusal(code) })
    await request()
    create('Pedidos')
    expect(await screen.findByText(FAILURES[code].phrase, { exact: false })).toBeTruthy()
    await waitFor(() =>
      expect(screen.getByLabelText('Nome do projeto').getAttribute('aria-invalid')).toBe('true'),
    )
    expect(screen.getByText(REQUEST)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  })
}

for (const code of ['COMPANY_DATABASE_PREPARING', 'COMPANY_DATABASE_UNAVAILABLE'] as const) {
  test(`${code}: a frase e "Tentar de novo", que manda o pedido outra vez`, async () => {
    let refuse = true
    const { projects, conexus } = home({ project: () => (refuse ? refusal(code) : undefined) })
    await request()
    create('Pedidos')
    expect((await screen.findByRole('alert')).textContent).toBe(
      `${FAILURES[code].phrase} ${FAILURES[code].action}`,
    )
    refuse = false
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    await waitFor(() =>
      expect(conexus.router.state.location.pathname).toBe(`${PROJECT}/conversations/${SECOND}`),
    )
    expect(projects).toHaveLength(2)
  })
}

for (const [name, answer] of undecided('{"project":{"id":"ppp')) {
  test(`${name}: "${UNCONFIRMED}" e a nova tentativa leva a mesma chave`, async () => {
    let cut = true
    const { projects } = home({ project: () => (cut ? answer() : undefined) })
    await request()
    create('Pedidos')
    expect((await screen.findByRole('alert')).textContent).toBe(UNCONFIRMED)
    cut = false
    fireEvent.click(screen.getByRole('button', { name: 'Criar e começar' }))
    await waitFor(() => expect(projects).toHaveLength(2))
    expect(projects[1]?.key).toBe(projects[0]?.key)
  })
}

for (const [name, answer] of undecided('{"conversation":{"id":"ccc')) {
  test(`a conversa cortada depois do Projeto (${name}): tentar de novo não cria outro Projeto`, async () => {
    let cut = true
    const { projects, conversations, conexus } = home({
      answers: { create: () => (cut ? answer() : undefined) },
    })
    await request()
    create('Pedidos')
    expect((await screen.findByRole('alert')).textContent).toBe(UNCONFIRMED)
    expect(screen.queryByRole('textbox', { name: 'Nome do projeto' })).toBeNull()
    expect(screen.getByText('Nome do projeto').nextElementSibling?.textContent).toBe('Pedidos')
    expect(screen.queryByRole('button', { name: 'Voltar' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Abrir o Projeto' })).toBeTruthy()
    cut = false
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    await waitFor(() =>
      expect(conexus.router.state.location.pathname).toBe(`${PROJECT}/conversations/${SECOND}`),
    )
    expect(projects).toHaveLength(1)
    expect(conversations()).toHaveLength(2)
    expect(conversations()[1]?.attemptKey).toBe(conversations()[0]?.attemptKey)
  })
}

test('a conversa cortada depois do Projeto: "Abrir o Projeto" abre a página sem conversa', async () => {
  const { conexus } = home({ answers: { create: () => HttpResponse.error() } })
  await request()
  create('Pedidos')
  fireEvent.click(await screen.findByRole('button', { name: 'Abrir o Projeto' }))
  expect(await screen.findByText('Nenhuma conversa')).toBeTruthy()
  expect(conexus.router.state.location.pathname).toBe(PROJECT)
})

test('o modelo recusado depois do Projeto abre o Projeto com a frase', async () => {
  const { conversations, conexus } = home({
    answers: { create: () => refusal('MODEL_NO_ACCOUNT') },
  })
  await request()
  create('Pedidos')
  expect(await screen.findByText(new RegExp(REQUEST_NOT_SENT))).toBeTruthy()
  expect(conexus.router.state.location.pathname).toBe(PROJECT)
  expect(screen.getByText('Nenhuma conversa')).toBeTruthy()
  expect(conversations()).toHaveLength(1)
})

test('o rascunho do Início volta e some depois de criar', async () => {
  const { conexus, messages } = home()
  fireEvent.change(await box(), { target: { value: 'meio da frase' } })
  const companyId = CompanyId.parse(COMPANY.id)
  await conexus.router.navigate({ to: '/companies/$companyId/projects', params: { companyId } })
  await screen.findByRole('heading', { name: 'Todos os projetos' })
  await conexus.router.navigate({ to: '/companies/$companyId', params: { companyId } })
  expect(typed(await box())).toBe('meio da frase')
  await request()
  create('Pedidos')
  await waitFor(() => expect(messages()).toHaveLength(1))
  await conexus.router.navigate({ to: '/companies/$companyId', params: { companyId } })
  expect(typed(await box())).toBe('')
})

test('Criar numa empresa que o Hub já não acha', async () => {
  home({ project: () => refusal('NOT_FOUND') })
  await request()
  server.use(http.get(`*/api/companies/${COMPANY.id}/projects`, () => refusal('NOT_FOUND')))
  create('Pedidos')
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
})
