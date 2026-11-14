import { ConnectionList, ProjectSummary } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import type { BoundFunctions, queries } from '@testing-library/react'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { beforeEach, expect, test } from 'vitest'
import { Conexus, createConexus } from '../../../../main.tsx'
import { ANA, COMPANY } from '../../../../platform/fixtures.ts'
import { hubServer, projectsRead } from '../../../../platform/test-hub.tsx'

const server = hubServer()
const HOME = `/companies/${COMPANY.id}`

const PROJECTS = [1, 2, 3, 4, 5, 6, 7].map((number) =>
  ProjectSummary.parse({
    id: String(number).repeat(32),
    name: `Projeto ${number}`,
    createdAt: '2026-10-17T12:00:00.000Z',
    appVersion: null,
    publishedVersion: null,
  }),
)

beforeEach(() => globalThis.localStorage.clear())

function remembered(...numbers: number[]) {
  globalThis.localStorage.setItem(
    `conexus-remembered:${ANA.id}:projects.${COMPANY.id}`,
    numbers.map((number) => String(number).repeat(32)).join(' '),
  )
}

function open(path: string, projects = PROJECTS, role = 'member') {
  server.use(...projectsRead({ projects, databaseReady: true, mayDelete: false, role }))
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

function toggle() {
  return screen.getByRole('button', { name: /barra lateral/ })
}

function toggleLabel() {
  return toggle().getAttribute('aria-label')
}

/** The rail of places and the list beside it, once the list has what the role reads. */
async function sidebar() {
  const nav = await screen.findByRole('navigation', { name: 'Navegação' })
  const column = nav.querySelector<HTMLElement>('[data-slot="sidebar-rail-column"]')
  const list = nav.querySelector<HTMLElement>('[data-sidebar="sidebar"]')
  if (column === null || list === null) throw new Error('the sidebar has no rail or no list')
  const within_ = { rail: within(column), list: within(list) }
  await within_.list.findAllByRole('link', {
    name: /Nova conversa|Projeto 1|Construir|Todos os projetos/,
  })
  return within_
}

function linkNames(scope: BoundFunctions<typeof queries>) {
  return scope
    .getAllByRole('link')
    .map((link) => link.getAttribute('aria-label') ?? link.textContent)
}

test('o membro: o trilho tem Início, Projetos, Integrações, Conhecimento, Configurações e a conta; a lista é a da dona, Nova conversa e as conversas, sem Projetos recentes (critérios 3, 5 e 9)', async () => {
  open(HOME)
  const { rail, list } = await sidebar()
  expect(linkNames(rail)).toEqual([
    'Início',
    'Projetos',
    'Integrações',
    'Conhecimento',
    'Configurações',
  ])
  expect(rail.getByRole('button', { name: 'Conta de Ana Lima' })).toBeTruthy()
  expect(rail.getByRole('link', { name: 'Início' }).getAttribute('aria-current')).toBe('page')
  expect(rail.getByRole('link', { name: 'Configurações' }).getAttribute('href')).toBe(
    `${HOME}/settings`,
  )
  expect(list.getByText('Empresa Teste')).toBeTruthy()
  expect(list.getByRole('link', { name: 'Nova conversa' })).toBeTruthy()
  expect(list.queryByText('Projetos recentes')).toBeNull()
  expect(screen.getByRole('main')).toBeTruthy()
})

test('o desenvolvedor: o trilho tem Automações, Agentes e Cópias depois de Integrações, como a dona; o membro não os tem', async () => {
  open(HOME, PROJECTS, 'developer')
  const developer = await sidebar()
  expect(linkNames(developer.rail)).toEqual([
    'Início',
    'Projetos',
    'Integrações',
    'Automações',
    'Agentes',
    'Cópias',
    'Conhecimento',
    'Configurações',
  ])
  expect(developer.list.getByRole('link', { name: 'Nova conversa' })).toBeTruthy()
})

test('o trilho da dona tem Automações, Agentes e Cópias logo depois de Integrações; a lista é Nova conversa e Conversas; o membro não vê Automações, Agentes nem Cópias', async () => {
  open(HOME, PROJECTS, 'owner')
  const owner = await sidebar()
  expect(linkNames(owner.rail)).toEqual([
    'Início',
    'Projetos',
    'Integrações',
    'Automações',
    'Agentes',
    'Cópias',
    'Conhecimento',
    'Configurações',
  ])
  expect(owner.list.getByRole('link', { name: 'Nova conversa' })).toBeTruthy()
  expect(owner.list.queryByText('Projetos recentes')).toBeNull()
  cleanup()
  open(HOME)
  const member = await sidebar()
  expect(member.rail.queryByRole('link', { name: 'Automações' })).toBeNull()
  expect(member.rail.queryByRole('link', { name: 'Agentes' })).toBeNull()
  expect(member.rail.queryByRole('link', { name: 'Cópias' })).toBeNull()
})

/** The Projetos the Projeto's own header offers to switch to, in order, without "Todos os projetos". */
async function recents() {
  fireEvent.click(await screen.findByRole('button', { name: /Trocar de Projeto/ }))
  const menu = within(await screen.findByRole('menu'))
  return menu
    .getAllByRole('menuitem')
    .map((item) => item.textContent)
    .slice(0, -1)
}

test('os Projetos recentes do cabeçalho do Projeto: os abertos por último que seguem na lista, completados pelos primeiros, até cinco (critério 3)', async () => {
  remembered(7, 3, 6)
  open(`${HOME}/projects/${PROJECTS[0]?.id}`)
  expect(await recents()).toEqual(['Projeto 1', 'Projeto 7', 'Projeto 3', 'Projeto 6', 'Projeto 2'])
})

test('um Projeto lembrado que o Hub já não lista fica de fora (critério 3)', async () => {
  globalThis.localStorage.setItem(
    `conexus-remembered:${ANA.id}:projects.${COMPANY.id}`,
    `${'9'.repeat(32)} ${'4'.repeat(32)}`,
  )
  open(`${HOME}/projects/${PROJECTS[0]?.id}`)
  const shown = await recents()
  expect(shown).toHaveLength(5)
  expect(shown).toContain('Projeto 4')
  expect(shown).not.toContain('Projeto 9')
})

test('dentro de um Projeto o trilho fica e a lista é a do Projeto; Ctrl+B a recolhe e, ao sair, a da empresa volta (critérios 4 e 11)', async () => {
  const router = open(`${HOME}/projects/${PROJECTS[0]?.id}`)
  await screen.findAllByRole('heading', { name: 'Projeto 1' })
  const { rail, list } = await sidebar()
  expect(toggleLabel()).toBe('Recolher a barra lateral')
  expect(list.getByRole('link', { name: 'Construir' })).toBeTruthy()
  expect(rail.getByRole('link', { name: 'Projetos' }).getAttribute('aria-current')).toBe('page')

  fireEvent.keyDown(globalThis.window, { key: 'b', ctrlKey: true })
  await waitFor(() => expect(toggleLabel()).toBe('Abrir a barra lateral'))
  fireEvent.click(toggle())
  await waitFor(() => expect(toggleLabel()).toBe('Recolher a barra lateral'))

  fireEvent.click(rail.getByRole('link', { name: 'Início' }))
  await screen.findByRole('heading', { name: /^(Bom dia|Boa tarde|Boa noite)/ })
  expect(router.state.location.pathname).toBe(HOME)
  expect(list.queryByRole('link', { name: 'Construir' })).toBeNull()
})

test('Integrações no trilho: depois de Projetos, ativa na página, e Configurações não (critérios 5 e 19)', async () => {
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/connections`, () =>
      HttpResponse.json(
        ConnectionList.parse({
          connectors: [],
          connections: [],
          mayManage: false,
        }),
      ),
    ),
  )
  open(`${HOME}/integrations`)
  const { rail } = await sidebar()
  const names = linkNames(rail)
  expect(names.indexOf('Integrações')).toBe(names.indexOf('Projetos') + 1)
  expect(rail.getByRole('link', { name: 'Integrações' }).getAttribute('aria-current')).toBe('page')
  expect(rail.getByRole('link', { name: 'Configurações' }).getAttribute('aria-current')).toBeNull()
  expect(await screen.findByRole('heading', { name: 'Integrações' })).toBeTruthy()
})

test('fora do Projeto a barra começa aberta (critério 4)', async () => {
  open(HOME)
  await sidebar()
  expect(toggleLabel()).toBe('Recolher a barra lateral')
})
