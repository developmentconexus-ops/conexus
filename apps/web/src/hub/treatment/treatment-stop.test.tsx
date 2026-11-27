import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { delay, http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { built, listOf, notas, openTreatment } from './test-hub.tsx'

const server = hubServer()
const STOP_PATH = '/data/treated/run/stop'

function running(stopping = false, since = '2026-11-26T17:00:00.000Z') {
  return listOf({
    lastRun: { state: 'RUNNING', since, stopping },
    tables: [notas({ lastRun: built() })],
  })
}

async function layer() {
  await screen.findByRole('navigation', { name: 'Dados' })
  return within(screen.getByRole('main'))
}

async function askToStop(main: ReturnType<typeof within>) {
  const button = await main.findByRole('button', { name: 'Parar' })
  button.focus()
  fireEvent.click(button)
  return within(await screen.findByRole('alertdialog', { name: 'Parar a rodada de tratamento?' }))
}

test('sem rodada aberta não há Parar', async () => {
  openTreatment(server, { view: { list: listOf({ tables: [notas()] }) } })
  const main = await layer()
  expect(await main.findByRole('button', { name: 'Tratar agora' })).toBeTruthy()
  expect(main.queryByRole('button', { name: /^Par/ })).toBeNull()
})

test('com a rodada começando, Parar já aparece ao lado de Tratar agora', async () => {
  openTreatment(server, {
    view: {
      list: listOf({
        lastRun: { state: 'STARTING', since: '2026-11-26T17:00:00.000Z', stopping: false },
        tables: [notas({ lastRun: built() })],
      }),
    },
  })
  const main = await layer()
  const tratar = await main.findByRole('button', { name: 'Tratar agora' })
  expect(tratar.hasAttribute('disabled')).toBe(true)
  expect(tratar.nextElementSibling?.textContent).toBe('Parar')
})

test('com a rodada aberta, Parar fica ao lado de Tratar agora, confirma, envia o pedido sem corpo e vira Parando…', async () => {
  const { view, sent } = openTreatment(server, { view: { list: running() } })
  const main = await layer()
  const tratar = await main.findByRole('button', { name: 'Tratar agora' })
  expect(tratar.nextElementSibling?.textContent).toBe('Parar')
  const dialog = await askToStop(main)

  view.list = running(true)
  server.use(http.get('*/data/treated', async () => void (await delay(100))))
  fireEvent.click(dialog.getByRole('button', { name: 'Parar' }))

  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  const button = main.getByRole('button', { name: 'Parando…' })
  expect(button.getAttribute('aria-disabled')).toBe('true')
  await waitFor(() => expect(document.activeElement).toBe(button))
  fireEvent.click(button)
  expect(screen.queryByRole('alertdialog')).toBeNull()
  const stops = sent.filter((one) => one.path.endsWith(STOP_PATH))
  expect(stops.map(({ method, body }) => ({ method, body }))).toEqual([
    { method: 'POST', body: undefined },
  ])
})

test('Cancelar não pede nada ao Hub', async () => {
  const { sent } = openTreatment(server, { view: { list: running() } })
  const main = await layer()
  const dialog = await askToStop(main)

  fireEvent.click(dialog.getByRole('button', { name: 'Cancelar' }))

  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(main.getByRole('button', { name: 'Parar' })).toBeTruthy()
  expect(sent).toEqual([])
})

test('quem abre a página com a parada já pedida vê Parando… desligado', async () => {
  openTreatment(server, { view: { list: running(true) } })
  const main = await layer()
  const button = await main.findByRole('button', { name: 'Parando…' })
  expect(button.getAttribute('aria-disabled')).toBe('true')
  fireEvent.click(button)
  expect(screen.queryByRole('alertdialog')).toBeNull()
})

test('o pedido recusado diz a frase e o botão volta a pedir, mesmo com a parada gravada no Hub', async () => {
  let asked = 0
  const held = openTreatment(server, {
    view: { list: running() },
    answers: {
      stop: () => {
        asked += 1
        if (asked > 1) return undefined
        held.view.list = running(true)
        return refusal('COPY_AWS_UNAVAILABLE')
      },
    },
  })
  const main = await layer()
  const dialog = await askToStop(main)

  fireEvent.click(dialog.getByRole('button', { name: 'Parar' }))

  expect((await main.findByRole('alert')).textContent).toContain('AWS')
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(main.getByRole('button', { name: 'Parar' }).hasAttribute('disabled')).toBe(false)

  const again = await askToStop(main)
  fireEvent.click(again.getByRole('button', { name: 'Parar' }))

  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(await main.findByRole('button', { name: 'Parando…' })).toBeTruthy()
  expect(main.queryByRole('alert')).toBeNull()
})

test('a recusa de uma rodada não vale para a seguinte, que já tem a parada pedida', async () => {
  const held = openTreatment(server, {
    view: { list: running() },
    answers: {
      stop: () => {
        held.view.list = running(true, '2026-11-26T18:00:00.000Z')
        return refusal('COPY_AWS_UNAVAILABLE')
      },
    },
  })
  const main = await layer()
  const dialog = await askToStop(main)

  fireEvent.click(dialog.getByRole('button', { name: 'Parar' }))

  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  const button = await main.findByRole('button', { name: 'Parando…' })
  expect(button.getAttribute('aria-disabled')).toBe('true')
})

test('a rodada parada por alguém diz no topo quem parou e a que horas, e não há mais Parar', async () => {
  openTreatment(server, {
    view: {
      list: listOf({
        lastRun: {
          state: 'STOPPED',
          stoppedBy: { name: 'Ana Lima' },
          at: '2026-11-26T10:05:00.000Z',
        },
        tables: [notas({ lastRun: built() })],
      }),
    },
  })
  const main = await layer()
  expect(await main.findByText('Parada por Ana Lima às 07:05')).toBeTruthy()
  expect(main.queryByRole('button', { name: /^Par(ar|ando)/ })).toBeNull()
})

test('uma rodada parada sem quem parou diz só Parada., sem inventar um nome', async () => {
  openTreatment(server, {
    view: {
      list: listOf({
        lastRun: { state: 'STOPPED', stoppedBy: null, at: '2026-11-26T10:05:00.000Z' },
        tables: [notas({ lastRun: built() })],
      }),
    },
  })
  const main = await layer()
  expect(await main.findByText('Parada.')).toBeTruthy()
  expect(main.queryByText(/^Parada por/)).toBeNull()
})
