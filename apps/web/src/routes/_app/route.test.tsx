import { FAILURES, listCompanies, Problem } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'

const ANA = { id: 'person-ana', name: 'Ana Lima', email: 'ana@example.test' }
const STATUS = { version: 'v0.1.0', lastStart: { state: 'NONE' }, previousStart: { state: 'NONE' } }
const NO_COMPANIES = { companies: [], mayCreate: false, next: { kind: 'END' } }
const asked: string[] = []
const server = setupServer()
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

function refusal(code: keyof typeof FAILURES) {
  const row = FAILURES[code]
  const body = Problem.parse({
    type: `urn:conexus:problem:${code}`,
    title: row.phrase,
    status: row.status,
    code,
    traceId: 'a1b2c3',
  })
  return HttpResponse.json(body, {
    status: row.status,
    headers: { 'content-type': 'application/problem+json' },
  })
}

function hub(state: { signedIn: boolean }, companies: unknown = NO_COMPANIES) {
  server.use(
    http.get('*/api/sessions/current', () =>
      HttpResponse.json(
        state.signedIn ? { state: 'SIGNED_IN', person: ANA } : { state: 'SIGNED_OUT' },
      ),
    ),
    http.put('*/api/sessions/current', () => {
      state.signedIn = true
      return HttpResponse.json({ person: ANA })
    }),
    http.get('*/api/status', () => HttpResponse.json(STATUS)),
    http.get('*/api/companies', ({ request }) => {
      asked.push(new URL(request.url).search)
      return HttpResponse.json(listCompanies.success.body.parse(companies))
    }),
  )
}

function open(path: string) {
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

test('sem sessão, / leva a /login com o endereço de volta, sem desenhar a moldura', async () => {
  hub({ signedIn: false })
  const router = open('/')
  expect(await screen.findByRole('heading', { name: 'Entrar no Conexus' })).toBeTruthy()
  expect(router.state.location.pathname).toBe('/login')
  expect(router.state.location.search).toEqual({ redirect: '/' })
  expect(screen.queryByRole('button', { name: 'Abrir navegação' })).toBeNull()
  expect(screen.queryByText(/Você entrou como/)).toBeNull()
})

test('com sessão, a moldura, "Você entrou como {nome}." e a versão do Hub', async () => {
  hub({ signedIn: true })
  open('/')
  expect(await screen.findByText('Você entrou como Ana Lima.')).toBeTruthy()
  expect(await screen.findByText('v0.1.0')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Conta de Ana Lima' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Abrir navegação' })).toBeTruthy()
  expect(screen.getAllByRole('link', { name: 'Início' }).length).toBeGreaterThan(0)
})

