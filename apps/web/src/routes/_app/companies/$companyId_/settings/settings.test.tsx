import { createMemoryHistory, createRoute } from '@tanstack/react-router'
import type { BoundFunctions, queries } from '@testing-library/react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'
import { Conexus, createConexus } from '../../../../../main.tsx'
import { ANA, COMPANY } from '../../../../../platform/fixtures.ts'
import { companyRead, hubServer, sessionRead } from '../../../../../platform/test-hub.tsx'
import { Route as SettingsRoute } from './route.tsx'

const server = hubServer()
const APPEARANCE = `/companies/${COMPANY.id}/settings/appearance`
// The router reads the tree when it is made, so a test adds a child for its own router and puts the
// real children back (`addChildren` replaces the list in place, in router-core 1.171).
const children = Object.values(SettingsRoute.children ?? {})

afterEach(() => {
  SettingsRoute.addChildren(children)
})

function open(path = APPEARANCE) {
  server.use(
    sessionRead(() => ANA),
    ...companyRead({ role: 'owner' }),
  )
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

type Nav = BoundFunctions<typeof queries>

async function index() {
  return within(await screen.findByRole('navigation', { name: 'Navegação' }))
}

function linksOf(group: HTMLElement) {
  return within(group)
    .getAllByRole('link')
    .map((link) => link.textContent)
}

function groupOf(nav: Nav, name: string) {
  const group = nav.getByRole('heading', { name }).parentElement
  if (!group) throw new Error(`no group ${name}`)
  return group
}

/** The index's sections, without the way back. */
function sections(nav: Nav) {
  return nav
    .queryAllByRole('link')
    .map((link) => link.textContent)
    .filter((text) => text !== 'Voltar')
}

test('Configurações: Voltar, a busca, Você e a empresa, cada seção na sua ordem e nenhuma reservada', async () => {
  open()
  const nav = await index()
  expect(nav.getByRole('link', { name: 'Voltar' }).getAttribute('href')).toBe(
    `/companies/${COMPANY.id}`,
  )
  expect(nav.getByRole('searchbox', { name: 'Buscar nas configurações' })).toBeTruthy()
  expect(linksOf(groupOf(nav, 'Você'))).toEqual([
    'Minha conta',
    'Minhas contas de modelo',
    'Aparência',
  ])
  expect(linksOf(groupOf(nav, COMPANY.name))).toEqual([
    'Geral',
    'Pessoas e convites',
    'Contas de modelo',
  ])
  expect(sections(nav)).toHaveLength(6)
})

test('a busca acha pelo nome e pelas palavras, sem acento: "convite" leva a Pessoas e convites', async () => {
  open()
  const nav = await index()
  const search = nav.getByRole('searchbox', { name: 'Buscar nas configurações' })
  fireEvent.change(search, { target: { value: 'convite' } })
  expect(sections(nav)).toEqual(['Pessoas e convites'])
  fireEvent.change(search, { target: { value: 'APARENCIA' } })
  expect(sections(nav)).toEqual(['Aparência'])
  fireEvent.change(search, { target: { value: 'tema' } })
  expect(sections(nav)).toEqual(['Aparência'])
})

test('a busca sem resultado diz "Nenhuma seção encontrada." e volta com o campo vazio', async () => {
  open()
  const nav = await index()
  const search = nav.getByRole('searchbox', { name: 'Buscar nas configurações' })
  fireEvent.change(search, { target: { value: 'xyzxyz' } })
  expect(nav.getByText('Nenhuma seção encontrada.')).toBeTruthy()
  expect(sections(nav)).toHaveLength(0)
  fireEvent.change(search, { target: { value: '' } })
  expect(nav.queryByText('Nenhuma seção encontrada.')).toBeNull()
  expect(sections(nav)).toHaveLength(6)
})

test('uma filha de settings com staticData.section aparece na sua ordem, sem mudar o índice', async () => {
  const extra = createRoute({
    getParentRoute: () => SettingsRoute,
    path: 'extra',
    staticData: {
      section: { group: 'company', label: 'Cobrança', order: 15, keywords: ['fatura'] },
    },
    component: () => <p>Página de cobrança</p>,
  })
  SettingsRoute.addChildren([...children, extra])
  open()
  const nav = await index()
  expect(linksOf(groupOf(nav, COMPANY.name))).toEqual([
    'Geral',
    'Cobrança',
    'Pessoas e convites',
    'Contas de modelo',
  ])
  fireEvent.change(nav.getByRole('searchbox', { name: 'Buscar nas configurações' }), {
    target: { value: 'fatura' },
  })
  fireEvent.click(nav.getByRole('link', { name: 'Cobrança' }))
  expect(await screen.findByText('Página de cobrança')).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Cobrança', level: 1 })).toBeTruthy()
})

test('no celular, Configurações abre no índice como lista, e uma seção abre com o seu título', async () => {
  const phone = vi.spyOn(globalThis, 'matchMedia').mockImplementation((media: string) =>
    Object.assign(new EventTarget(), {
      matches: true,
      media,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }),
  )
  try {
    const router = open(`/companies/${COMPANY.id}/settings`)
    const main = within(await screen.findByRole('main'))
    expect(await main.findByRole('heading', { name: 'Configurações', level: 1 })).toBeTruthy()
    expect(router.state.location.pathname).toBe(`/companies/${COMPANY.id}/settings`)
    fireEvent.click(main.getByRole('link', { name: 'Aparência' }))
    expect(await main.findByRole('heading', { name: 'Aparência', level: 1 })).toBeTruthy()
  } finally {
    phone.mockRestore()
  }
})

test('numa tela larga, Configurações abre Minha conta', async () => {
  const router = open(`/companies/${COMPANY.id}/settings`)
  expect(await screen.findByRole('heading', { name: 'Minha conta', level: 1 })).toBeTruthy()
  expect(router.state.location.pathname).toBe(`/companies/${COMPANY.id}/settings/account`)
})

test('um endereço de Configurações que não existe: só o não encontrado na área, sem o índice repetido nem outro título', async () => {
  open(`/companies/${COMPANY.id}/settings/nao-existe`)
  const main = within(await screen.findByRole('main'))
  expect(
    await main.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
  expect(main.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  expect(main.queryByRole('searchbox', { name: 'Buscar nas configurações' })).toBeNull()
  expect(main.queryByRole('link', { name: 'Aparência' })).toBeNull()
})
