import type { MastraPart } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import {
  MSG_ID,
  opening,
  ours,
  readPage,
  stepStarted,
  textDelta,
  updatePart,
} from './test-events.ts'
import { builderSaid, conversationOf, FIRST, say, screens } from './test-hub.tsx'

const { openConversation } = screens(hubServer())
const startedAt = '2026-10-19T12:01:00.000Z'

test('o texto parcial fecha a marca aberta, a região viva espera o fim e o aviso fica na conversa', async () => {
  const { field, lines, shown } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  await screen.findByText('Pensando…')
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  lines[0]?.emit(opening())
  lines[0]?.emit(stepStarted())
  lines[0]?.emit(ours({ type: 'data-conexus-notice', data: { text: 'Time 3 foi recusada.' } }))
  lines[0]?.emit(updatePart(readPage('https://padaria.example.test/pedidos'), 1))
  lines[0]?.emit(
    updatePart(readPage('https://padaria.example.test/pedidos', 'Pedidos da padaria'), 1),
  )
  lines[0]?.emit(textDelta('O **primei'))
  expect((await within(log).findByText('primei')).tagName).toBe('STRONG')
  expect(log.getAttribute('aria-live')).toBe('polite')
  expect(log.getAttribute('aria-busy')).toBe('true')
  expect(within(log).getByText('Time 3 foi recusada.')).toBeTruthy()
  expect(within(log).getAllByText(/Leu uma página/)).toHaveLength(1)
  shown.conversations[0]?.messages.push(builderSaid('O **primeiro** é bom.'))
  lines[0]?.emit({ type: 'turnEnd', reason: 'complete' })
  await waitFor(() => expect(log.getAttribute('aria-busy')).toBe('false'))
  expect((await within(log).findByText('primeiro')).tagName).toBe('STRONG')
  expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull()
})

test('um endereço de página é acessível sem link arbitrário', async () => {
  const { field, lines } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Leia')
  await screen.findByText('Pensando…')
  lines[0]?.emit(opening())
  lines[0]?.emit(stepStarted())
  lines[0]?.emit(updatePart(readPage('javascript:alert(1)', 'Armadilha'), 0))
  expect(await screen.findByText(/Leu uma página/)).toBeTruthy()
})

test('"Parar" pede a parada e devolve o foco ao campo', async () => {
  const { field, lines, sent } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  fireEvent.click(await screen.findByRole('button', { name: 'Parar' }))
  await waitFor(() => expect(sent.at(-1)?.path).toMatch(/\/stop$/))
  expect(document.activeElement).toBe(field)
  lines[0]?.emit({ type: 'turnEnd', reason: 'aborted' })
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull())
  expect(document.activeElement).toBe(field)
})

test('a falha do modelo diz a frase e a ação da tabela, e a resposta termina', async () => {
  const { field, lines } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  await screen.findByText('Pensando…')
  lines[0]?.emit(opening())
  lines[0]?.emit(ours({ type: 'data-conexus-failure', data: { code: 'MODEL_CALL_FAILED' } }))
  lines[0]?.emit({ type: 'turnEnd', reason: 'error' })
  expect((await screen.findByRole('alert')).textContent).toBe(
    'O modelo não respondeu. Envie a mensagem de novo.',
  )
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull())
  expect(screen.queryByText('Pensando…')).toBeNull()
})

test('a recusa do modelo diz a frase e a ação da linha nova da tabela', async () => {
  const { field, lines } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  await screen.findByText('Pensando…')
  lines[0]?.emit(opening())
  lines[0]?.emit(ours({ type: 'data-conexus-failure', data: { code: 'MODEL_REFUSED' } }))
  lines[0]?.emit({ type: 'turnEnd', reason: 'error' })
  expect((await screen.findByRole('alert')).textContent).toBe(
    'O modelo recusou este pedido. Reescreva a mensagem de outro jeito ou peça outra coisa ao Builder.',
  )
})

test('sem conta no meio do turno, a falha diz a frase da conta e não a do modelo', async () => {
  const { field, lines } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  await screen.findByText('Pensando…')
  lines[0]?.emit(opening())
  lines[0]?.emit(ours({ type: 'data-conexus-failure', data: { code: 'MODEL_NO_ACCOUNT' } }))
  lines[0]?.emit({ type: 'turnEnd', reason: 'error' })
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Nenhuma conta que você pode usar atende a este modelo. Escolha outro modelo ou fale com quem administra a empresa.',
  )
})

test('ao reconectar, a conversa é lida de novo e o texto parcial volta pelo "turn"', async () => {
  const { field, lines, reads } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  lines[0]?.emit(opening())
  lines[0]?.emit(stepStarted())
  lines[0]?.emit(textDelta('O primeiro'))
  await screen.findByText(/O primeiro/)
  const before = reads.length
  lines[0]?.close()
  await waitFor(() => expect(lines.length).toBe(2), { timeout: 4000 })
  lines[1]?.emit({ type: 'turn', messages: [builderSaid('O primeiro é bom e o segun')], startedAt })
  expect(await screen.findByText('O primeiro é bom e o segun')).toBeTruthy()
  expect(reads.length).toBeGreaterThan(before)
  expect(screen.getByRole('button', { name: 'Parar' })).toBeTruthy()
})

