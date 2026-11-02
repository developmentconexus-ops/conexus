import type { NotificationRow } from '@conexus/hub-api'
import { AutomationId, ConversationId, listNotifications, NotificationId } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { beforeEach, expect, test, vi } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import {
  conversationsNone,
  hubServer,
  PEDIDOS,
  projectsRead,
  refusal,
} from '../../platform/test-hub.tsx'

// O sino: o número de não lidas, o painel e o que tocar faz (step 24.2, criterion 21).
const server = hubServer()
const FRAME = `/companies/${COMPANY.id}/projects`
const ROW = listNotifications.success.body.shape.notifications.element
const AUTOMATION = AutomationId.parse(
  'schedule_conexus-automation-11111111-1111-4111-8111-111111111111',
)
const CONVERSATION = ConversationId.parse('66666666-6666-4666-8666-666666666666')

function notification(n: number, fields: Record<string, unknown> = {}): NotificationRow {
  return ROW.parse({
    kind: 'AUTOMATION_DONE',
    id: NotificationId.parse(`00000000-0000-4000-8000-${String(n).padStart(12, '0')}`),
    createdAt: '2026-11-01T10:00:00.000Z',
    read: false,
    automation: { id: AUTOMATION, name: 'Resumo de vendas' },
    projectId: null,
    conversationId: CONVERSATION,
    ...fields,
  })
}

type Sent = { body: unknown }

/** The Hub's notifications: a list that changes as they are marked, and every marking. */
function bell(rows: NotificationRow[], options: { failRead?: boolean } = {}) {
  const sent: Sent[] = []
  let reads = 0
  server.use(
    ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: false }),
    http.get('*/api/companies/:companyId/notifications', () => {
      reads += 1
      if (options.failRead) return refusal('DATABASE_UNAVAILABLE')
      return HttpResponse.json({
        notifications: rows,
        unread: rows.filter((one) => !one.read).length,
        next: { kind: 'END' },
      })
    }),
    http.post('*/api/companies/:companyId/notifications/read', async ({ request }) => {
      const body: unknown = await request.json()
      sent.push({ body })
      const ids = Object(body).all === true ? undefined : new Set<string>(Object(body).ids)
      for (const [at, one] of rows.entries()) {
        if (ids === undefined || ids.has(one.id)) rows[at] = { ...one, read: true }
      }
      return new HttpResponse(null, { status: 204 })
    }),
  )
  const conexus = createConexus(createMemoryHistory({ initialEntries: [FRAME] }))
  render(<Conexus conexus={conexus} />)
  return { conexus, sent, reads: () => reads }
}

beforeEach(() => server.use(conversationsNone))

test('sem aviso, o sino não tem número e o painel diz que não há notificação', async () => {
  bell([])
  const trigger = await screen.findByRole('button', { name: 'Notificações' })
  fireEvent.click(trigger)
  expect(await screen.findByText('Nenhuma notificação.')).toBeTruthy()
})

test('o sino mostra o número de não lidas; o painel lista, e tocar numa abre a conversa e a marca lida', async () => {
  const rows = [
    notification(1),
    notification(2, { kind: 'AUTOMATION_FAILED', code: 'MODEL_NO_ACCOUNT', conversationId: null }),
    notification(3, { read: true }),
  ]
  const { conexus, sent } = bell(rows)
  fireEvent.click(await screen.findByRole('button', { name: 'Notificações: 2 não lidas' }))
  const panel = await screen.findByRole('dialog')
  expect(within(panel).getByText(/Resumo de vendas falhou: /)).toBeTruthy()
  expect(within(panel).getAllByText(/Resumo de vendas está pronta/)).toHaveLength(2)
  const [first] = within(panel).getAllByRole('link', {
    name: /Resumo de vendas está pronta/,
  })
  if (first === undefined) throw new Error('the unread notification has no link')
  fireEvent.click(first)
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toBe(
      `/companies/${COMPANY.id}/conversations/${CONVERSATION}`,
    ),
  )
  await waitFor(() => expect(sent).toEqual([{ body: { ids: [rows[0]?.id] } }]))
  expect(await screen.findByRole('button', { name: 'Notificações: 1 não lida' })).toBeTruthy()
})

