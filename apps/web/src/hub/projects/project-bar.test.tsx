import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { conversationsNone, hubServer, PEDIDOS, projectsRead } from '../../platform/test-hub.tsx'
import { versionsRead } from '../../platform/test-hub-versions.tsx'

const server = hubServer()
const HOUSE = `/companies/${COMPANY.id}`
const PROJECT = `${HOUSE}/projects/${PEDIDOS.id}`

beforeEach(() => server.use(conversationsNone, versionsRead({ versions: [] })))

function open(path: string, seen: { mayDelete?: boolean } = {}) {
  server.use(
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: true, ...seen }),
  )
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return conexus
}

async function bar() {
  return within(await screen.findByRole('navigation', { name: 'Navegação' }))
}

test('dentro do Projeto a barra é a do Projeto: o nome com a troca, a empresa, Construir, Sobre, Quem usa o app', async () => {
  open(PROJECT)
  const rail = await bar()
  expect(
    await rail.findByRole('button', { name: 'Trocar de Projeto. Agora: Pedidos' }),
  ).toBeTruthy()
  const entries = rail.getAllByRole('link').map((link) => link.textContent)
  expect(entries).toEqual([
    COMPANY.name,
    'Construir',
    'Sobre',
    'Quem usa o app',
    expect.any(String),
  ])
  expect(screen.queryByText(/em breve/i)).toBeNull()
  expect(rail.queryByText('Projetos recentes')).toBeNull()
  expect(rail.getByRole('link', { name: 'Construir' }).getAttribute('aria-current')).toBe('page')
})

test('um endereço de conversa marca Construir como o lugar atual', async () => {
  open(`${PROJECT}/conversations/${'c'.repeat(32)}`)
  expect((await bar()).getByRole('link', { name: 'Construir' }).getAttribute('aria-current')).toBe(
    'page',
  )
})

test('fora do Projeto, a barra da empresa como hoje', async () => {
  open(HOUSE)
  expect(await (await bar()).findByText('Projetos recentes')).toBeTruthy()
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
  fireEvent.click((await bar()).getByRole('link', { name: COMPANY.name }))
  await waitFor(() => expect(router.state.location.pathname).toBe(HOUSE))
  expect(await (await bar()).findByText('Projetos recentes')).toBeTruthy()
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
