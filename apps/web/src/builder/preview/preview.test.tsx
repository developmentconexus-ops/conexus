import { CompanyId } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, expect, test, vi } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { sentenceOfCode } from '../../platform/hub.ts'
import type { ProjectsView } from '../../platform/test-hub.tsx'
import {
  conversationsNone,
  hubServer,
  PEDIDOS,
  PEDIDOS_ADDRESS,
  projectsRead,
  refusal,
} from '../../platform/test-hub.tsx'
import { previewChanged } from './public.ts'

const server = hubServer()
const PROJECT = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}`
const APP = `https://${PEDIDOS_ADDRESS}`
const NO_PREVIEW = 'Ainda não há uma prévia disponível. Descreva o aplicativo para começar.'
const WEBKIT = 'O app pode não abrir aqui dentro neste navegador.'
const LOCATION = `${APP}/?pass=abc`
const APPLE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X) AppleWebKit/605.1.15 Version/26.6 Mobile/15E148 Safari/604.1'
const ENTRY = { type: 'conexus-entry', host: 'pedidos--empresa-teste', binding: 'b'.repeat(43) }

afterEach(() => {
  vi.restoreAllMocks()
  sessionStorage.clear()
})

/** Pedidos with the app at `appVersion`; `seen` changes what the Hub says, and `reads` counts its answers. */
function openProject(seen: Partial<ProjectsView> = {}) {
  const view = { projects: [PEDIDOS], databaseReady: true, mayDelete: true, ...seen }
  const reads = { project: 0 }
  server.use(
    conversationsNone,
    http.get(`*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}`, () => {
      reads.project += 1
    }),
    ...projectsRead(view),
  )
  const conexus = createConexus(createMemoryHistory({ initialEntries: [PROJECT] }))
  render(<Conexus conexus={conexus} />)
  return { view, reads, conexus }
}

function handoffs(location = LOCATION) {
  const bodies: unknown[] = []
  server.use(
    http.post('*/api/apps/frame-handoff', async ({ request }) => {
      bodies.push(await request.json())
      return HttpResponse.json({ location })
    }),
  )
  return bodies
}

function iframe() {
  const frame = screen.getByTitle('Prévia')
  if (!(frame instanceof HTMLIFrameElement)) throw new Error('the Prévia is not an iframe')
  return frame
}

function sent(from: Window | null, origin: string, data: unknown = ENTRY) {
  fireEvent(window, new MessageEvent('message', { origin, source: from, data }))
}

test('vazio: antes do primeiro app, a Prévia diz que não há prévia', async () => {
  openProject()
  expect(await screen.findByText(NO_PREVIEW)).toBeTruthy()
  expect(screen.queryByTitle('Prévia')).toBeNull()
  expect(screen.queryByRole('button', { name: 'Recarregar' })).toBeNull()
})

test('barra: o app num iframe do endereço do Projeto, com Computador, Celular e Recarregar', async () => {
  openProject({ appVersion: 1 })
  const frame = await screen.findByTitle('Prévia')
  expect(frame.getAttribute('src')).toBe(`${APP}/`)
  const sandbox = frame.getAttribute('sandbox') ?? ''
  expect(sandbox).toContain('allow-scripts')
  expect(sandbox).not.toContain('allow-top-navigation')
  const computer = screen.getByRole('button', { name: 'Computador' })
  expect(computer.getAttribute('aria-pressed')).toBe('true')
  expect(frame.className).not.toContain('390px')
  fireEvent.click(screen.getByRole('button', { name: 'Celular' }))
  expect(iframe().className).toContain('w-[390px]')
  expect(screen.getByRole('button', { name: 'Recarregar' })).toBeTruthy()
  expect(screen.queryByText(NO_PREVIEW)).toBeNull()
})

