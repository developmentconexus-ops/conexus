import { createProject, FAILURES, ProjectSummary } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import type { ProjectsView } from '../../platform/test-hub.tsx'
import { hubServer, PEDIDOS, projectsRead, refusal, undecided } from '../../platform/test-hub.tsx'

const server = hubServer()
const PROJECTS = `/companies/${COMPANY.id}/projects`
const UNCONFIRMED = 'Não confirmamos a criação. Tente de novo.'
const CUT = undecided('{"project":{"id":"ppp')

type Sent = { key: string | null; body: unknown }

/** The Hub with `view`'s Projects; each Project written is recorded and answered by `answer`. */
function hub(
  view: Partial<ProjectsView>,
  answer: (sent: Sent) => Response | typeof CREATED = created,
) {
  const state: ProjectsView = { projects: [], databaseReady: true, mayDelete: true, ...view }
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
          createProject.success.body.parse({ project: { ...project, mayDelete: true } }),
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

function open(path = PROJECTS) {
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

function create(name: string) {
  fireEvent.change(screen.getByLabelText('Nome do Projeto'), { target: { value: name } })
  fireEvent.click(screen.getByRole('button', { name: 'Criar Projeto' }))
}

test('vazio: "Nenhum Projeto ainda." e Criar Projeto', async () => {
  hub({})
  open()
  expect(await screen.findByText('Nenhum Projeto ainda.')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Criar Projeto' })).toBeTruthy()
})

test('cada linha: o nome, "Criado em" e o link para o Projeto', async () => {
  hub({ projects: [PEDIDOS] })
  const router = open()
  const link = await screen.findByRole('link', { name: /Pedidos/ })
  expect(link.textContent).toContain('Criado em 17/10/2026')
  fireEvent.click(link)
  expect(await screen.findByRole('heading', { name: 'Pedidos' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(`${PROJECTS}/${PEDIDOS.id}`)
})

test('a página fica no endereço: "Ver mais" pede a que segue', async () => {
  const asked: string[] = []
  hub({ projects: [PEDIDOS] })
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/projects`, ({ request }) => {
      asked.push(new URL(request.url).search)
      return HttpResponse.json({
        projects: [PEDIDOS],
        next: { kind: 'MORE', page: 'c'.repeat(32) },
        databaseReady: true,
      })
    }),
  )
  const router = open()
  fireEvent.click(await screen.findByRole('link', { name: 'Ver mais: Projetos' }))
  expect(await screen.findByRole('link', { name: 'Primeira página: Projetos' })).toBeTruthy()
  expect(router.state.location.search).toEqual({ page: 'c'.repeat(32) })
  expect(asked).toEqual(['', `?page=${'c'.repeat(32)}`])
})

test('criar: o pedido leva o nome e uma chave, e o Projeto aparece na lista', async () => {
  const { sent } = hub({})
  open()
  await screen.findByText('Nenhum Projeto ainda.')
  create('Pedidos')
  expect(await screen.findByRole('link', { name: /Pedidos/ })).toBeTruthy()
  expect(sent).toHaveLength(1)
  expect(sent[0]?.body).toEqual({ name: 'Pedidos' })
  expect(sent[0]?.key).toBeTruthy()
  expect(screen.getByLabelText('Nome do Projeto')).toHaveProperty('value', '')
  expect(screen.queryByText('Nenhum Projeto ainda.')).toBeNull()
})

test('o nome vazio não sai: o erro no campo e nenhum pedido', async () => {
  const { sent } = hub({})
  open()
  await screen.findByText('Nenhum Projeto ainda.')
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
      <Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [PROJECTS] }))} />,
    )
    await screen.findByText('Nenhum Projeto ainda.')
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
  await screen.findByText('Nenhum Projeto ainda.')
  create('Pedidos')
  expect(await screen.findByText(/Já existe um Projeto com esse nome nesta empresa\./)).toBeTruthy()
  await waitFor(() =>
    expect(screen.getByLabelText('Nome do Projeto').getAttribute('aria-invalid')).toBe('true'),
  )
})

for (const code of ['COMPANY_DATABASE_PREPARING', 'COMPANY_DATABASE_UNAVAILABLE'] as const) {
  test(`${code}: a frase e "Tentar de novo", que manda o pedido outra vez`, async () => {
    let refuse = true
    const { sent } = hub({}, () => (refuse ? refusal(code) : CREATED))
    open()
    await screen.findByText('Nenhum Projeto ainda.')
    create('Pedidos')
    expect((await screen.findByRole('alert')).textContent).toBe(
      `${FAILURES[code].phrase} ${FAILURES[code].action}`,
    )
    refuse = false
    fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
    expect(await screen.findByRole('link', { name: /Pedidos/ })).toBeTruthy()
    expect(sent).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  })
}

for (const [name, answer] of CUT) {
  test(`${name}: "${UNCONFIRMED}" e a nova tentativa leva a mesma chave`, async () => {
    let cut = true
    const { sent } = hub({}, () => (cut ? answer() : CREATED))
    open()
    await screen.findByText('Nenhum Projeto ainda.')
    create('Pedidos')
    expect((await screen.findByRole('alert')).textContent).toBe(UNCONFIRMED)
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
    cut = false
    fireEvent.click(screen.getByRole('button', { name: 'Criar Projeto' }))
    await waitFor(() => expect(sent).toHaveLength(2))
    expect(sent[1]?.key).toBe(sent[0]?.key)
  })
}

test('depois de uma resposta inteira, o próximo Projeto leva outra chave', async () => {
  const { sent } = hub({})
  open()
  await screen.findByText('Nenhum Projeto ainda.')
  create('Pedidos')
  await screen.findByRole('link', { name: /Pedidos/ })
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

test('"Projeto apagado." chega uma vez e sai do endereço', async () => {
  hub({ projects: [PEDIDOS] })
  const router = open(`${PROJECTS}?notice=deleted`)
  expect(await screen.findByText('Projeto apagado.')).toBeTruthy()
  await waitFor(() => expect(router.state.location.search).toEqual({}))
  expect(screen.getByText('Projeto apagado.')).toBeTruthy()
})

test('o endereço da empresa abre os Projetos', async () => {
  hub({})
  const router = open(`/companies/${COMPANY.id}`)
  expect(await screen.findByText('Nenhum Projeto ainda.')).toBeTruthy()
  expect(router.state.location.pathname).toBe(PROJECTS)
})
