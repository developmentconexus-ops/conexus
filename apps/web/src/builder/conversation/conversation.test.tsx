import type { Conversation, Message } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import type { Answers, View } from './test-hub.tsx'
import { choose, conversationHub, conversationOf, FIRST, PROJECT, SECOND } from './test-hub.tsx'

const server = hubServer()

function view(fields: Partial<View> = {}): View {
  return { conversations: [], providers: ['anthropic', 'google'], ...fields }
}

function open(shown: View, path: string, answers: Answers = {}) {
  const hub = conversationHub(shown, answers)
  server.use(...hub.handlers)
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  render(<Conexus conexus={conexus} />)
  return { ...hub, conexus }
}

function builderSaid(text: string): Message {
  return {
    id: 'builder-1',
    role: 'builder',
    parts: [{ type: 'text', text }],
    createdAt: '2026-10-19T12:02:00.000Z',
  }
}

/** The conversation, open, with its stream connected: the field is there and the line is ours. */
async function openConversation(conversation: Conversation, shown = view(), answers: Answers = {}) {
  shown.conversations = [conversation]
  const hub = open(shown, `${PROJECT}/conversations/${conversation.id}`, answers)
  const field = await screen.findByRole('textbox', { name: 'Mensagem para o Builder' })
  await waitFor(() => expect(hub.lines.length).toBe(1))
  return { ...hub, field, shown }
}

function typed(field: HTMLElement): string {
  return field instanceof HTMLTextAreaElement ? field.value : ''
}

function say(field: HTMLElement, text: string) {
  fireEvent.change(field, { target: { value: text } })
  fireEvent.keyDown(field, { key: 'Enter' })
}

test('a lista vazia diz "Nenhuma conversa" e oferece "Nova conversa"; a aba "Conversa" está ativa', async () => {
  open(view(), `${PROJECT}/conversations`)
  expect(await screen.findByText('Nenhuma conversa')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Nova conversa' })).toBeTruthy()
  const tab = within(screen.getByRole('navigation', { name: 'Projeto' })).getByRole('link', {
    name: 'Conversa',
  })
  expect(tab.getAttribute('aria-current')).toBe('page')
})

test('a lista mostra o título, ou a data quando a conversa ainda não tem título', async () => {
  open(
    view({
      conversations: [
        conversationOf({ id: FIRST, title: 'Apps de encomenda de padaria' }),
        conversationOf({ id: SECOND }),
      ],
    }),
    `${PROJECT}/conversations`,
  )
  expect(await screen.findByRole('link', { name: /Apps de encomenda de padaria/ })).toBeTruthy()
  expect(screen.getByRole('link', { name: '19/10/2026, 09:00' })).toBeTruthy()
})

test('"Nova conversa" cria com a chave da tentativa e abre a conversa com o foco no campo', async () => {
  const { sent } = open(view(), `${PROJECT}/conversations`)
  fireEvent.click(await screen.findByRole('button', { name: 'Nova conversa' }))
  const field = await screen.findByRole('textbox', { name: 'Mensagem para o Builder' })
  await waitFor(() => expect(document.activeElement).toBe(field))
  expect(sent).toHaveLength(1)
  expect(sent[0]?.attemptKey).toMatch(/^[0-9a-f-]{36}$/)
  expect(sent[0]?.body).toEqual({})
  expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/^Conversa de /)
})

test('sem conta, "Nova conversa" mostra a frase do Hub e nada é criado', async () => {
  open(view(), `${PROJECT}/conversations`, { create: () => refusal('MODEL_NO_ACCOUNT') })
  fireEvent.click(await screen.findByRole('button', { name: 'Nova conversa' }))
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Nenhuma conta que você pode usar atende a este modelo. Escolha outro modelo ou fale com quem administra a empresa.',
  )
})

test('a conversa mostra o modelo, só dos fornecedores com conta, e as mensagens', async () => {
  const { shown } = await openConversation(
    conversationOf({
      id: FIRST,
      title: 'Padarias',
      messages: [
        {
          id: 'p1',
          role: 'person',
          parts: [{ type: 'text', text: 'Oi' }],
          createdAt: '2026-10-19T12:00:00.000Z',
        },
        builderSaid('Olá, **tudo bem**?'),
      ],
    }),
  )
  expect(shown.conversations).toHaveLength(1)
  expect(screen.getByRole('heading', { level: 1, name: 'Padarias' })).toBeTruthy()
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  expect(within(log).getByText('Oi')).toBeTruthy()
  expect(within(log).getByText('tudo bem').tagName).toBe('STRONG')
  expect(screen.getByLabelText('Fornecedor do modelo').textContent).toContain('Anthropic')
  fireEvent.click(screen.getByLabelText('Fornecedor do modelo'))
  const providers = (await screen.findAllByRole('option')).map((one) => one.textContent)
  expect(providers).toEqual(['Anthropic', 'Google'])
})

