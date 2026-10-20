import { createMemoryHistory, createRoute } from '@tanstack/react-router'
import type { BoundFunctions, queries } from '@testing-library/react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, expect, test } from 'vitest'
import { Conexus, createConexus } from '../../../../../main.tsx'
import { ANA, COMPANY } from '../../../../../platform/fixtures.ts'
import { companyRead, hubServer, sessionRead } from '../../../../../platform/test-hub.tsx'
import { Route as SettingsRoute } from './route.tsx'

const server = hubServer()
const APPEARANCE = `/companies/${COMPANY.id}/settings/appearance`
const children: unknown = SettingsRoute.children

afterEach(() => {
  SettingsRoute.children = children
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
      place: 'Cobrança',
      section: { group: 'company', label: 'Cobrança', order: 15, keywords: ['fatura'] },
    },
    component: () => <h1>Página de cobrança</h1>,
  })
  Object.assign(SettingsRoute, { children: [...(Array.isArray(children) ? children : []), extra] })
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
  expect(await screen.findByRole('heading', { name: 'Página de cobrança' })).toBeTruthy()
})