test('Marcar todas como lidas zera o número', async () => {
  const { sent } = bell([notification(1), notification(2)])
  fireEvent.click(await screen.findByRole('button', { name: 'Notificações: 2 não lidas' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Marcar todas como lidas' }))
  expect(await screen.findByRole('button', { name: 'Notificações' })).toBeTruthy()
  expect(sent).toEqual([{ body: { all: true } }])
})

test('a pausa abre o Início, e a falha sem conversa abre a página da automação', async () => {
  const { conexus } = bell([
    notification(1, { kind: 'AUTOMATION_PAUSED', conversationId: undefined }),
    notification(2, { kind: 'AUTOMATION_FAILED', code: 'INTERRUPTED', conversationId: null }),
  ])
  fireEvent.click(await screen.findByRole('button', { name: 'Notificações: 2 não lidas' }))
  const links = await screen.findAllByRole('link', { name: /Resumo de vendas/ })
  expect(links.map((one) => one.getAttribute('href'))).toEqual([
    `/companies/${COMPANY.id}`,
    `/companies/${COMPANY.id}/automations/${AUTOMATION}`,
  ])
  expect(conexus.router.state.location.pathname).toBe(FRAME)
})

test('a leitura que falha mostra a frase do código e Tentar de novo no painel', async () => {
  bell([], { failRead: true })
  fireEvent.click(await screen.findByRole('button', { name: 'Notificações' }))
  expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
})

async function onPhone(run: () => Promise<void>) {
  const phone = vi.spyOn(globalThis, 'matchMedia').mockImplementation((media: string) =>
    Object.assign(new EventTarget(), {
      matches: media.includes('767'),
      media,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }),
  )
  try {
    await run()
  } finally {
    phone.mockRestore()
  }
}

function later(ms: number) {
  return new Promise((done) => setTimeout(done, ms))
}

test('o número é lido de novo a cada 60 segundos com a janela visível, e abrir o painel lê outra vez', async () => {
  // Testing Library's `waitFor` polls with `setInterval`, so this test waits with `setTimeout` instead.
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  try {
    const { reads } = bell([notification(1)])
    await later(300)
    const before = reads()
    expect(screen.getByRole('button', { name: 'Notificações: 1 não lida' })).toBeTruthy()
    await vi.advanceTimersByTimeAsync(60_000)
    await later(300)
    expect(reads()).toBeGreaterThan(before)
    const afterTick = reads()
    fireEvent.click(screen.getByRole('button', { name: 'Notificações: 1 não lida' }))
    await later(300)
    expect(reads()).toBeGreaterThan(afterTick)
  } finally {
    vi.useRealTimers()
  }
})

test('o número de não lidas aparece no sino, à vista, e some quando tudo foi lido', async () => {
  bell([notification(1), notification(2), notification(3, { read: true })])
  const trigger = await screen.findByRole('button', { name: 'Notificações: 2 não lidas' })
  expect(within(trigger).getByText('2')).toBeTruthy()
  fireEvent.click(trigger)
  fireEvent.click(await screen.findByRole('button', { name: 'Marcar todas como lidas' }))
  const quiet = await screen.findByRole('button', { name: 'Notificações' })
  expect(within(quiet).queryByText('2')).toBeNull()
})

test('sem não lidas o painel não oferece Marcar todas como lidas', async () => {
  bell([notification(1, { read: true })])
  fireEvent.click(await screen.findByRole('button', { name: 'Notificações' }))
  expect(await screen.findByRole('link', { name: /Resumo de vendas está pronta/ })).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Marcar todas como lidas' })).toBeNull()
})

test('no computador o sino fica na barra lateral, e no celular na linha do topo', async () => {
  bell([notification(1)])
  const desktop = await screen.findByRole('button', { name: 'Notificações: 1 não lida' })
  expect(desktop.closest('header')).toBeNull()
  cleanup()
  await onPhone(async () => {
    bell([notification(1)])
    const phone = await screen.findByRole('button', { name: 'Notificações: 1 não lida' })
    expect(screen.getAllByRole('button', { name: /^Notificações/ })).toHaveLength(1)
    expect(phone.closest('header')).not.toBeNull()
  })
})

test('uma notificação de uma conversa que o Hub não tem mais abre "Esta conversa não existe mais."', async () => {
  server.use(
    http.get('*/api/companies/:companyId/assistant/conversations/:conversationId', () =>
      refusal('CONVERSATION_NOT_FOUND'),
    ),
  )
  bell([notification(1)])
  fireEvent.click(await screen.findByRole('button', { name: 'Notificações: 1 não lida' }))
  fireEvent.click(await screen.findByRole('link', { name: /Resumo de vendas está pronta/ }))
  expect(await screen.findByText('Esta conversa não existe mais.')).toBeTruthy()
})

test('com a janela escondida o número não é lido de novo', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  const visibility = vi.spyOn(document, 'visibilityState', 'get')
  try {
    visibility.mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    const { reads } = bell([notification(1)])
    await later(300)
    const before = reads()
    await vi.advanceTimersByTimeAsync(120_000)
    await later(300)
    expect(reads()).toBe(before)
  } finally {
    visibility.mockRestore()
    vi.useRealTimers()
  }
})
