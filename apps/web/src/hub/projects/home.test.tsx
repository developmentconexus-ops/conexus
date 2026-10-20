import { CompanyId, createProject, FAILURES, ProjectSummary } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import type { ProjectsView } from '../../platform/test-hub.tsx'
import {
  hubServer,
  PEDIDOS,
  PEDIDOS_ADDRESS,
  projectsRead,
  refusal,
  undecided,
} from '../../platform/test-hub.tsx'

const server = hubServer()
const HOME = `/companies/${COMPANY.id}`
const PROJECTS = `${HOME}/projects`
const UNCONFIRMED = 'Não confirmamos a criação. Tente de novo.'
const CUT = undecided('{"project":{"id":"ppp')

type Sent = { key: string | null; body: unknown }

/** The Hub with `view`'s Projects; each Project written is recorded and answered by `answer`. */
function hub(
  view: Partial<ProjectsView>,
  answer: (sent: Sent) => Response | typeof CREATED = created,
) {
  const state: ProjectsView = {
    projects: [],
    databaseReady: true,
    mayDelete: true,
    role: 'member',
    ...view,
  }
  const sent: Sent[] = []
  server.use(
    ...projectsRead(state),
    http.post(`*/api/companies/${COMPANY.id}/projects`, async ({ request }) => {
      const one = { key: request.headers.get('idempotency-key'), body: await request.json() }
      sent.push(one)
      const response = answer(one)
      if (response === CREATED) {
        const { name } = createProject.input.body.parse(one.body)
        const project = ProjectSummary.parse({ ...PEDIDOS, id: 'q'.repeat(32), name })
        state.projects = [project, ...state.projects]
        state.databaseReady = true
        return HttpResponse.json(
          createProject.success.body.parse({
            project: {
              ...project,
              mayDelete: true,
              mayManageVersions: true,
              address: PEDIDOS_ADDRESS,
            },
          }),
          { status: 201 },
        )
      }
      return response
    }),
  )
  return { state, sent }
}

const CREATED = 'created' as const
function created() {
  return CREATED
}

