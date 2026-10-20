import { CompanyId, ProjectSummary } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import type { BoundFunctions, queries } from '@testing-library/react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
  }),
)

beforeEach(() => globalThis.localStorage.clear())

function remembered(...numbers: number[]) {
  globalThis.localStorage.setItem(
    `conexus-remembered:${ANA.id}:projects.${COMPANY.id}`,
    numbers.map((number) => String(number).repeat(32)).join(' '),
  )
}

function open(path: string, projects = PROJECTS) {
  server.use(...projectsRead({ projects, databaseReady: true, mayDelete: false, role: 'member' }))
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus.router
}

function rail() {
  return screen.getByRole('button', { name: /barra lateral/ })
}

function railLabel() {
  return rail().getAttribute('aria-label')
}

async function sidebar() {
  const nav = within(await screen.findByRole('navigation', { name: 'Navegação' }))
  await nav.findByRole('link', { name: 'Todos os projetos' })
  return nav
}

function linkNames(nav: BoundFunctions<typeof queries>) {
  return nav.getAllByRole('link').map((link) => link.textContent)
}

test('a barra: empresa, Início, Projetos recentes, Todos os projetos, Configurações e a conta (critério 3)', async () => {
  open(HOME)
  const nav = await sidebar()
  expect(nav.getByText('Empresa Teste')).toBeTruthy()
  expect(nav.getByText('Projetos recentes')).toBeTruthy()
  expect(linkNames(nav)).toEqual([
    'Início',
    'Projeto 1',
    'Projeto 2',
    'Projeto 3',
    'Projeto 4',
    'Projeto 5',
    'Todos os projetos',
    'Configurações',
  ])
  expect(nav.getByRole('button', { name: 'Conta de Ana Lima' })).toBeTruthy()
  expect(nav.getByRole('link', { name: 'Início' }).getAttribute('aria-current')).toBe('page')
  expect(nav.getByRole('link', { name: 'Configurações' }).getAttribute('href')).toBe(
    `${HOME}/settings`,
  )
  expect(screen.getByRole('main')).toBeTruthy()
})

test('os Projetos recentes: os abertos por último que seguem na lista, completados pelos primeiros, até cinco (critério 3)', async () => {
  remembered(7, 3, 6)
  open(HOME)
  const nav = await sidebar()
  expect(linkNames(nav).slice(1, -2)).toEqual([
    'Projeto 7',
    'Projeto 3',
    'Projeto 6',
    'Projeto 1',
    'Projeto 2',
  ])
})

test('um Projeto lembrado que o Hub já não lista fica de fora (critério 3)', async () => {
  globalThis.localStorage.setItem(
    `conexus-remembered:${ANA.id}:projects.${COMPANY.id}`,
    `${'9'.repeat(32)} ${'4'.repeat(32)}`,
  )
  open(HOME)
  const nav = await sidebar()
  expect(linkNames(nav).slice(1, -2)).toEqual([
    'Projeto 4',
    'Projeto 1',
    'Projeto 2',
    'Projeto 3',
    'Projeto 5',
  ])
})

test('com um só Projeto, a barra lista só ele (critério 3)', async () => {
  open(HOME, PROJECTS.slice(0, 1))
  const nav = await sidebar()
  expect(linkNames(nav)).toEqual(['Início', 'Projeto 1', 'Todos os projetos', 'Configurações'])
})

test('abrir um Projeto o põe primeiro nos recentes (critério 3)', async () => {
  const router = open(`${HOME}/projects/${PROJECTS[5]?.id}`)
  await screen.findByRole('heading', { name: 'Projeto 6' })
  await router.navigate({
    to: '/companies/$companyId',
    params: { companyId: CompanyId.parse(COMPANY.id) },
  })
  const nav = await sidebar()
  expect(linkNames(nav)[1]).toBe('Projeto 6')
})

test('dentro de um Projeto a barra vira ícones, Ctrl+B a abre e, ao sair, volta aberta (critério 4)', async () => {
  const router = open(`${HOME}/projects/${PROJECTS[0]?.id}`)
  await screen.findByRole('heading', { name: 'Projeto 1' })
  const nav = await sidebar()
  expect(railLabel()).toBe('Abrir a barra lateral')
  expect(nav.getByRole('link', { name: 'Início' })).toBeTruthy()
  expect(nav.getByRole('link', { name: 'Configurações' })).toBeTruthy()

  fireEvent.keyDown(globalThis.window, { key: 'b', ctrlKey: true })
  await waitFor(() => expect(railLabel()).toBe('Recolher a barra lateral'))

  fireEvent.keyDown(globalThis.window, { key: 'b', ctrlKey: true })
  await waitFor(() => expect(railLabel()).toBe('Abrir a barra lateral'))

  fireEvent.click(rail())
  await waitFor(() => expect(railLabel()).toBe('Recolher a barra lateral'))
  fireEvent.click(rail())
  await waitFor(() => expect(railLabel()).toBe('Abrir a barra lateral'))

  fireEvent.click(nav.getByRole('link', { name: 'Início' }))
  await screen.findByRole('heading', { name: 'O que vamos construir?' })
  expect(router.state.location.pathname).toBe(HOME)
  expect(railLabel()).toBe('Recolher a barra lateral')
})

test('fora do Projeto a barra começa aberta (critério 4)', async () => {
  open(HOME)
  await sidebar()
  expect(railLabel()).toBe('Recolher a barra lateral')
})