test('Recarregar: o iframe recarrega e o Projeto não é lido de novo', async () => {
  const { reads } = openProject({ appVersion: 1 })
  const before = await screen.findByTitle('Prévia')
  const readsBefore = reads.project
  fireEvent.click(screen.getByRole('button', { name: 'Recarregar' }))
  await waitFor(() => expect(iframe()).not.toBe(before))
  expect(reads.project).toBe(readsBefore)
})

test('recarga: a versão nova do app recarrega o iframe', async () => {
  const { view, conexus } = openProject({ appVersion: 1 })
  const before = await screen.findByTitle('Prévia')
  view.appVersion = 2
  await previewChanged(conexus.queryClient, {
    companyId: CompanyId.parse(COMPANY.id),
    projectId: PEDIDOS.id,
  })
  await waitFor(() => expect(iframe()).not.toBe(before))
})

test('entrada: a mensagem do iframe leva à passagem, e o iframe vai ao location', async () => {
  openProject({ appVersion: 1 })
  const bodies = handoffs()
  await screen.findByTitle('Prévia')
  sent(iframe().contentWindow, APP)
  await waitFor(() => expect(iframe().getAttribute('src')).toBe(LOCATION))
  expect(bodies).toEqual([{ host: ENTRY.host, binding: ENTRY.binding }])
})

test('entrada: uma mensagem de outra origem, de outra janela ou que não é a entrada é ignorada', async () => {
  openProject({ appVersion: 1 })
  const bodies = handoffs()
  await screen.findByTitle('Prévia')
  sent(iframe().contentWindow, 'https://outro.example.test')
  sent(window, APP)
  sent(iframe().contentWindow, APP, { type: 'outra', host: ENTRY.host })
  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(bodies).toEqual([])
  expect(iframe().getAttribute('src')).toBe(`${APP}/`)
})

test('aviso: no WebKit da Apple, acima do iframe, com Abrir app numa aba nova', async () => {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
    'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X) AppleWebKit/605.1.15 Version/26.6 Mobile/15E148 Safari/604.1',
  )
  openProject({ appVersion: 1 })
  const notice = (await screen.findByText(WEBKIT)).closest('[role="status"]')
  if (!(notice instanceof HTMLElement)) throw new Error('the notice has no status region')
  const link = within(notice).getByRole('link', { name: 'Abrir app' })
  expect(link.getAttribute('href')).toBe(`${APP}/`)
  expect(link.getAttribute('target')).toBe('_blank')
  expect(link.getAttribute('rel')).toBe('noopener noreferrer')
  expect(notice.compareDocumentPosition(iframe()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(iframe().getAttribute('src')).toBe(`${APP}/`)
})

test('aviso: Fechar aviso o esconde, e a aba lembra', async () => {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(APPLE)
  openProject({ appVersion: 1 })
  await screen.findByText(WEBKIT)
  fireEvent.click(screen.getByRole('button', { name: 'Fechar aviso' }))
  expect(screen.queryByText(WEBKIT)).toBeNull()
  cleanup()
  openProject({ appVersion: 1 })
  await screen.findByTitle('Prévia')
  expect(screen.queryByText(WEBKIT)).toBeNull()
})

test('entrada recusada: a frase da falha no lugar do iframe, e Recarregar tenta de novo', async () => {
  openProject({ appVersion: 1 })
  server.use(http.post('*/api/apps/frame-handoff', () => refusal('DATABASE_UNAVAILABLE')))
  await screen.findByTitle('Prévia')
  sent(iframe().contentWindow, APP)
  const alert = await screen.findByRole('alert')
  expect(alert.textContent).toBe(sentenceOfCode('DATABASE_UNAVAILABLE'))
  expect(screen.queryByTitle('Prévia')).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Recarregar' }))
  expect((await screen.findByTitle('Prévia')).getAttribute('src')).toBe(`${APP}/`)
})

test('aviso: fora do WebKit da Apple, nada', async () => {
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36',
  )
  openProject({ appVersion: 1 })
  await screen.findByTitle('Prévia')
  expect(screen.queryByText(WEBKIT)).toBeNull()
})
