import { exportDataReads } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, expect, test, vi } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { refusal } from '../../platform/test-hub.tsx'
import { openReads, read, readsHub, server } from './test-hub.tsx'

// Exportar (criterion 80): the period, the file and the cut at 5,000.

afterEach(() => vi.restoreAllMocks())

function savedFiles() {
  const blobs: Blob[] = []
  const names: string[] = []
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    if (blob instanceof Blob) blobs.push(blob)
    return 'blob:registro'
  })
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    names.push(this.download)
  })
  return { blobs, names }
}

test('Exportar: o período de até 31 dias, o arquivo e o corte em 5.000', async () => {
  const files = savedFiles()
  const periods: URLSearchParams[] = []
  let complete = true
  readsHub({ as: 'admin', reads: () => [read()] })
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/data-reads/export`, ({ request }) => {
      periods.push(new URL(request.url).searchParams)
      return HttpResponse.json(
        exportDataReads.success.body.parse({ reads: [read({ query: '=1+1' })], complete }),
      )
    }),
  )
  openReads('?agent=ASSISTANT')
  fireEvent.click(await screen.findByRole('button', { name: 'Exportar' }))
  const dialog = within(await screen.findByRole('dialog', { name: 'Exportar' }))
  expect(
    dialog.getByText(
      'As leituras dos filtros de agora, num arquivo CSV. No máximo 31 dias por vez.',
    ),
  ).toBeTruthy()
  const from = dialog.getByLabelText('De')
  const to = dialog.getByLabelText('Até')
  fireEvent.change(from, { target: { value: '2026-11-01' } })
  fireEvent.change(to, { target: { value: '2026-12-01' } })
  expect(to.getAttribute('max')).toBe('2026-12-01')
  expect(from.getAttribute('min')).toBe('2026-11-01')
  fireEvent.click(dialog.getByRole('button', { name: 'Exportar' }))
  await waitFor(() => expect(files.names).toEqual(['registro-de-dados-2026-11-01-2026-12-01.csv']))
  const [sent] = periods
  expect(sent?.get('agent')).toBe('ASSISTANT')
  expect(new Date(sent?.get('from') ?? '').getTime()).toBe(new Date(2026, 10, 1).getTime())
  expect(new Date(sent?.get('to') ?? '').getTime()).toBe(new Date(2026, 11, 2).getTime())
  const text = await files.blobs[0]?.text()
  expect(text?.split('\r\n')[1]).toContain(",'=1+1")
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  complete = false
  fireEvent.click(screen.getByRole('button', { name: 'Exportar' }))
  const again = within(await screen.findByRole('dialog', { name: 'Exportar' }))
  fireEvent.change(again.getByLabelText('Até'), { target: { value: '2027-01-30' } })
  expect(again.getByRole('button', { name: 'Exportar' }).hasAttribute('disabled')).toBe(true)
  fireEvent.change(again.getByLabelText('De'), { target: { value: dayToday() } })
  fireEvent.change(again.getByLabelText('Até'), { target: { value: dayToday() } })
  fireEvent.click(again.getByRole('button', { name: 'Exportar' }))
  expect(await again.findByText('As 5.000 leituras mais novas.')).toBeTruthy()
})

function dayToday() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${String(now.getDate()).padStart(2, '0')}`
}

test('Exportar com o Hub calado diz a frase do Hub ao lado do botão', async () => {
  savedFiles()
  readsHub({ as: 'owner', reads: () => [read()] })
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/data-reads/export`, () =>
      refusal('DATABASE_UNAVAILABLE'),
    ),
  )
  openReads()
  fireEvent.click(await screen.findByRole('button', { name: 'Exportar' }))
  const dialog = within(await screen.findByRole('dialog', { name: 'Exportar' }))
  fireEvent.click(dialog.getByRole('button', { name: 'Exportar' }))
  expect(await dialog.findByRole('alert')).toBeTruthy()
  expect(dialog.getByRole('alert').textContent).toMatch(/banco do Conexus/)
})

test('Exportar pendente: "Exportando…" no botão desligado, e um pedido só', async () => {
  savedFiles()
  let release: () => void = () => undefined
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  let asked = 0
  readsHub({ as: 'owner', reads: () => [read()] })
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/data-reads/export`, async () => {
      asked += 1
      await held
      return HttpResponse.json(
        exportDataReads.success.body.parse({ reads: [read()], complete: true }),
      )
    }),
  )
  openReads()
  fireEvent.click(await screen.findByRole('button', { name: 'Exportar' }))
  const dialog = within(await screen.findByRole('dialog', { name: 'Exportar' }))
  const button = dialog.getByRole('button', { name: 'Exportar' })
  // A double click: the second arrives before the button shows it is pending (QA, finding 5).
  fireEvent.click(button)
  fireEvent.click(button)
  const pending = await dialog.findByRole('button', { name: 'Exportando…' })
  expect(pending.hasAttribute('disabled')).toBe(true)
  fireEvent.click(pending)
  release()
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(asked).toBe(1)
})

test('Exportar fechado no meio: aberto de novo, exporta outra vez', async () => {
  savedFiles()
  let asked = 0
  let held = true
  readsHub({ as: 'owner', reads: () => [read()] })
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/data-reads/export`, async () => {
      asked += 1
      if (held) await new Promise(() => undefined)
      return HttpResponse.json(
        exportDataReads.success.body.parse({ reads: [read()], complete: true }),
      )
    }),
  )
  openReads()
  const trigger = await screen.findByRole('button', { name: 'Exportar' })
  fireEvent.click(trigger)
  const first = within(await screen.findByRole('dialog', { name: 'Exportar' }))
  fireEvent.click(first.getByRole('button', { name: 'Exportar' }))
  await first.findByRole('button', { name: 'Exportando…' })
  fireEvent.click(first.getByRole('button', { name: 'Fechar' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  held = false
  fireEvent.click(trigger)
  const again = within(await screen.findByRole('dialog', { name: 'Exportar' }))
  fireEvent.click(again.getByRole('button', { name: 'Exportar' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  expect(asked).toBe(2)
})
