import { CompanyId, FAILURES } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, projectsRead, refusal } from '../../platform/test-hub.tsx'
import { choose, PROJECT, SECOND, typed } from './test-hub.tsx'
import { box, create, HOME, PDF, REQUEST, request, START, startHub } from './test-start.tsx'
import { attach } from './test-stream.tsx'
import { EXAMPLES } from './text.ts'

// Início's box, the name step and the draft (step 13.1, criteria 3 to 7 and 12).
const server = hubServer()
const home = startHub(server)

afterEach(() => sessionStorage.clear())

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
  // The draft lives in the page's memory, which the next case shares: the file leaves with it.
  fireEvent.click(screen.getByRole('button', { name: 'Tirar tabela.pdf' }))
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

test('outro modelo escolhido na caixa cria a conversa nele, com o raciocínio que ele tem', async () => {
  const { conversations } = home()
  await box()
  await choose(screen.getByRole('combobox', { name: 'Modelo e raciocínio' }), 'Gemini 2.5 Flash')
  await request()
  create('Pedidos')
  await waitFor(() => expect(conversations()).toHaveLength(1))
  expect(conversations()[0]?.body).toEqual({ model: 'google/gemini-2.5-flash', effort: 'high' })
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

test('sair do Início no passo do nome e voltar devolve o pedido à caixa', async () => {
  const { conexus, projects } = home()
  await request()
  const companyId = CompanyId.parse(COMPANY.id)
  await conexus.router.navigate({ to: '/companies/$companyId/projects', params: { companyId } })
  await screen.findByRole('heading', { name: 'Todos os projetos' })
  await conexus.router.navigate({ to: '/companies/$companyId', params: { companyId } })
  expect(typed(await box())).toBe(REQUEST)
  expect(projects).toHaveLength(0)
})

// The same box in step 4 of the first entry (criteria 14, 27 and 28).
const STEP_FOUR = `${HOME}/welcome/build`

test('Passo 4: a caixa cria e abre a conversa', async () => {
  const { projects, conversations, conexus } = home({ at: STEP_FOUR })
  expect(await screen.findByText('Passo 4 de 4')).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'O que vamos construir primeiro?' })).toBeTruthy()
  expect((await box()).getAttribute('placeholder')).toBe('Descreva o app que você quer…')
  expect(screen.getByRole('list', { name: 'Exemplos' })).toBeTruthy()
  await request()
  create('Pedidos')
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toBe(`${PROJECT}/conversations/${SECOND}`),
  )
  expect(projects).toHaveLength(1)
  expect(conversations()).toHaveLength(1)
})

test('Passo 4: sem conta, o aviso do Início no lugar da caixa', async () => {
  home({ at: STEP_FOUR, start: null })
  expect(
    await screen.findByText(
      'Você ainda não tem uma conta de modelo. Peça a quem administra a empresa ou ligue a sua.',
    ),
  ).toBeTruthy()
  expect(screen.queryByRole('textbox', { name: 'Mensagem para o Builder' })).toBeNull()
})

test('Passo 4: Ir para o início sem pedir nada', async () => {
  const { conexus, projects } = home({ at: STEP_FOUR })
  fireEvent.click(await screen.findByRole('link', { name: 'Ir para o início sem pedir nada' }))
  expect(await screen.findByRole('heading', { name: 'O que vamos construir?' })).toBeTruthy()
  expect(conexus.router.state.location.pathname).toBe(HOME)
  expect(projects).toHaveLength(0)
})

test('Passo 4: Enviar não cobre o passo com a tela de abertura, os Projetos já vieram', async () => {
  home({ at: STEP_FOUR })
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/projects`, async () => {
      await new Promise((done) => setTimeout(done, 300))
      return HttpResponse.json({ projects: [], next: { kind: 'END' }, databaseReady: true })
    }),
  )
  fireEvent.change(await box(), { target: { value: REQUEST } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
  expect(screen.getByText('Passo 4 de 4')).toBeTruthy()
  expect(screen.queryByText('Abrindo o Conexus')).toBeNull()
  expect(screen.getByLabelText('Nome do projeto')).toBeTruthy()
})