test('ao reconectar com o turno em curso e ainda mudo, o "turn" vazio mostra "Pensando…" e "Parar"', async () => {
  const { field, lines } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  await screen.findByText('Pensando…')
  lines[0]?.close()
  await waitFor(() => expect(lines.length).toBe(2), { timeout: 4000 })
  await waitFor(() => expect(screen.queryByText('Pensando…')).toBeNull())
  lines[1]?.emit({ type: 'turn', messages: [{ ...builderSaid(''), parts: [] }], startedAt })
  expect(await screen.findByText('Pensando…')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Parar' })).toBeTruthy()
})

test('a resposta que terminou com a linha caída aparece uma vez ao reconectar, e o campo volta', async () => {
  const { field, lines, shown } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  lines[0]?.emit(opening())
  lines[0]?.emit(stepStarted())
  lines[0]?.emit(textDelta('O primeiro'))
  await screen.findByText(/O primeiro/)
  lines[0]?.close()
  shown.conversations[0]?.messages.push(builderSaid('O primeiro é bom.'))
  await waitFor(() => expect(lines.length).toBe(2), { timeout: 4000 })
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull())
  expect(within(log).getAllByText(/O primeiro/)).toHaveLength(1)
  expect(within(log).getByText('O primeiro é bom.')).toBeTruthy()
  expect(log.getAttribute('aria-busy')).toBe('false')
  fireEvent.change(field, { target: { value: 'E o segundo?' } })
  expect(screen.getByRole('button', { name: 'Enviar' }).hasAttribute('disabled')).toBe(false)
})

test('o turno que acabou com a linha caída, sem nada guardado depois, não deixa "Builder trabalhando" ao reconectar', async () => {
  const { field, lines, shown } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  lines[0]?.emit({ type: 'turn', messages: [{ ...builderSaid(''), parts: [] }], startedAt })
  await screen.findByText(/Builder trabalhando/)
  lines[0]?.close()
  shown.conversations[0]?.messages.push(builderSaid('Resposta guardada.'))
  await waitFor(() => expect(lines.length).toBe(2), { timeout: 4000 })
  await waitFor(() => expect(screen.queryByText(/Builder trabalhando/)).toBeNull())
  expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull()
})

test('depois de "Parar", o texto parcial fica até a leitura trazer a resposta guardada', async () => {
  const { field, lines, shown } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  lines[0]?.emit(opening())
  lines[0]?.emit(stepStarted())
  lines[0]?.emit(textDelta('O primeiro é'))
  await screen.findByText(/O primeiro é/)
  fireEvent.click(screen.getByRole('button', { name: 'Parar' }))
  lines[0]?.emit({ type: 'turnEnd', reason: 'aborted' })
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull())
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  expect(within(log).getByText('O primeiro é')).toBeTruthy()
  expect(log.getAttribute('aria-busy')).toBe('false')
  shown.conversations[0]?.messages.push(builderSaid('O primeiro é'))
  lines[0]?.close()
  await waitFor(() => expect(lines.length).toBe(2), { timeout: 4000 })
  await waitFor(() => expect(within(log).getAllByText('O primeiro é')).toHaveLength(1))
})

test('uma linha do stream que não é JSON abre a linha de novo', async () => {
  const { lines } = await openConversation(conversationOf({ id: FIRST }))
  lines[0]?.write('data: {quebrado\n\n')
  await waitFor(() => expect(lines.length).toBe(2), { timeout: 4000 })
})

test('ao reconectar, a tela manda o id do último evento e o turno segue de onde parou', async () => {
  const conversation = conversationOf({ id: FIRST, inProgress: true })
  const { field, lines, resumedFrom } = await openConversation(conversation)
  say(field, 'Compare')
  lines[0]?.emit(opening())
  lines[0]?.emit(stepStarted())
  lines[0]?.emit(textDelta('O primeiro'), 'turn-1.1')
  lines[0]?.emit(textDelta(' é bom'), 'turn-1.2')
  await screen.findByText('O primeiro é bom')
  lines[0]?.close()
  await waitFor(() => expect(lines.length).toBe(2), { timeout: 4000 })
  expect(resumedFrom).toEqual([null, 'turn-1.2'])
  lines[1]?.emit(textDelta(' e o segundo.'), 'turn-1.3')
  expect(await screen.findByText('O primeiro é bom e o segundo.')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Parar' })).toBeTruthy()
  lines[1]?.close()
  await waitFor(() => expect(lines.length).toBe(3), { timeout: 4000 })
  expect(resumedFrom.at(-1)).toBe('turn-1.3')
})

test('a falha do turno, parte da resposta, segue na conversa relida depois do fim', async () => {
  const { field, lines, shown } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  await screen.findByText('Pensando…')
  lines[0]?.emit(opening())
  const failure: MastraPart = { type: 'data-conexus-failure', data: { code: 'MODEL_CALL_FAILED' } }
  lines[0]?.emit(ours(failure))
  shown.conversations[0]?.messages.push({ ...builderSaid(''), parts: [failure] })
  lines[0]?.emit({ type: 'turnEnd', reason: 'error' })
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull())
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  expect(
    within(log)
      .getAllByRole('alert')
      .map((a) => a.textContent),
  ).toEqual(['O modelo não respondeu. Envie a mensagem de novo.'])
})

test('60 s sem o Builder dizer nada: "Ainda trabalhando…", contado desde o início do turno', async () => {
  const { lines } = await openConversation(conversationOf({ id: FIRST }))
  vi.useFakeTimers({ shouldAdvanceTime: true })
  try {
    const now = Date.now()
    lines[0]?.emit({
      type: 'turn',
      messages: [{ ...builderSaid(''), parts: [] }],
      startedAt: new Date(now).toISOString(),
    })
    lines[0]?.emit(stepStarted(MSG_ID))
    lines[0]?.emit(textDelta('Vou ver.'))
    await screen.findByText('Vou ver.')
    vi.setSystemTime(now + 59_000)
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe('Builder trabalhando · há 59 s'),
    )
    vi.setSystemTime(now + 60_000)
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe('Ainda trabalhando… há 1 min 00 s'),
    )
  } finally {
    vi.useRealTimers()
  }
})
