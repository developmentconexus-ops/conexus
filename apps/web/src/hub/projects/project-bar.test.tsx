import { createMemoryHistory } from '@tanstack/react-router'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { conversationsNone, hubServer, PEDIDOS, projectsRead } from '../../platform/test-hub.tsx'
import { versionsRead } from '../../platform/test-hub-versions.tsx'

const server = hubServer()
const HOUSE = `/companies/${COMPANY.id}`
const PROJECT = `${HOUSE}/projects/${PEDIDOS.id}`

beforeEach(() => server.use(conversationsNone, versionsRead({ versions: [] })))

function open(path: string, seen: { mayDelete?: boolean; role?: string } = {}) {
  server.use(
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: true, ...seen }),
  )
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus
}

async function sidebar() {
  return await screen.findByRole('navigation', { name: 'Navegação' })
}

/** The Projeto's or the company's list, beside the rail. */
async function bar() {
  const list = (await sidebar()).querySelector<HTMLElement>('[data-sidebar="sidebar"]')
  if (list === null) throw new Error('the sidebar has no list')
  return within(list)
}

/** The rail of places. */
async function rail() {
  const column = (await sidebar()).querySelector<HTMLElement>('[data-slot="sidebar-rail-column"]')
  if (column === null) throw new Error('the sidebar has no rail')
  return within(column)
}

test('dentro do Projeto o trilho continua e a lista é a do Projeto: o nome com a troca, Construir, Conversas, Agentes, Automações, Sobre, Quem usa o app, Integrações, Dados', async () => {
  open(PROJECT)
  const list = await bar()
  expect(
    await list.findByRole('button', { name: 'Trocar de Projeto. Agora: Pedidos' }),
  ).toBeTruthy()
  const entries = list.getAllByRole('link').map((link) => link.textContent)
  expect(entries).toEqual([
    'Construir',
    'Conversas',
    'Agentes',
    'Automações',
    'Sobre',
    'Quem usa o app',
    'Integrações',
    'Dados',
  ])
  expect(screen.queryByText(/em breve/i)).toBeNull()
  expect(list.queryByText('Projetos recentes')).toBeNull()
  expect(list.getByRole('link', { name: 'Construir' }).getAttribute('aria-current')).toBe('page')
  const places = await rail()
  expect(places.getByRole('link', { name: 'Projetos' }).getAttribute('aria-current')).toBe('page')
  expect(places.getByRole('link', { name: 'Início' })).toBeTruthy()
})

test('o membro não vê Agentes, Automações nem Dados na barra do Projeto (steps 24.2 e 24.3, capacidade 1)', async () => {
  open(PROJECT, { role: 'member' })
  const list = await bar()
  await list.findByRole('button', { name: 'Trocar de Projeto. Agora: Pedidos' })
  expect(list.queryByRole('link', { name: 'Agentes' })).toBeNull()
  expect(list.queryByRole('link', { name: 'Automações' })).toBeNull()
  expect(list.queryByRole('link', { name: 'Dados' })).toBeNull()
  expect(list.getByRole('link', { name: 'Integrações' })).toBeTruthy()
})

test('um endereço de conversa marca Construir como o lugar atual', async () => {
  open(`${PROJECT}/conversations/${'c'.repeat(32)}`)
  expect((await bar()).getByRole('link', { name: 'Construir' }).getAttribute('aria-current')).toBe(
    'page',
  )
})

test('as outras páginas do Projeto não marcam Construir como o lugar atual', async () => {
  for (const page of ['about', 'access']) {
    cleanup()
    open(`${PROJECT}/${page}`)
    const construir = (await bar()).getByRole('link', { name: 'Construir' })
    expect(construir.getAttribute('aria-current')).toBeNull()
  }
})

test('fora do Projeto, a lista é a da empresa: Nova conversa, e sem as entradas do Projeto', async () => {
  open(HOUSE)
  expect(await (await bar()).findByRole('link', { name: 'Nova conversa' })).toBeTruthy()
  expect((await bar()).queryByRole('link', { name: 'Sobre' })).toBeNull()
})

test('as entradas levam aos endereços próprios e marcam onde a pessoa está', async () => {
  const { router } = open(PROJECT)
  fireEvent.click(await (await bar()).findByRole('link', { name: 'Sobre' }))
  await waitFor(() => expect(router.state.location.pathname).toBe(`${PROJECT}/about`))
  expect(
    (await bar()).getByRole('link', { name: 'Construir' }).getAttribute('aria-current'),
  ).toBeNull()
  expect(await screen.findByRole('tab', { name: 'Versões' })).toBeTruthy()
  fireEvent.click((await bar()).getByRole('link', { name: 'Quem usa o app' }))
  await waitFor(() => expect(router.state.location.pathname).toBe(`${PROJECT}/access`))
  fireEvent.click((await rail()).getByRole('link', { name: 'Início' }))
  await waitFor(() => expect(router.state.location.pathname).toBe(HOUSE))
  expect(await (await bar()).findByRole('link', { name: 'Nova conversa' })).toBeTruthy()
})

test('o Sobre tem as duas partes e a parte fica no endereço', async () => {
  const { router } = open(`${PROJECT}/about`)
  fireEvent.click(await screen.findByRole('tab', { name: 'Versões' }))
  expect(await screen.findByRole('heading', { name: 'Versões' })).toBeTruthy()
  expect(router.state.location.search).toEqual({ part: 'versions' })
})

test('o endereço antigo: cada ?lens=project leva à página nova, trocando a história', async () => {
  for (const [old, now] of [
    ['?lens=project&section=access', `${PROJECT}/access`],
    ['?lens=project&section=versions', `${PROJECT}/about?part=versions`],
    ['?lens=project', `${PROJECT}/about`],
    ['?lens=project&section=about', `${PROJECT}/about`],
  ] as const) {
    const { router } = open(`${PROJECT}${old}`)
    await waitFor(() => expect(router.state.location.href).toBe(now))
    expect(router.history.length).toBe(1)
    document.body.innerHTML = ''
  }
})

test('um lens que não é nosso abre a Prévia', async () => {
  const { router } = open(`${PROJECT}?lens=codigo`)
  expect(await screen.findByRole('tab', { name: 'Prévia' })).toBeTruthy()
  expect(router.state.location.pathname).toBe(PROJECT)
})

test('um Projeto que o Hub não acha, nos endereços novos: não encontrado', async () => {
  server.use(...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: true }))
  const other = `${HOUSE}/projects/${'z'.repeat(32)}`
  for (const page of ['about', 'access']) {
    render(
      <Conexus
        conexus={createConexus(createMemoryHistory({ initialEntries: [`${other}/${page}`] }))}
      />,
    )
    expect(
      await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
    ).toBeTruthy()
    document.body.innerHTML = ''
  }
})