test('o Enter envia com a chave da tentativa; "Pensando…" e "Parar" até chegar o texto', async () => {
  const { field, lines, sent } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare dois apps de encomenda de padaria')
  expect(await screen.findByText('Pensando…')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Parar' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Enviar' }).hasAttribute('disabled')).toBe(true)
  await waitFor(() => expect(typed(field)).toBe(''))
  expect(sent[0]?.body).toEqual({ content: 'Compare dois apps de encomenda de padaria' })
  expect(sent[0]?.attemptKey).toMatch(/^[0-9a-f-]{36}$/)
  expect(await screen.findByText('Compare dois apps de encomenda de padaria')).toBeTruthy()
  lines[0]?.emit({ type: 'text', delta: 'O primeiro é ' })
  expect(await screen.findByText(/O primeiro é/)).toBeTruthy()
  expect(screen.queryByText('Pensando…')).toBeNull()
})

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

test('Shift+Enter e o Enter de uma composição não enviam; o campo guarda o texto', async () => {
  const { field, sent } = await openConversation(conversationOf({ id: FIRST }))
  fireEvent.change(field, { target: { value: 'ação' } })
  fireEvent.keyDown(field, { key: 'Enter', shiftKey: true })
  fireEvent.keyDown(field, { key: 'Enter', isComposing: true })
  expect(sent).toHaveLength(0)
  expect(typed(field)).toBe('ação')
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
  await waitFor(() => expect(sent).toHaveLength(1))
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

test('a falha do modelo diz "O modelo não respondeu." e a resposta termina', async () => {
  const { field, lines } = await openConversation(conversationOf({ id: FIRST }))
  say(field, 'Compare')
  await screen.findByText('Pensando…')
  lines[0]?.emit({ type: 'failure', code: 'MODEL_CALL_FAILED' })
  lines[0]?.emit({ type: 'turnEnd', reason: 'error' })
  expect((await screen.findByRole('alert')).textContent).toBe('O modelo não respondeu.')
  expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull()
  expect(screen.queryByText('Pensando…')).toBeNull()
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

test('sem conta, a conversa mostra o aviso da etapa 11 e não deixa enviar', async () => {
  const { field } = await openConversation(conversationOf({ id: FIRST }), view({ providers: [] }))
  expect(
    screen.getByText(
      'Nenhuma conta que você pode usar atende a este modelo. Escolha outro modelo ou fale com quem administra a empresa.',
    ),
  ).toBeTruthy()
  const notice = screen.getByText(/Nenhuma conta que você pode usar/).parentElement
  expect(
    within(notice ?? document.body).getByRole('link', { name: 'Minha conta de modelo' }),
  ).toBeTruthy()
  fireEvent.change(field, { target: { value: 'Oi' } })
  expect(screen.getByRole('button', { name: 'Enviar' }).hasAttribute('disabled')).toBe(true)
})

test('trocar de modelo envia o novo modelo, para as próximas respostas', async () => {
  const { sent } = await openConversation(conversationOf({ id: FIRST }))
  expect(screen.getByText('A troca vale para as próximas respostas.')).toBeTruthy()
  await choose(screen.getByLabelText('Fornecedor do modelo'), 'Google')
  await choose(await screen.findByLabelText('Modelo'), 'gemini-2.5-pro')
  await waitFor(() => expect(sent.at(-1)?.body).toEqual({ model: 'google/gemini-2.5-pro' }))
  expect(sent.at(-1)?.method).toBe('PUT')
})

test('um envio sem resposta lida mantém o texto e repete a mesma chave na nova tentativa', async () => {
  let failing = true
  const { field, sent } = await openConversation(conversationOf({ id: FIRST }), view(), {
    message: () => (failing ? Response.error() : undefined),
  })
  say(field, 'Compare')
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Não confirmamos o envio. Envie de novo.',
  )
  expect(typed(field)).toBe('Compare')
  expect(screen.queryByText('Pensando…')).toBeNull()
  failing = false
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
  await waitFor(() => expect(sent).toHaveLength(2))
  expect(sent[1]?.attemptKey).toBe(sent[0]?.attemptKey)
})

test('uma conversa que não existe mostra a página de "não encontrado"', async () => {
  open(view(), `${PROJECT}/conversations/${FIRST}`)
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
})

test('sem thread no meio da conversa: não encontrado, e a linha sai da lista', async () => {
  const { field, shown, conexus } = await openConversation(conversationOf({ id: FIRST }))
  shown.conversations = []
  say(field, 'Compare')
  expect(
    await screen.findByRole('heading', { name: 'Não encontramos o que você procurou.' }),
  ).toBeTruthy()
  await conexus.router.navigate({ to: `${PROJECT}/conversations` })
  expect(await screen.findByText('Nenhuma conversa')).toBeTruthy()
})