test('depois de entrar, abre a página pedida, não a de entrar', async () => {
  hub({ signedIn: false })
  const router = open('/?from=link')
  fireEvent.change(await screen.findByLabelText('E-mail'), { target: { value: ANA.email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-certa-1' } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(await screen.findByText('Você entrou como Ana Lima.')).toBeTruthy()
  expect(router.state.location.href).toBe('/?from=link')
})

test('o Hub sem banco ao ler a sessão: "Não foi possível abrir o Conexus" com a frase, sem "Tentar de novo"', async () => {
  server.use(http.get('*/api/sessions/current', () => refusal('DATABASE_UNAVAILABLE')))
  open('/')
  expect(
    await screen.findByRole('heading', { name: 'Não foi possível abrir o Conexus' }),
  ).toBeTruthy()
  expect(screen.getByRole('alert').textContent).toBe(
    'O banco do Conexus não respondeu. O erro foi registrado. Avise quem cuida do Conexus.',
  )
  expect(screen.queryByRole('button', { name: 'Tentar de novo' })).toBeNull()
})

const EMPRESA = { id: 'a'.repeat(32), name: 'Empresa Teste' }

test('Início lista as empresas com o papel de quem lê, e abre a empresa pelo nome', async () => {
  hub(
    { signedIn: true },
    {
      companies: [
        { company: EMPRESA, role: 'owner' },
        { company: { id: 'b'.repeat(32), name: 'Outra Empresa' }, role: 'member' },
      ],
      mayCreate: true,
      next: { kind: 'END' },
    },
  )
  open('/')
  expect(await screen.findByRole('heading', { name: 'Suas empresas' })).toBeTruthy()
  expect(screen.getByRole('link', { name: /^Empresa Teste\s*Dono$/ })).toBeTruthy()
  expect(screen.getByRole('link', { name: /^Outra Empresa\s*Membro$/ })).toBeTruthy()
  expect(screen.queryByText('Você ainda não participa de nenhuma empresa.')).toBeNull()
})

test('sem empresas: "Você ainda não participa de nenhuma empresa."', async () => {
  hub({ signedIn: true })
  open('/')
  expect(await screen.findByText('Você ainda não participa de nenhuma empresa.')).toBeTruthy()
})

for (const [mayCreate, shown] of [
  [true, 1],
  [false, 0],
] as const) {
  test(`"Nova empresa" ${shown ? 'aparece' : 'não aparece'} quando mayCreate é ${mayCreate}`, async () => {
    hub({ signedIn: true }, { companies: [], mayCreate, next: { kind: 'END' } })
    open('/')
    await screen.findByRole('heading', { name: 'Suas empresas' })
    expect(screen.queryAllByRole('link', { name: 'Nova empresa' }).length).toBe(shown)
  })
}

test('a lista mantém a página no endereço: "Ver mais" pede a página que segue e "Primeira página" volta', async () => {
  asked.length = 0
  const next = { kind: 'MORE', page: 'c'.repeat(32) }
  hub(
    { signedIn: true },
    { companies: [{ company: EMPRESA, role: 'owner' }], mayCreate: false, next },
  )
  const router = open('/')
  fireEvent.click(await screen.findByRole('link', { name: 'Ver mais' }))
  expect(await screen.findByRole('link', { name: 'Primeira página' })).toBeTruthy()
  expect(router.state.location.href).toBe(`/?page=${'c'.repeat(32)}`)
  expect(asked).toEqual(['', `?page=${'c'.repeat(32)}`])
  fireEvent.click(screen.getByRole('link', { name: 'Primeira página' }))
  await waitFor(() => expect(router.state.location.href).toBe('/'))
})

test('depois de entrar com Enter, o foco vai para o título da página (#32-4)', async () => {
  hub({ signedIn: false })
  open('/')
  fireEvent.change(await screen.findByLabelText('E-mail'), { target: { value: ANA.email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-certa-1' } })
  const form = screen.getByRole('button', { name: 'Entrar' }).closest('form')
  if (form === null) throw new Error('the sign-in form is missing')
  fireEvent.submit(form)
  const title = await screen.findByRole('heading', { name: 'Início' })
  await waitFor(() => expect(document.activeElement).toBe(title))
})

async function signInFromLogin() {
  fireEvent.change(await screen.findByLabelText('E-mail'), { target: { value: ANA.email } })
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-certa-1' } })
  fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))
}

test('com o carregamento da página preso, o título que aparece depois recebe o foco', async () => {
  const state = { signedIn: false }
  hub(state)
  const held = Promise.withResolvers<void>()
  server.use(
    http.get('*/api/companies', async () => {
      await held.promise
      return HttpResponse.json(listCompanies.success.body.parse(NO_COMPANIES))
    }),
  )
  open('/')
  await signInFromLogin()
  await waitFor(() => expect(state.signedIn).toBe(true))
  expect(screen.queryByRole('heading', { name: 'Início' })).toBeNull()
  held.resolve()
  const title = await screen.findByRole('heading', { name: 'Início' })
  await waitFor(() => expect(document.activeElement).toBe(title))
})

test('depois do foco no título, uma nova renderização não o puxa de volta', async () => {
  hub({ signedIn: false })
  const router = open('/')
  await signInFromLogin()
  const title = await screen.findByRole('heading', { name: 'Início' })
  await waitFor(() => expect(document.activeElement).toBe(title))
  const account = screen.getByRole('button', { name: /Ana/ })
  account.focus()
  await router.invalidate()
  await router.navigate({ href: `/?page=${'c'.repeat(32)}` })
  expect(document.activeElement).toBe(account)
})
