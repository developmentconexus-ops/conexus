import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { builderSaid, conversationOf, FIRST, say, screens } from './test-hub.tsx'

const { openConversation } = screens(hubServer())

test('o texto parcial fecha a marca aberta, a região viva espera o fim e o aviso fica na conversa', async () => {
  const { field, lines, shown } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  await screen.findByText('Pensando…')
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  lines[0]?.emit({
    type: 'notice',
    text: 'Time 3 foi recusada. Ligue de novo; continuei pela Time 1.',
  })
  lines[0]?.emit({
    type: 'part',
    part: {
      type: 'page',
      url: 'https://padaria.example.test/pedidos',
      title: 'Pedidos da padaria',
    },
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
    part: { type: 'page', url: 'javascript:alert(1)', title: 'Armadilha' },
  })
  expect(await screen.findByText('Li a página Armadilha')).toBeTruthy()
  expect(screen.queryByRole('link', { name: /Armadilha/ })).toBeNull()
})

test('o título chega pelo stream e a conversa o mostra na hora', async () => {
  const { field, lines } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  await screen.findByText('Pensando…')
  lines[0]?.emit({ type: 'title', title: 'Apps de padaria' })
  expect(await screen.findByRole('heading', { level: 1, name: 'Apps de padaria' })).toBeTruthy()
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
  lines[0]?.emit({ type: 'failure', code: 'MODEL_CALL_FAILED' })
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
  lines[0]?.emit({ type: 'failure', code: 'MODEL_NO_ACCOUNT' })
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
  lines[1]?.emit({ type: 'turn', message: builderSaid('O primeiro é bom e o segun') })
  expect(await screen.findByText('O primeiro é bom e o segun')).toBeTruthy()
  expect(reads.length).toBeGreaterThan(before)
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
