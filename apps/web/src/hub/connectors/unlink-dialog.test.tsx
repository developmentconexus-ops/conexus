import type { CopyOfConnection } from '@conexus/hub-api'
import { CopyId } from '@conexus/hub-api'
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'
import { sentenceOfCode } from '../../platform/hub.ts'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { connectionOf, MERCADO_LIVRE } from './fixtures.ts'
import type { Answers, View } from './test-hub.tsx'
import { openIntegrations, pageOf, viewOf } from './test-hub.tsx'

// Desligar says before the click what leaves the copies (O Sync de qualquer conector, criterion 41).
const server = hubServer()

const STORE = connectionOf({ connector: 'mercado-livre', name: 'Loja A' })

function lost(
  name: string,
  fields: Pick<CopyOfConnection, 'last' | 'rows' | 'mode'>,
): CopyOfConnection {
  return { copyId: CopyId.parse(crypto.randomUUID()), name, ...fields }
}

const COPIES = [
  lost('ml_pedidos', { last: false, rows: 1274, mode: { kind: 'CHANGES' } }),
  lost('ml_perguntas', { last: true, rows: 10, mode: { kind: 'WHOLE' } }),
  lost('ml_anuncios', { last: false, rows: null, mode: { kind: 'WHOLE' } }),
]

function storeView(fields: Partial<View> = {}): View {
  return viewOf({ connections: [STORE], connectors: [MERCADO_LIVRE], ...fields })
}

async function openDialog(view: View, answers?: Answers) {
  const sent = openIntegrations(server, view, answers, pageOf(STORE))
  fireEvent.click(await screen.findByRole('button', { name: 'Mais ações' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Desligar' }))
  const dialog = within(await screen.findByRole('alertdialog'))
  return { sent, dialog, button: () => dialog.getByRole('button', { name: 'Desligar' }) }
}

test('o que o Desligar apaga', async () => {
  const held = Promise.withResolvers<void>()
  const first = await openDialog(
    storeView({ copies: { [STORE.id]: COPIES }, copiesHeld: held.promise }),
  )
  // Until the read of the copies arrives, Desligar waits.
  expect(first.button().hasAttribute('disabled')).toBe(true)
  held.resolve()
  expect(
    await first.dialog.findByText('A cópia ml_pedidos perde as 1.274 linhas desta conta.'),
  ).toBeTruthy()
  expect(first.dialog.getByText('A cópia ml_perguntas acaba.')).toBeTruthy()
  expect(first.dialog.getByText('A cópia ml_anuncios perde as linhas desta conta.')).toBeTruthy()
  expect(
    first.dialog.getByText(
      'O que o Mercado Livre já não mostra não volta se você ligar esta conta de novo.',
    ),
  ).toBeTruthy()
  expect(first.dialog.getByText('O Conexus apaga as chaves que guardou.')).toBeTruthy()
  await waitFor(() => expect(first.button().hasAttribute('disabled')).toBe(false))
  cleanup()

  // A connection with no copy: today's dialog. A whole copy only: no sentence of what does not come back.
  const none = await openDialog(storeView())
  await waitFor(() => expect(none.button().hasAttribute('disabled')).toBe(false))
  expect(none.dialog.queryByText(/A cópia/)).toBeNull()
  cleanup()
  const whole = await openDialog(storeView({ copies: { [STORE.id]: COPIES.slice(1) } }))
  expect(await whole.dialog.findByText('A cópia ml_perguntas acaba.')).toBeTruthy()
  expect(whole.dialog.queryByText(/já não mostra/)).toBeNull()
  cleanup()

  // A read that fails says so, and Desligar stays.
  const failed = await openDialog(
    storeView({ copiesAnswer: () => refusal('DATABASE_UNAVAILABLE') }),
  )
  expect(await failed.dialog.findByText('Não conseguiu ler as cópias desta conta.')).toBeTruthy()
  expect(failed.button().hasAttribute('disabled')).toBe(false)
})

test('o que o Desligar apaga: o banco da empresa calado', async () => {
  const before = await openDialog(storeView({ copies: { [STORE.id]: COPIES } }), {
    unlink: () => refusal('COPY_DATABASE_UNAVAILABLE'),
  })
  await waitFor(() => expect(before.button().hasAttribute('disabled')).toBe(false))
  fireEvent.click(before.button())
  expect(await before.dialog.findByText(sentenceOfCode('COPY_DATABASE_UNAVAILABLE'))).toBeTruthy()
  expect(screen.getByRole('heading', { name: 'Loja A', hidden: true })).toBeTruthy()
  cleanup()

  // Silent only after the Hub removed it: the connection is gone, and the table that stayed is named.
  const after = await openDialog(storeView({ copies: { [STORE.id]: COPIES } }), {
    unlink: () => HttpResponse.json({ revocation: 'NONE', tablesLeft: ['ml_perguntas'] }),
  })
  await waitFor(() => expect(after.button().hasAttribute('disabled')).toBe(false))
  fireEvent.click(after.button())
  expect(
    await after.dialog.findByText(
      'A conexão foi removida. A tabela da cópia ml_perguntas ainda não saiu do banco da empresa; o Conexus a apaga no próximo Desligar ou quando uma cópia for ligada.',
    ),
  ).toBeTruthy()
  expect(after.dialog.queryByText(/continua/)).toBeNull()
  fireEvent.click(after.dialog.getByRole('button', { name: 'Fechar' }))
  expect(await screen.findByRole('heading', { name: 'Integrações' })).toBeTruthy()
})
