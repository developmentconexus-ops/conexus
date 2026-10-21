import type { MessagePart } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { builderSaid, conversationOf, FIRST, say, screens } from './test-hub.tsx'

const { openConversation } = screens(hubServer())
const startedAt = '2026-10-19T12:01:00.000Z'

/** A page the Builder reads: running until it has a title, then completed. */
function readPage(url: string, title?: string): MessagePart {
  const state = title === undefined ? 'running' : 'completed'
  return {
    type: 'tool',
    id: 'tool-1',
    kind: 'read_page',
    state,
    subject: { url, title: title ?? null },
  }
}

test('o texto parcial fecha a marca aberta, a região viva espera o fim e o aviso fica na conversa', async () => {
  const { field, lines, shown } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  await screen.findByText('Pensando…')
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  lines[0]?.emit({
    type: 'notice',
    text: 'Time 3 foi recusada. Ligue de novo; continuei pela Time 1.',
  })
  lines[0]?.emit({ type: 'part', part: readPage('https://padaria.example.test/pedidos') })
  lines[0]?.emit({
    type: 'part',
    part: readPage('https://padaria.example.test/pedidos', 'Pedidos da padaria'),
  })
  lines[0]?.emit({ type: 'text', delta: 'O **primei' })
  expect((await within(log).findByText('primei')).tagName).toBe('STRONG')
  expect(log.getAttribute('aria-live')).toBe('polite')
  expect(log.getAttribute('aria-busy')).toBe('true')
  expect(
    within(log).getByText('Time 3 foi recusada. Ligue de novo; continuei pela Time 1.'),
  ).toBeTruthy()
  const page = within(log).getByRole('link', { name: /Pedidos da padaria/ })
  expect(page.getAttribute('href')).toBe('https://padaria.example.test/pedidos')
  expect(page.getAttribute('rel')).toBe('noopener noreferrer')
  expect(within(log).getAllByText('Leu uma página')).toHaveLength(1)
  const conversation = shown.conversations[0]
  conversation?.messages.push(builderSaid('O **primeiro** é bom.'))
  lines[0]?.emit({ type: 'turnEnd', reason: 'complete' })
  await waitFor(() => expect(log.getAttribute('aria-busy')).toBe('false'))
  expect((await within(log).findByText('primeiro')).tagName).toBe('STRONG')
  expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull()
})

test('um endereço que não é http nem https aparece como texto, sem link', async () => {
  const { field, lines } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Leia')
  await screen.findByText('Pensando…')
  lines[0]?.emit({
    type: 'part',
    part: readPage('javascript:alert(1)', 'Armadilha'),
  })
  expect(await screen.findByText('Armadilha')).toBeTruthy()
  expect(screen.queryByRole('link', { name: /Armadilha/ })).toBeNull()
})

test('o título chega pelo stream e a conversa o mostra na hora', async () => {
  const { field, lines, shown } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  await screen.findByText('Pensando…')
  // The Hub saves the title before it says it, so a read the send started may bring it too.
  const conversation = shown.conversations[0]
  if (conversation) conversation.title = 'Apps de padaria'
  lines[0]?.emit({ type: 'title', title: 'Apps de padaria' })
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'Conversas' })).toHaveProperty(
      'value',
      'Apps de padaria',
    ),
  )
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
  lines[0]?.emit({ type: 'part', part: { type: 'failure', code: 'MODEL_CALL_FAILED' } })
  lines[0]?.emit({ type: 'turnEnd', reason: 'error' })
  expect((await screen.findByRole('alert')).textContent).toBe(
    'O modelo não respondeu. Envie a mensagem de novo.',
  )
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull())
  expect(screen.queryByText('Pensando…')).toBeNull()
})

test('sem conta no meio do turno, a falha diz a frase da conta e não a do modelo', async () => {
  const { field, lines } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  await screen.findByText('Pensando…')
  lines[0]?.emit({ type: 'part', part: { type: 'failure', code: 'MODEL_NO_ACCOUNT' } })
  lines[0]?.emit({ type: 'turnEnd', reason: 'error' })
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Nenhuma conta que você pode usar atende a este modelo. Escolha outro modelo ou fale com quem administra a empresa.',
  )
})

