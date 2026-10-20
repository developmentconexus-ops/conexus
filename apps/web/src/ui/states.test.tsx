import { FAILURES } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../main.tsx'
import { ANA, COMPANY } from '../platform/fixtures.ts'
import { hubServer, PEDIDOS, projectsRead, refusal, sessionRead } from '../platform/test-hub.tsx'
import { Notice } from './notice.tsx'

const server = hubServer()

test('Notice is the common polite status without an urgent alert', () => {
  render(<Notice>Senha criada. Você já entrou.</Notice>)
  expect(screen.getByRole('status').textContent).toBe('Senha criada. Você já entrou.')
  expect(screen.queryByRole('alert')).toBeNull()
})

for (const [signedIn, name, href] of [
  [false, 'Entrar', '/login'],
  [true, 'Voltar ao início', '/'],
] as const) {
  test(`NOT_FOUND failure uses INITIAL and the loader's ${name} destination`, async () => {
    server.use(
      sessionRead(() => (signedIn ? ANA : undefined)),
      http.get('*/api/invitations/:id', () => refusal('NOT_FOUND')),
    )
    const entry = `/login?redirect=${encodeURIComponent(`/invitations/${'i'.repeat(32)}`)}`
    const conexus = createConexus(createMemoryHistory({ initialEntries: [entry] }))
    render(<Conexus conexus={conexus} />)
    expect(
      await screen.findByRole('heading', { name: 'Não foi possível abrir o Conexus' }),
    ).toBeTruthy()
    expect(FAILURES.NOT_FOUND.actionKind).toBe('INITIAL')
    expect(screen.getByRole('link', { name }).getAttribute('href')).toBe(href)
    expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
  })
}

const HOME = `/companies/${COMPANY.id}`
const PROJECTS_PATH = `*/api/companies/${COMPANY.id}/projects`

function serve() {
  server.use(
    ...projectsRead({
      projects: [PEDIDOS],
      databaseReady: true,
      mayDelete: false,
      role: 'member',
    }),
  )
}

function openCompany(path: string) {
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [path] }))} />)
}

test('carregando: a moldura já está, o conteúdo é um esqueleto (critério 9)', async () => {
  const held = Promise.withResolvers<void>()
  const page = 'c'.repeat(32)
  serve()
  server.use(
    http.get(PROJECTS_PATH, async ({ request }) => {
      if (new URL(request.url).searchParams.has('page')) await held.promise
      return HttpResponse.json({ projects: [], next: { kind: 'END' }, databaseReady: true })
    }),
  )
  openCompany(`${HOME}/projects?page=${page}`)
  const loading = await screen.findByRole('status', { name: 'Carregando' })
  expect(screen.getByRole('main').contains(loading)).toBe(true)
  expect(
    within(screen.getByRole('navigation', { name: 'Navegação' })).getByRole('link', {
      name: 'Início',
    }),
  ).toBeTruthy()
  expect(screen.queryByRole('heading', { name: 'Todos os projetos' })).toBeNull()
  held.resolve()
  expect(await screen.findByRole('heading', { name: 'Todos os projetos' })).toBeTruthy()
  expect(screen.queryByRole('status', { name: 'Carregando' })).toBeNull()
})

test('erro: na área, com a barra, e "Tentar de novo" lê outra vez (critério 9)', async () => {
  let failing = true
  serve()
  server.use(
    http.get(PROJECTS_PATH, () =>
      failing
        ? refusal('REQUEST_MALFORMED')
        : HttpResponse.json({ projects: [], next: { kind: 'END' }, databaseReady: true }),
    ),
  )
  openCompany(HOME)
  const alert = await screen.findByRole('alert')
  expect(within(screen.getByRole('main')).getByText(alert.textContent ?? '')).toBeTruthy()
  expect(screen.getByRole('navigation', { name: 'Navegação' })).toBeTruthy()
  expect(screen.getAllByRole('main')).toHaveLength(1)
  failing = false
  fireEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }))
  expect(await screen.findByRole('heading', { name: 'O que vamos construir?' })).toBeTruthy()
})

test('não encontrado dentro da moldura: na área, com "Ir para o início", sem um main dentro do outro (critério 9)', async () => {
  const router = createConexus(createMemoryHistory({ initialEntries: [`${HOME}/people`] }))
  server.use(
    ...projectsRead({ projects: [], databaseReady: true, mayDelete: false, role: 'member' }),
  )
  render(<Conexus conexus={router} />)
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
  expect(screen.getAllByRole('main')).toHaveLength(1)
  expect(screen.getByRole('navigation', { name: 'Navegação' })).toBeTruthy()
  fireEvent.click(within(screen.getByRole('main')).getByRole('link', { name: 'Ir para o início' }))
  await screen.findByText('Você ainda não está em nenhuma empresa.')
  expect(router.router.state.location.pathname).toBe('/')
})

test('empresa desconhecida: não encontrado sem a barra, com "Voltar ao início" (critério 9)', async () => {
  server.use(
    sessionRead(() => ANA),
    http.get(`*/api/companies/${COMPANY.id}`, () => refusal('NOT_FOUND')),
  )
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [HOME] }))} />)
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
  expect(screen.queryByRole('navigation', { name: 'Navegação' })).toBeNull()
  expect(screen.getByRole('link', { name: 'Voltar ao início' }).getAttribute('href')).toBe('/')
})
