import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import type { ProjectsView } from '../../platform/test-hub.tsx'
import { hubServer, PEDIDOS, PEDIDOS_ADDRESS, projectsRead } from '../../platform/test-hub.tsx'
import { versionsRead } from '../../platform/test-hub-versions.tsx'
import { conversationOf, FIRST, PROJECT, screens, typed, view } from './test-hub.tsx'

const server = hubServer()
const { open } = screens(server)
const NO_PREVIEW = 'Ainda não há uma prévia disponível. Descreva o aplicativo para começar.'
const NOT_FOUND = 'Não encontramos o que você procurou.'

/** The Projeto Pedidos with one conversation; `seen` changes what the Hub says of the Projeto. */
function openProject(path = PROJECT, seen: Partial<ProjectsView> = {}) {
  const hub = open(
    view({ conversations: [conversationOf({ id: FIRST, title: 'Padarias' })] }),
    path,
  )
  server.use(
    versionsRead({ versions: [] }),
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: true, ...seen }),
  )
  return hub
}

/** Which of the two regions is the one shown on a phone. */
function regions() {
  return [...document.querySelectorAll('[data-slot="resizable-panel"]')].map((one) =>
    one.getAttribute('data-active'),
  )
}

function tab(name: string) {
  return within(screen.getByRole('tablist', { name: 'Projeto' })).getByRole('tab', { name })
}

test('o Projeto abre na Prévia vazia, com a conversa à direita e "Abrir app" no topo', async () => {
  openProject()
  expect(await screen.findByText(NO_PREVIEW)).toBeTruthy()
  expect(tab('Prévia').getAttribute('aria-selected')).toBe('true')
  expect(screen.getByRole('link', { name: 'Abrir app' }).getAttribute('href')).toBe(
    `https://${PEDIDOS_ADDRESS}/`,
  )
  expect(await screen.findByRole('textbox', { name: 'Mensagem para o Builder' })).toBeTruthy()
  expect(screen.getByRole('separator', { name: 'Redimensionar a conversa' })).toBeTruthy()
})

test('sem endereço, o topo não mostra "Abrir app"', async () => {
  openProject(PROJECT, { address: null })
  await screen.findByText(NO_PREVIEW)
  expect(screen.queryByRole('link', { name: 'Abrir app' })).toBeNull()
})

test('a aba Projeto e a seção ficam no endereço, e o Sobre vem primeiro', async () => {
  const { conexus } = openProject()
  fireEvent.click(await screen.findByRole('tab', { name: 'Projeto' }))
  expect(await screen.findByRole('heading', { name: 'Pedidos' })).toBeTruthy()
  expect(conexus.router.state.location.search).toMatchObject({ lens: 'project' })
  fireEvent.click(screen.getByRole('tab', { name: 'Versões' }))
  expect(await screen.findByRole('button', { name: 'Enviar versão' })).toBeTruthy()
  expect(conexus.router.state.location.search).toMatchObject({
    lens: 'project',
    section: 'versions',
  })
  fireEvent.click(tab('Prévia'))
  expect(await screen.findByText(NO_PREVIEW)).toBeTruthy()
})

test('abrir pelo endereço da seção mostra as Versões; um valor que não é nosso volta à Prévia', async () => {
  openProject(`${PROJECT}?lens=project&section=versions`)
  expect(await screen.findByRole('heading', { name: 'Versões' })).toBeTruthy()
})

test('um valor de aba que não existe cai na Prévia', async () => {
  openProject(`${PROJECT}?lens=codigo`)
  expect(await screen.findByText(NO_PREVIEW)).toBeTruthy()
})

test('o membro lê quem envia as versões, e não vê "Enviar versão"', async () => {
  openProject(`${PROJECT}?lens=project&section=versions`, { mayDelete: false, role: 'member' })
  expect(
    await screen.findByText('Só o dono ou quem administra a empresa vê e envia as versões.'),
  ).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Enviar versão' })).toBeNull()
})

test('o endereço /settings acabou: "não encontrado"', async () => {
  openProject(`${PROJECT}/settings`)
  expect(await screen.findByRole('heading', { name: NOT_FOUND })).toBeTruthy()
})

test('um Projeto que não existe: "não encontrado", sem painel', async () => {
  openProject(PROJECT.replace(PEDIDOS.id, 'q'.repeat(32)))
  expect(await screen.findByRole('heading', { name: NOT_FOUND })).toBeTruthy()
  expect(screen.queryByRole('combobox', { name: 'Conversas' })).toBeNull()
})

test('no celular, "App | Conversa" mostra uma região por vez, as duas montadas, sem perder o rascunho', async () => {
  openProject()
  const field = await screen.findByRole('textbox', { name: 'Mensagem para o Builder' })
  expect(regions()).toEqual(['true', 'false'])
  fireEvent.change(field, { target: { value: 'rascunho' } })
  fireEvent.click(screen.getByRole('button', { name: /^Conversa$/ }))
  expect(regions()).toEqual(['false', 'true'])
  expect(screen.getByText(NO_PREVIEW)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /^App$/ }))
  expect(regions()).toEqual(['true', 'false'])
  expect(typed(field)).toBe('rascunho')
})
