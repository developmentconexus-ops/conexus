import type { LakeTablesOfConnection } from '@conexus/hub-api'
import { LakeRun, LakeTablesOfConnection as View } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { delay, http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { copiedLake, RUNNING_ROUND } from './lake-fixtures.ts'
import { openTables } from './test-lake.tsx'

const server = hubServer()
const COPIED = ['TGFCAB', 'TGFITE']
const STOP_PATH = '/lake-copy/run/stop'
const CONTINUES = 'As linhas já lidas ficam no lago; a próxima cópia continua de onde parou.'
const OTHERS =
  'Nas outras tabelas, as linhas já lidas ficam no lago e a próxima cópia continua de onde parou.'

function running(firstLoad: readonly string[] = [], round: object = {}): LakeTablesOfConnection {
  const lake = copiedLake(COPIED, { lastRun: LakeRun.parse({ ...RUNNING_ROUND, ...round }) })
  return View.parse({
    ...lake,
    tables: lake.tables.map((table) =>
      table.copy.kind === 'MARKED'
        ? { ...table, copy: { ...table.copy, firstLoad: firstLoad.includes(table.source) } }
        : table,
    ),
  })
}

function interrupted(stoppedBy: { name: string } | null) {
  const round = LakeRun.parse({
    id: '00000000-0000-4000-8000-0000000000a3',
    startedAt: '2026-11-24T10:00:00.000Z',
    endedAt: '2026-11-24T10:05:00.000Z',
    whole: false,
    outcome: 'INTERRUPTED',
    read: 0,
    written: 0,
    machine: null,
    stoppedBy,
  })
  const lake = copiedLake(COPIED, { lastRun: round })
  return View.parse({
    ...lake,
    tables: lake.tables.map((table) =>
      table.copy.kind === 'MARKED' ? { ...table, copy: { ...table.copy, lastRun: round } } : table,
    ),
  })
}

async function askToStop(section: HTMLElement) {
  const button = within(section).getByRole('button', { name: 'Parar cópia' })
  button.focus()
  fireEvent.click(button)
  return within(await screen.findByRole('alertdialog', { name: 'Parar a cópia?' }))
}

test('sem rodada aberta não há Parar cópia', async () => {
  const { section } = await openTables(server, { lake: copiedLake(COPIED) })
  expect(within(section).getByRole('button', { name: 'Rodar agora' })).toBeTruthy()
  expect(within(section).queryByRole('button', { name: /^Par/ })).toBeNull()
})

test('com a rodada aberta, Parar cópia confirma, envia o pedido sem corpo e vira Parando…', async () => {
  const { section, sent } = await openTables(server, { lake: running() })
  server.use(http.get('*/lake-tables', async () => void (await delay(100))))
  const dialog = await askToStop(section)
  expect(dialog.getByText(CONTINUES)).toBeTruthy()
  expect(dialog.queryByRole('listitem')).toBeNull()
  expect(dialog.queryByText(OTHERS)).toBeNull()

  fireEvent.click(dialog.getByRole('button', { name: 'Parar cópia' }))

  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  const button = within(section).getByRole('button', { name: 'Parando…' })
  expect(button.getAttribute('aria-disabled')).toBe('true')
  await waitFor(() => expect(document.activeElement).toBe(button))
  fireEvent.click(button)
  expect(screen.queryByRole('alertdialog')).toBeNull()
  const stops = sent.filter((one) => one.path.endsWith(STOP_PATH))
  expect(stops.map(({ method, body }) => ({ method, body }))).toEqual([
    { method: 'POST', body: undefined },
  ])
  expect(within(section).getAllByText('Rodando…')).toHaveLength(2)
})

test('Cancelar não pede nada ao Hub', async () => {
  const { section, sent } = await openTables(server, { lake: running() })
  const dialog = await askToStop(section)

  fireEvent.click(dialog.getByRole('button', { name: 'Cancelar' }))

  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(within(section).getByRole('button', { name: 'Parar cópia' })).toBeTruthy()
  expect(sent.filter((one) => one.method !== 'GET')).toHaveLength(0)
})

test('a tabela em primeira carga é nomeada como começa do zero, e a frase das outras fica ao lado', async () => {
  const { section } = await openTables(server, { lake: running(['TGFITE']) })
  const dialog = await askToStop(section)
  expect(
    dialog.getByText(
      'Esta tabela ainda não terminou a primeira carga. A próxima cópia a começa do zero:',
    ),
  ).toBeTruthy()
  const rows = dialog.getAllByRole('listitem').map((row) => row.textContent)
  expect(rows).toEqual(['Itens das notassankhya_tgfite'])
  expect(dialog.getByText(OTHERS)).toBeTruthy()
  expect(dialog.queryByText(CONTINUES)).toBeNull()
})

test('com todas em primeira carga, nenhuma frase promete continuar', async () => {
  const { section } = await openTables(server, { lake: running(COPIED) })
  const dialog = await askToStop(section)
  expect(
    dialog.getByText(
      'Estas tabelas ainda não terminaram a primeira carga. A próxima cópia começa cada uma do zero:',
    ),
  ).toBeTruthy()
  expect(dialog.getAllByRole('listitem')).toHaveLength(2)
  expect(dialog.queryByText(OTHERS)).toBeNull()
  expect(dialog.queryByText(CONTINUES)).toBeNull()
})

test('quem abre a página com a parada já pedida vê Parando… desligado', async () => {
  const { section } = await openTables(server, { lake: running([], { stopping: true }) })
  const button = within(section).getByRole('button', { name: 'Parando…' })
  expect(button.getAttribute('aria-disabled')).toBe('true')
  fireEvent.click(button)
  expect(screen.queryByRole('alertdialog')).toBeNull()
})

test('o pedido recusado diz a frase e o botão volta a pedir, mesmo com a parada gravada no Hub', async () => {
  let asked = 0
  const held = { lake: running() }
  const { section, view } = await openTables(server, held, {
    stop: () => {
      asked += 1
      if (asked > 1) return undefined
      view.lake = running([], { stopping: true })
      return refusal('COPY_AWS_UNAVAILABLE')
    },
  })
  const dialog = await askToStop(section)

  fireEvent.click(dialog.getByRole('button', { name: 'Parar cópia' }))

  expect((await within(section).findByRole('alert')).textContent).toContain('AWS')
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  const button = within(section).getByRole('button', { name: 'Parar cópia' })
  expect(button.hasAttribute('disabled')).toBe(false)

  const again = await askToStop(section)
  fireEvent.click(again.getByRole('button', { name: 'Parar cópia' }))

  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(within(section).getByRole('button', { name: 'Parando…' })).toBeTruthy()
  expect(within(section).queryByRole('alert')).toBeNull()
})

test('a recusa de uma rodada não vale para a seguinte, que já tem a parada pedida', async () => {
  const next = { id: '00000000-0000-4000-8000-0000000000a4', stopping: true }
  const { section, view } = await openTables(
    server,
    { lake: running() },
    {
      stop: () => {
        view.lake = running([], next)
        return refusal('COPY_AWS_UNAVAILABLE')
      },
    },
  )
  const dialog = await askToStop(section)

  fireEvent.click(dialog.getByRole('button', { name: 'Parar cópia' }))

  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  const button = within(section).getByRole('button', { name: 'Parando…' })
  expect(button.getAttribute('aria-disabled')).toBe('true')
})

test('quem não gerencia cópias vê Parar cópia desligado e o clique não pede nada', async () => {
  const { section, sent } = await openTables(server, {
    role: 'member',
    mayManage: false,
    lake: running(),
  })
  const button = within(section).getByRole('button', { name: 'Parar cópia' })
  expect(button.hasAttribute('disabled')).toBe(true)
  fireEvent.click(button)
  expect(screen.queryByRole('alertdialog')).toBeNull()
  expect(sent.filter((one) => one.method !== 'GET')).toHaveLength(0)
})

test('a rodada parada por alguém diz Interrompida. nas tabelas e quem parou, às que horas', async () => {
  const { section } = await openTables(server, { lake: interrupted({ name: 'Ana Lima' }) })
  const view = within(section)
  expect(view.getAllByText('Interrompida.')).toHaveLength(2)
  expect(view.getByText('Parada por Ana Lima às 07:05')).toBeTruthy()
  expect(view.queryByText(/^Última rodada /)).toBeNull()
  expect(view.queryByRole('button', { name: /^Par(ar|ando)/ })).toBeNull()
})

test('a rodada interrompida sem quem parou diz Interrompida. e a hora da última rodada', async () => {
  const { section } = await openTables(server, { lake: interrupted(null) })
  const view = within(section)
  expect(view.getAllByText('Interrompida.')).toHaveLength(2)
  expect(view.getByText('Última rodada 24/11/2026, 07:05')).toBeTruthy()
})
