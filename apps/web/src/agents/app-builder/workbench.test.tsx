import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { AGENT_START, RUNNING, stepStarted } from '../../harness/room/test-events.ts'
import {
  conversationOf,
  FIRST,
  PROJECT,
  SECOND,
  screens,
  typed,
  view,
} from '../../harness/room/test-hub.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import type { ProjectsView } from '../../platform/test-hub.tsx'
import { hubServer, PEDIDOS, projectsRead } from '../../platform/test-hub.tsx'
import { versionsRead } from '../../platform/test-hub-versions.tsx'

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

test('o Projeto abre na Prévia vazia, com a conversa à direita e sem "Abrir app" no topo', async () => {
  openProject()
  expect(await screen.findByText(NO_PREVIEW)).toBeTruthy()
  expect(tab('Prévia').getAttribute('aria-selected')).toBe('true')
  expect(screen.queryByRole('link', { name: 'Abrir app' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Recarregar' })).toBeNull()
  expect(await screen.findByRole('textbox', { name: 'Mensagem para o Conexus' })).toBeTruthy()
  expect(screen.getByRole('separator', { name: 'Redimensionar a conversa' })).toBeTruthy()
})

test('sem endereço, o topo não mostra "Abrir app"', async () => {
  openProject(PROJECT, { address: null })
  await screen.findByText(NO_PREVIEW)
  expect(screen.queryByRole('link', { name: 'Abrir app' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Recarregar' })).toBeNull()
})

test('fora da Prévia, o topo guarda só "Abrir app"', async () => {
  openProject(PROJECT, { appVersion: 1, publishedVersion: 1 })
  expect(await screen.findAllByRole('button', { name: 'Recarregar' })).not.toHaveLength(0)
  fireEvent.click(await screen.findByRole('tab', { name: 'Código' }))
  expect(await screen.findByRole('link', { name: 'Abrir app' })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Recarregar' })).toBeNull()
})

test('a aba fica no endereço, e a Prévia volta', async () => {
  const { conexus } = openProject()
  fireEvent.click(await screen.findByRole('tab', { name: 'Código' }))
  await waitFor(() => expect(conexus.router.state.location.search).toMatchObject({ lens: 'code' }))
  fireEvent.click(tab('Prévia'))
  expect(await screen.findByText(NO_PREVIEW)).toBeTruthy()
})

test('trocar a aba mantém a conversa aberta', async () => {
  const hub = open(
    view({
      conversations: [
        conversationOf({ id: FIRST, title: 'Padarias' }),
        conversationOf({ id: SECOND, title: 'Entregas' }),
      ],
    }),
    `${PROJECT}/conversations/${SECOND}`,
  )
  server.use(
    versionsRead({ versions: [] }),
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: true }),
  )
  const { router } = hub.conexus
  const here = `${PROJECT}/conversations/${SECOND}`
  fireEvent.click(await screen.findByRole('tab', { name: 'Código' }))
  await waitFor(() => expect(router.state.location.search).toMatchObject({ lens: 'code' }))
  expect(router.state.location.pathname).toBe(here)
  fireEvent.click(tab('Prévia'))
  await waitFor(() => expect(router.state.location.search).toMatchObject({ lens: 'preview' }))
  expect(router.state.location.pathname).toBe(here)
})

test('abrir pelo endereço de Versões mostra as Versões', async () => {
  openProject(`${PROJECT}/about?part=versions`)
  expect(await screen.findByRole('heading', { name: 'Versões' })).toBeTruthy()
})

test('um valor de aba que não existe cai na Prévia', async () => {
  openProject(`${PROJECT}?lens=codigo`)
  expect(await screen.findByText(NO_PREVIEW)).toBeTruthy()
})

test('o membro também vê as Versões (E1)', async () => {
  openProject(`${PROJECT}/about?part=versions`, { mayDelete: false, role: 'member' })
  expect(await screen.findByRole('heading', { name: 'Versões' })).toBeTruthy()
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
  const field = await screen.findByRole('textbox', { name: 'Mensagem para o Conexus' })
  expect(regions()).toEqual(['true', 'false'])
  fireEvent.change(field, { target: { value: 'rascunho' } })
  fireEvent.click(screen.getByRole('button', { name: /^Conversa$/ }))
  expect(regions()).toEqual(['false', 'true'])
  expect(screen.getByText(NO_PREVIEW)).toBeTruthy()
  fireEvent.click(screen.getByRole('button', { name: /^App$/ }))
  expect(regions()).toEqual(['true', 'false'])
  expect(typed(field)).toBe('rascunho')
})

test('a versão que a resposta salva faz o Código ser lido de novo', async () => {
  let reads = 0
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/source`, () => {
      reads += 1
      return HttpResponse.json({ version: 0, commit: null, savedAt: null, files: [] })
    }),
  )
  const hub = openProject(`${PROJECT}/conversations/${FIRST}?lens=code`)
  await waitFor(() => expect(hub.lines.length).toBe(1))
  await waitFor(() => expect(reads).toBeGreaterThan(0))
  const before = reads
  const line = hub.line()
  line.emit(AGENT_START)
  line.emit(RUNNING)
  line.emit(stepStarted('m-version', [{ type: 'data-conexus-version', data: { number: 1 } }]))
  await waitFor(() => expect(reads).toBeGreaterThan(before))
})
