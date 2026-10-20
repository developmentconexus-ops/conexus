import { getCompany, listCompanies, listProjects } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { beforeEach, expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { centralHub, homeHub, hubServer, NO_COMPANIES, refusal } from '../../platform/test-hub.tsx'

const server = hubServer()

const FIRST = { id: 'a'.repeat(32), name: 'Empresa Teste' }
const SECOND = { id: 'b'.repeat(32), name: 'Outra Empresa' }

function listed(...companies: { id: string; name: string }[]) {
  return listCompanies.success.body.parse({
    companies: companies.map((company) => ({ company, role: 'member' })),
    mayOperate: false,
    next: { kind: 'END' },
  })
}

function companyHandlers(...companies: { id: string; name: string }[]) {
  return [
    http.get('*/api/companies/:companyId', ({ params }) => {
      const company = companies.find(({ id }) => id === params.companyId)
      if (company === undefined) return refusal('NOT_FOUND')
      return HttpResponse.json(
        getCompany.success.body.parse({
          company: { ...COMPANY, ...company },
          role: 'member',
          mayInviteAs: [],
        }),
      )
    }),
    http.get('*/api/companies/:companyId/projects', () =>
      HttpResponse.json(
        listProjects.success.body.parse({
          projects: [],
          next: { kind: 'END' },
          databaseReady: true,
        }),
      ),
    ),
  ]
}

function hub(companies: unknown, state = { signedIn: true }) {
  server.use(...homeHub(state, companies), ...companyHandlers(FIRST, SECOND))
}

function open(path = '/') {
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

function remembered(...ids: string[]) {
  globalThis.localStorage.setItem(`conexus-remembered:${ANA.id}:companies`, ids.join(' '))
}

beforeEach(() => globalThis.localStorage.clear())

test('sem sessão, / leva a /login com o endereço de volta, sem desenhar a moldura', async () => {
  hub(NO_COMPANIES, { signedIn: false })
  const router = open()
  expect(await screen.findByRole('heading', { name: 'Entrar no Conexus' })).toBeTruthy()
  expect(router.state.location.pathname).toBe('/login')
  expect(router.state.location.search).toEqual({ redirect: '/' })
  expect(screen.queryByRole('navigation', { name: 'Navegação' })).toBeNull()
})

test('com uma empresa, / abre o Início dela (critério 2)', async () => {
  hub(listed(FIRST))
  const router = open()
  expect(await screen.findByRole('heading', { name: 'O que vamos construir?' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(`/companies/${FIRST.id}`)
  expect(screen.getByRole('link', { name: 'Início' })).toBeTruthy()
})

test('com duas empresas e nenhuma lembrada, / abre a primeira da lista (critério 2)', async () => {
  hub(listed(FIRST, SECOND))
  const router = open()
  expect(await screen.findByRole('heading', { name: 'O que vamos construir?' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(`/companies/${FIRST.id}`)
})

test('com duas empresas, / abre a que este navegador abriu por último (critério 2)', async () => {
  hub(listed(FIRST, SECOND))
  remembered(SECOND.id)
  const router = open()
  expect(await screen.findByRole('heading', { name: 'O que vamos construir?' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(`/companies/${SECOND.id}`)
})

test('abrir uma empresa a lembra para o próximo / deste navegador (critério 2)', async () => {
  hub(listed(FIRST, SECOND))
  const router = open(`/companies/${SECOND.id}`)
  expect(await screen.findByRole('heading', { name: 'O que vamos construir?' })).toBeTruthy()
  await router.navigate({ to: '/' })
  await waitFor(() => expect(router.state.location.pathname).toBe(`/companies/${SECOND.id}`))
})

test('a empresa lembrada que o Hub não lista mais: / abre a primeira (critério 2)', async () => {
  hub(listed(FIRST, SECOND))
  remembered('c'.repeat(32))
  const router = open()
  expect(await screen.findByRole('heading', { name: 'O que vamos construir?' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(`/companies/${FIRST.id}`)
})

test('sem empresa, / diz que a pessoa não está em nenhuma e oferece "Sair do Conexus" (critério 2)', async () => {
  hub(NO_COMPANIES)
  const router = open()
  expect(await screen.findByText('Você ainda não está em nenhuma empresa.')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Sair do Conexus' })).toBeTruthy()
  expect(router.state.location.pathname).toBe('/')
})

test('o operador sem empresa vai à Central (critério 2)', async () => {
  server.use(...centralHub([]))
  const router = open()
  expect(await screen.findByText('Central de Operação')).toBeTruthy()
  expect(router.state.location.pathname).toBe('/operations/clients')
})

test('depois de entrar com Enter, o foco vai para o título da página (#32-4)', async () => {
  hub(listed(FIRST), { signedIn: false })
  open()
  fireEvent.change(await screen.findByLabelText('E-mail'), { target: { value: ANA.email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-certa-1' } })
  const form = screen.getByRole('button', { name: 'Entrar' }).closest('form')
  if (form === null) throw new Error('the sign-in form is missing')
  fireEvent.submit(form)
  const title = await screen.findByRole('heading', { name: 'O que vamos construir?' })
  await waitFor(() => expect(document.activeElement).toBe(title))
})

test('com o carregamento da página preso, o título que aparece depois recebe o foco', async () => {
  const state = { signedIn: false }
  hub(listed(FIRST), state)
  const held = Promise.withResolvers<void>()
  server.use(
    http.get('*/api/companies', async () => {
      await held.promise
      return HttpResponse.json(listed(FIRST))
    }),
  )
  open()
  fireEvent.change(await screen.findByLabelText('E-mail'), { target: { value: ANA.email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-certa-1' } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  await waitFor(() => expect(state.signedIn).toBe(true))
  expect(screen.queryByRole('heading', { name: 'O que vamos construir?' })).toBeNull()
  held.resolve()
  const title = await screen.findByRole('heading', { name: 'O que vamos construir?' })
  await waitFor(() => expect(document.activeElement).toBe(title))
})

test('o Hub sem banco ao ler a sessão: "Não foi possível abrir o Conexus" com a frase, sem "Tentar de novo"', async () => {
  server.use(http.get('*/api/sessions/current', () => refusal('DATABASE_UNAVAILABLE')))
  open()
  expect(
    await screen.findByRole('heading', { name: 'Não foi possível abrir o Conexus' }),
  ).toBeTruthy()
  expect(screen.getByRole('alert').textContent).toBe(
    'O banco do Conexus não respondeu. O erro foi registrado. Avise quem cuida do Conexus.',
  )
  expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
})

test('uma falha que o Hub manda tentar de novo mostra "Tentar de novo", que lê a sessão outra vez', async () => {
  let reads = 0
  server.use(
    http.get('*/api/sessions/current', () => {
      reads += 1
      return refusal('REQUEST_MALFORMED')
    }),
  )
  open()
  fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }))
  await waitFor(() => expect(reads).toBe(2))
})