function open(path = HOME) {
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

function create(name: string) {
  fireEvent.change(screen.getByLabelText('Nome do projeto'), { target: { value: name } })
  fireEvent.click(screen.getByRole('button', { name: 'Criar projeto' }))
}

test('vazio: "Nenhum projeto ainda." e Criar Projeto', async () => {
  hub({})
  open()
  expect(await screen.findByText('Nenhum projeto ainda.')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Criar projeto' })).toBeTruthy()
})

test('Início: "O que vamos construir?", o campo, o botão e a barra à esquerda', async () => {
  hub({})
  open()
  expect(await screen.findByRole('heading', { name: 'O que vamos construir?' })).toBeTruthy()
  expect(screen.getByLabelText('Nome do projeto')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Criar projeto' })).toBeTruthy()
  expect(screen.getByRole('navigation', { name: 'Navegação' })).toBeTruthy()
})

test('cada cartão: o nome, "Criado em" e o link que abre o Projeto', async () => {
  hub({ projects: [PEDIDOS] })
  const router = open()
  const link = await within(await screen.findByRole('main')).findByRole('link', { name: /Pedidos/ })
  expect(link.textContent).toContain('Criado em 17/10/2026')
  fireEvent.click(link)
  expect(await screen.findByRole('heading', { name: 'Pedidos' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(`${PROJECTS}/${PEDIDOS.id}`)
})

test('"Todos os projetos" só aparece no Início quando há mais Projetos', async () => {
  hub({ projects: [PEDIDOS] })
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
  hub({})
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/projects`, () => refusal('DATABASE_UNAVAILABLE')),
  )
  open()
  expect((await screen.findByRole('alert')).textContent).toContain(
    FAILURES.DATABASE_UNAVAILABLE.phrase,
  )
  expect(screen.getByRole('navigation', { name: 'Navegação' })).toBeTruthy()
})

test('criar: o pedido leva o nome e uma chave, e o Projeto novo abre', async () => {
  const { sent } = hub({})
  const router = open()
  await screen.findByText('Nenhum projeto ainda.')
  create('Pedidos')
  expect(await screen.findByRole('heading', { name: 'Pedidos' })).toBeTruthy()
  expect(sent).toHaveLength(1)
  expect(sent[0]?.body).toEqual({ name: 'Pedidos' })
  expect(sent[0]?.key).toBeTruthy()
  expect(router.state.location.pathname).toBe(`${PROJECTS}/${'q'.repeat(32)}`)
})

test('o nome vazio não sai: o erro no campo e nenhum pedido', async () => {
  const { sent } = hub({})
  open()
  await screen.findByText('Nenhum projeto ainda.')
  create('   ')
  expect(await screen.findByText(/Escreva o nome do Projeto/)).toBeTruthy()
  expect(sent).toHaveLength(0)
})

test('com o banco da empresa: "Criando…"; sem ele: "Preparando o banco da empresa…"', async () => {
  for (const [databaseReady, text] of [
    [true, 'Criando…'],
    [false, 'Preparando o banco da empresa…'],
  ] as const) {
    const held = Promise.withResolvers<void>()
    hub({ databaseReady })
    server.use(
      http.post(`*/api/companies/${COMPANY.id}/projects`, async () => {
        await held.promise
        return refusal('PROJECT_NAME_TAKEN')
      }),
    )
    const view = render(
      <Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [HOME] }))} />,
    )
    await screen.findByText('Nenhum projeto ainda.')
    create('Pedidos')
    expect(await screen.findByRole('button', { name: text })).toHaveProperty('disabled', true)
    held.resolve()
    await screen.findByText(FAILURES.PROJECT_NAME_TAKEN.phrase, { exact: false })
    view.unmount()
  }
})

test('409 de nome repetido: a frase no campo', async () => {
  hub({}, () => refusal('PROJECT_NAME_TAKEN'))
  open()
  await screen.findByText('Nenhum projeto ainda.')
  create('Pedidos')
  expect(await screen.findByText(/Já existe um Projeto com esse nome nesta empresa\./)).toBeTruthy()
  await waitFor(() =>
    expect(screen.getByLabelText('Nome do projeto').getAttribute('aria-invalid')).toBe('true'),
  )
})

test('o endereço do app se monta enquanto se digita o nome, e some se o nome não dá endereço', async () => {
  hub({})
  open()
  await screen.findByText('Nenhum projeto ainda.')
  expect(screen.queryByText(/Endereço do app:/)).toBeNull()
  fireEvent.change(screen.getByLabelText('Nome do projeto'), { target: { value: 'Ação Rápida' } })
  expect(await screen.findByText('acao-rapida--empresa-teste.apps.example.test')).toBeTruthy()
  fireEvent.change(screen.getByLabelText('Nome do projeto'), { target: { value: 'TI' } })
  await waitFor(() => expect(screen.queryByText(/Endereço do app:/)).toBeNull())
})

for (const [code, phrase] of [
  ['PROJECT_ADDRESS_TAKEN', 'Já existe um Projeto com esse endereço nesta empresa. Mude o nome.'],
  ['PROJECT_NAME_NO_ADDRESS', 'O nome precisa ter ao menos três letras ou números.'],
] as const) {
  test(`${code}: a frase no campo Nome`, async () => {
    hub({}, () => refusal(code))
    open()
    await screen.findByText('Nenhum projeto ainda.')
    create('Pedidos')
    const field = screen.getByLabelText('Nome do projeto')
    expect((await screen.findByText(phrase)).getAttribute('role')).toBe('alert')
    await waitFor(() => expect(field.getAttribute('aria-invalid')).toBe('true'))
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  })
}

for (const code of ['COMPANY_DATABASE_PREPARING', 'COMPANY_DATABASE_UNAVAILABLE'] as const) {
  test(`${code}: a frase e "Tentar de novo", que manda o pedido outra vez`, async () => {
    let refuse = true
    const { sent } = hub({}, () => (refuse ? refusal(code) : CREATED))
    open()
    await screen.findByText('Nenhum projeto ainda.')
    create('Pedidos')
    expect((await screen.findByRole('alert')).textContent).toBe(
      `${FAILURES[code].phrase} ${FAILURES[code].action}`,
    )
    refuse = false
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByRole('heading', { name: 'Pedidos' })).toBeTruthy()
    expect(sent).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  })
}

for (const [name, answer] of CUT) {
  test(`${name}: "${UNCONFIRMED}" e a nova tentativa leva a mesma chave`, async () => {
    let cut = true
    const { sent } = hub({}, () => (cut ? answer() : CREATED))
    open()
    await screen.findByText('Nenhum projeto ainda.')
    create('Pedidos')
    expect((await screen.findByRole('alert')).textContent).toBe(UNCONFIRMED)
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
    cut = false
    fireEvent.click(screen.getByRole('button', { name: 'Criar projeto' }))
    await waitFor(() => expect(sent).toHaveLength(2))
    expect(sent[1]?.key).toBe(sent[0]?.key)
  })
}

test('depois de uma resposta inteira, o próximo Projeto leva outra chave', async () => {
  const { sent } = hub({})
  const router = open()
  await screen.findByText('Nenhum projeto ainda.')
  create('Pedidos')
  await screen.findByRole('heading', { name: 'Pedidos' })
  await router.navigate({
    to: '/companies/$companyId',
    params: { companyId: CompanyId.parse(COMPANY.id) },
  })
  await screen.findByRole('heading', { name: 'O que vamos construir?' })
  create('Estoque')
  await waitFor(() => expect(sent).toHaveLength(2))
  expect(sent[1]?.key).not.toBe(sent[0]?.key)
})

test('a empresa que o Hub não acha: a página de "não encontrado"', async () => {
  hub({})
  server.use(http.get(`*/api/companies/${COMPANY.id}/projects`, () => refusal('NOT_FOUND')))
  open()
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
})

test('Criar Projeto numa empresa que o Hub já não acha: a página de "não encontrado"', async () => {
  const { state } = hub({}, () => refusal('NOT_FOUND'))
  open()
  await screen.findByText('Nenhum projeto ainda.')
  server.use(http.get(`*/api/companies/${COMPANY.id}/projects`, () => refusal('NOT_FOUND')))
  create('Pedidos')
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
  expect(state.projects).toEqual([])
  expect(screen.queryByRole('button', { name: 'Criar projeto' })).toBeNull()
})