test('ao reconectar, a conversa é lida de novo e o texto parcial volta pelo "turn"', async () => {
  const { field, lines, reads } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  lines[0]?.emit({ type: 'text', delta: 'O primeiro' })
  await screen.findByText(/O primeiro/)
  const before = reads.length
  lines[0]?.close()
  await waitFor(() => expect(lines.length).toBe(2), { timeout: 4000 })
  lines[1]?.emit({ type: 'turn', message: builderSaid('O primeiro é bom e o segun'), startedAt })
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
  lines[1]?.emit({ type: 'turn', message: { ...builderSaid(''), parts: [] }, startedAt })
  expect(await screen.findByText('Pensando…')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Parar' })).toBeTruthy()
})

test('a resposta que terminou com a linha caída aparece uma vez ao reconectar, e o campo volta', async () => {
  const { field, lines, shown } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  lines[0]?.emit({ type: 'text', delta: 'O primeiro' })
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

test('depois de "Parar", o texto parcial fica até a leitura trazer a resposta guardada', async () => {
  const { field, lines, shown } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  lines[0]?.emit({ type: 'text', delta: 'O primeiro é' })
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
  const { field, lines, resumedFrom } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  lines[0]?.emit({ type: 'text', delta: 'O primeiro' }, 'turn-1.1')
  lines[0]?.emit({ type: 'text', delta: ' é bom' }, 'turn-1.2')
  await screen.findByText('O primeiro é bom')
  lines[0]?.close()
  await waitFor(() => expect(lines.length).toBe(2), { timeout: 4000 })
  expect(resumedFrom).toEqual([null, 'turn-1.2'])
  lines[1]?.emit({ type: 'text', delta: ' e o segundo.' }, 'turn-1.3')
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
  const failure = { type: 'failure', code: 'MODEL_CALL_FAILED' } as const
  lines[0]?.emit({ type: 'part', part: failure })
  shown.conversations[0]?.messages.push({ ...builderSaid(''), parts: [failure] })
  lines[0]?.emit({ type: 'turnEnd', reason: 'error' })
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull())
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  expect(
    within(log)
      .getAllByRole('alert')
      .map((alert) => alert.textContent),
  ).toEqual(['O modelo não respondeu. Envie a mensagem de novo.'])
})

test('o turno retomado após reiniciar, relido acabado, diz que o servidor reiniciou sem relógio', async () => {
  await openConversation(
    conversationOf({
      id: FIRST,
      messages: [
        {
          ...builderSaid(''),
          parts: [
            { type: 'text', text: 'Guardei o endereço.' },
            { type: 'machine', phase: 'resumed' },
          ],
        },
      ],
    }),
  )
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  await within(log).findByText('O servidor reiniciou; continuando…')
  expect(within(log).queryByText(/\(há /)).toBeNull()
})

test('60 s sem o Builder dizer nada: "Ainda trabalhando…", contado desde o início do turno', async () => {
  const { field, lines } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  await screen.findByText('Pensando…')
  const began = new Date(Date.now() - 20_000).toISOString()
  lines[0]?.emit({ type: 'turn', message: { ...builderSaid(''), parts: [] }, startedAt: began })
  vi.useFakeTimers({ toFake: ['Date'], now: Date.now() })
  try {
    lines[0]?.emit({ type: 'text', delta: 'Vou ver.' })
    await screen.findByText('Vou ver.')
    vi.setSystemTime(Date.now() + 59_000)
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toMatch(
        /^Builder trabalhando · há 1 min 1[89] s$/,
      ),
    )
    vi.setSystemTime(Date.now() + 2000)
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toMatch(
        /^Ainda trabalhando… há 1 min 2[01] s$/,
      ),
    )
    lines[0]?.emit({ type: 'text', delta: ' Pronto.' })
    await waitFor(() =>
      expect(screen.getByRole('status').textContent).toMatch(/^Builder trabalhando · há /),
    )
  } finally {
    vi.useRealTimers()
  }
})
