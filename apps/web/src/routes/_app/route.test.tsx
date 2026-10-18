import { listCompanies } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA } from '../../platform/fixtures.ts'
import type { ProjectsView } from '../../platform/test-hub.tsx'
import {
  homeHub,
  hubServer,
  NO_COMPANIES,
  projectsRead,
  refusal,
} from '../../platform/test-hub.tsx'

const asked: string[] = []
const server = hubServer()

function hub(state: { signedIn: boolean }, companies: unknown = NO_COMPANIES) {
  server.use(...homeHub(state, companies, (search) => asked.push(search)))
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

test('com sessão, a moldura e "Você entrou como {nome}.", sem o estado do Hub', async () => {
  hub({ signedIn: true })
  open('/')
  expect(await screen.findByText('Você entrou como Ana Lima.')).toBeTruthy()
  expect(screen.queryByText('v0.1.0')).toBeNull()
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

test('uma falha que o Hub manda tentar de novo mostra "Tentar de novo", que lê a sessão outra vez', async () => {
  let reads = 0
  server.use(
    http.get('*/api/sessions/current', () => {
      reads += 1
      return refusal('REQUEST_MALFORMED')
    }),
  )
  open('/')
  fireEvent.click(await screen.findByRole('button', { name: 'Tentar de novo' }))
  await waitFor(() => expect(reads).toBe(2))
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
      mayOperate: true,
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

test('sem empresas, também para o operador: a lista não tem botão nem link, só a frase', async () => {
  hub({ signedIn: true }, { companies: [], mayOperate: true, next: { kind: 'END' } })
  open('/')
  const list = (await screen.findByRole('heading', { name: 'Suas empresas' })).closest('section')
  expect(list?.textContent).toBe('Suas empresasVocê ainda não participa de nenhuma empresa.')
  expect(list?.querySelectorAll('a, button').length).toBe(0)
})

test('a lista mantém a página no endereço: "Ver mais" pede a página que segue e "Primeira página" volta', async () => {
  asked.length = 0
  const next = { kind: 'MORE', page: 'c'.repeat(32) }
  hub(
    { signedIn: true },
    { companies: [{ company: EMPRESA, role: 'owner' }], mayOperate: false, next },
  )
  const router = open('/')
  fireEvent.click(await screen.findByRole('link', { name: 'Ver mais: Empresas' }))
  expect(await screen.findByRole('link', { name: 'Primeira página: Empresas' })).toBeTruthy()
  expect(router.state.location.href).toBe(`/?page=${'c'.repeat(32)}`)
  expect(asked).toEqual(['', `?page=${'c'.repeat(32)}`])
  fireEvent.click(screen.getByRole('link', { name: 'Primeira página: Empresas' }))
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

const ONE = {
  companies: [{ company: EMPRESA, role: 'member' }],
  mayOperate: false,
  next: { kind: 'END' },
}
const TWO = {
  ...ONE,
  companies: [
    ...ONE.companies,
    { company: { id: 'b'.repeat(32), name: 'Outra Empresa' }, role: 'owner' },
  ],
}

function projectsOf(view: ProjectsView) {
  server.use(...projectsRead(view))
}

test('com uma empresa, / abre os Projetos dela, e a moldura lista Projetos e Pessoas sem troca de empresa', async () => {
  hub({ signedIn: true }, ONE)
  projectsOf({ projects: [], databaseReady: false, mayDelete: false })
  const router = open('/')
  expect(await screen.findByRole('heading', { name: 'Projetos' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(`/companies/${EMPRESA.id}/projects`)
  const rail = screen.getAllByRole('navigation', { name: 'Navegação' })[0]
  if (rail === undefined) throw new Error('the rail is missing')
  expect(within(rail).getByRole('link', { name: 'Projetos' })).toBeTruthy()
  expect(within(rail).getByRole('link', { name: 'Pessoas' })).toBeTruthy()
  expect(within(rail).queryByRole('link', { name: 'Início' })).toBeNull()
  expect(screen.queryByRole('button', { name: /Trocar de empresa/ })).toBeNull()
})

test('com duas empresas, / mostra a lista; dentro de uma, a troca de empresa leva à outra e a "Suas empresas"', async () => {
  hub({ signedIn: true }, TWO)
  projectsOf({ projects: [], databaseReady: true, mayDelete: false })
  const router = open(`/companies/${EMPRESA.id}/projects`)
  fireEvent.click(
    await screen.findByRole('button', { name: 'Trocar de empresa. Agora: Empresa Teste' }),
  )
  expect(await screen.findByRole('menuitem', { name: 'Empresa Teste' })).toBeTruthy()
  fireEvent.click(screen.getByRole('menuitem', { name: 'Suas empresas' }))
  expect(await screen.findByRole('heading', { name: 'Suas empresas' })).toBeTruthy()
  expect(router.state.location.pathname).toBe('/')
})

test('a empresa que o Hub não acha: "não encontrado" sem os lugares dela nem a troca de empresa', async () => {
  hub({ signedIn: true }, TWO)
  const asked: string[] = []
  server.use(
    http.get(`*/api/companies/${EMPRESA.id}/projects`, ({ request }) => {
      asked.push(request.url)
      return refusal('NOT_FOUND')
    }),
  )
  open(`/companies/${EMPRESA.id}/projects`)
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
  const rail = screen.getAllByRole('navigation', { name: 'Navegação' })[0]
  if (rail === undefined) throw new Error('the rail is missing')
  expect(within(rail).getByRole('link', { name: 'Início' })).toBeTruthy()
  for (const name of ['Projetos', 'Pessoas']) {
    expect(within(rail).queryByRole('link', { name })).toBeNull()
  }
  expect(screen.queryByRole('button', { name: /Trocar de empresa/ })).toBeNull()
  expect(asked).toHaveLength(1)
})
