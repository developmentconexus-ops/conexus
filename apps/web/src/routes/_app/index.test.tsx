import {
  getCompany,
  listCompanies,
  listModelAccounts,
  listModelProviders,
  listProjects,
} from '@conexus/hub-api'
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

const SONNET = 'anthropic/claude-sonnet-4'
const { providers: PROVIDERS } = listModelProviders.success.body.parse({
  providers: [{ id: 'anthropic', name: 'Anthropic', models: [{ id: SONNET, efforts: ['off'] }] }],
})

/** A model account the box can start on, which puts the Início's text field on the page. */
function startable() {
  server.use(
    http.get('*/api/companies/:companyId/model-accounts', () =>
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
  expect(await screen.findByText('Central')).toBeTruthy()
  expect(router.state.location.pathname).toBe('/operations/clients')
})

test('depois de entrar, o foco vai à caixa (#32-4)', async () => {
  hub(listed(FIRST), { signedIn: false })
  startable()
  open()
  fireEvent.change(await screen.findByLabelText('E-mail'), { target: { value: ANA.email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-certa-1' } })
  const form = screen.getByRole('button', { name: 'Entrar' }).closest('form')
  if (form === null) throw new Error('the sign-in form is missing')
  fireEvent.submit(form)
  const box = await screen.findByRole('textbox', { name: 'Mensagem para o Builder' })
  await waitFor(() => expect(document.activeElement).toBe(box))
  expect(box.tabIndex).toBe(0)
})

test('numa página sem campo, o título recebe o foco (#32-4)', async () => {
  hub(NO_COMPANIES, { signedIn: false })
  open()
  await signInFromLogin()
  const title = await screen.findByRole('heading', {
    name: 'Você ainda não está em nenhuma empresa.',
  })
  await waitFor(() => expect(document.activeElement).toBe(title))
  expect(title.tabIndex).toBe(-1)
})

test('numa página só com caixa de marcar ou opção, o título recebe o foco (#32-4)', async () => {
  hub(listed(FIRST), { signedIn: false })
  open(`/companies/${FIRST.id}/settings/appearance`)
  await signInFromLogin()
  await screen.findByRole('heading', { name: 'Aparência' })
  await waitFor(() =>
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Aparência' })),
  )
})

test('com o carregamento da página preso, a caixa que aparece depois recebe o foco', async () => {
  const state = { signedIn: false }
  hub(listed(FIRST), state)
  startable()
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
  const box = await screen.findByRole('textbox', { name: 'Mensagem para o Builder' })
  await waitFor(() => expect(document.activeElement).toBe(box))
})

async function signInFromLogin() {
  fireEvent.change(await screen.findByLabelText('E-mail'), { target: { value: ANA.email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-certa-1' } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

test('depois de entrar, abre a página pedida, não a primeira empresa', async () => {
  hub(listed(FIRST, SECOND), { signedIn: false })
  const router = open(`/companies/${SECOND.id}`)
  await signInFromLogin()
  expect(await screen.findByRole('heading', { name: 'O que vamos construir?' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(`/companies/${SECOND.id}`)
})

test('depois do foco na caixa, uma nova renderização não o puxa de volta', async () => {
  hub(listed(FIRST), { signedIn: false })
  startable()
  const router = open()
  await signInFromLogin()
  const box = await screen.findByRole('textbox', { name: 'Mensagem para o Builder' })
  await waitFor(() => expect(document.activeElement).toBe(box))
  const account = screen.getByRole('button', { name: /Ana/ })
  account.focus()
  await router.invalidate()
  expect(document.activeElement).toBe(account)
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
