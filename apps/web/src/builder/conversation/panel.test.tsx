import { ConversationEvent, FAILURES, MessageId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { afterEach, expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import steerStart from './steer-events.json' with { type: 'json' }
import { opening, stepStarted, textDelta } from './test-events.ts'
import { conversationOf, FIRST, PROJECT, SECOND, say, screens, typed, view } from './test-hub.tsx'
import { STEER_FAILED, UNCONFIRMED_SEND } from './text.ts'

const { open, openConversation } = screens(hubServer())

afterEach(() => sessionStorage.clear())

function box() {
  return screen.getByRole('combobox', { name: 'Conversas' })
}

/** Opens the box with the keyboard and picks the conversation named `name`. */
async function pick(name: string) {
  fireEvent.keyDown(box(), { key: 'ArrowDown' })
  const option = await screen.findByRole('option', { name })
  fireEvent.pointerDown(option)
  fireEvent.mouseDown(option)
  fireEvent.pointerUp(option)
  fireEvent.mouseUp(option)
  fireEvent.click(option)
}

test('um Projeto sem conversa diz "Nenhuma conversa" e oferece "Nova conversa"', async () => {
  open(view(), PROJECT)
  expect(await screen.findByText('Nenhuma conversa')).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Nova conversa' })).toBeTruthy()
})

test('o Projeto abre na conversa mais recente, e a caixa lista as da pessoa', async () => {
  const { conexus } = open(
    view({
      conversations: [
        conversationOf({ id: FIRST, title: 'Apps de padaria' }),
        conversationOf({ id: SECOND }),
      ],
    }),
    `${PROJECT}?lens=project`,
  )
  await screen.findByRole('textbox', { name: 'Mensagem para o Builder' })
  expect(conexus.router.state.location.pathname).toBe(`${PROJECT}/conversations/${FIRST}`)
  expect(conexus.router.state.location.search).toEqual({ lens: 'project' })
  expect(box()).toHaveProperty('value', 'Apps de padaria')
  fireEvent.keyDown(box(), { key: 'ArrowDown' })
  const options = (await screen.findAllByRole('option')).map((one) => one.textContent)
  expect(options).toEqual(['Apps de padaria', 'Conversa de 19/10/2026, 09:00'])
})

test('"Nova conversa" cria com a chave da tentativa e abre a conversa com o foco no campo', async () => {
  const { sent } = open(view(), PROJECT)
  fireEvent.click(await screen.findByRole('button', { name: 'Nova conversa' }))
  const field = await screen.findByRole('textbox', { name: 'Mensagem para o Builder' })
  await waitFor(() => expect(document.activeElement).toBe(field))
  expect(sent).toHaveLength(1)
  expect(sent[0]?.attemptKey).toMatch(/^[0-9a-f-]{36}$/)
  expect(sent[0]?.body).toEqual({})
  expect(box()).toHaveProperty('value', expect.stringMatching(/^Conversa de /))
})

test('sem conta, "Nova conversa" mostra a frase do Hub e nada é criado', async () => {
  open(view(), PROJECT, { create: () => refusal('MODEL_NO_ACCOUNT') })
  fireEvent.click(await screen.findByRole('button', { name: 'Nova conversa' }))
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Nenhuma conta que você pode usar atende a este modelo. Escolha outro modelo ou fale com quem administra a empresa.',
  )
})

test('trocar de conversa e voltar guarda o rascunho de cada uma', async () => {
  open(
    view({
      conversations: [
        conversationOf({ id: FIRST, title: 'Primeira' }),
        conversationOf({ id: SECOND, title: 'Segunda' }),
      ],
    }),
    `${PROJECT}/conversations/${FIRST}`,
  )
  fireEvent.change(await screen.findByRole('textbox', { name: 'Mensagem para o Builder' }), {
    target: { value: 'meio da frase' },
  })
  await pick('Segunda')
  await waitFor(() => expect(box()).toHaveProperty('value', 'Segunda'))
  expect(typed(await screen.findByRole('textbox', { name: 'Mensagem para o Builder' }))).toBe('')
  await pick('Primeira')
  await waitFor(() => expect(box()).toHaveProperty('value', 'Primeira'))
  expect(typed(await screen.findByRole('textbox', { name: 'Mensagem para o Builder' }))).toBe(
    'meio da frase',
  )
})

test('uma mensagem enviada cujo envio termina depois da troca de conversa não volta ao campo', async () => {
  const gate = Promise.withResolvers<void>()
  const { sent } = open(
    view({
      conversations: [
        conversationOf({ id: FIRST, title: 'Primeira' }),
        conversationOf({ id: SECOND, title: 'Segunda' }),
      ],
    }),
    `${PROJECT}/conversations/${FIRST}`,
    {
      message: async () => {
        await gate.promise
        return undefined
      },
    },
  )
  say(await screen.findByRole('textbox', { name: 'Mensagem para o Builder' }), 'já enviada')
  await waitFor(() => expect(sent.length).toBe(1))
  await pick('Segunda')
  await waitFor(() => expect(box()).toHaveProperty('value', 'Segunda'))
  gate.resolve()
  await waitFor(() => expect(sessionStorage.getItem(`conexus-draft:${FIRST}`)).toBe(''))
  await pick('Primeira')
  await waitFor(() => expect(box()).toHaveProperty('value', 'Primeira'))
  expect(typed(await screen.findByRole('textbox', { name: 'Mensagem para o Builder' }))).toBe('')
  expect(sessionStorage.getItem(`conexus-draft:${FIRST}`)).toBe('')
})

test('a conversa de outra pessoa abre como "não encontrado", sem rastro dela', async () => {
  open(
    view({ conversations: [conversationOf({ id: FIRST, title: 'Primeira' })] }),
    `${PROJECT}/conversations/${SECOND}`,
  )
  expect(await screen.findByText(FAILURES.NOT_FOUND.phrase)).toBeTruthy()
  expect(screen.queryByRole('textbox', { name: 'Mensagem para o Builder' })).toBeNull()
})

const STEER = 'Só eu cadastro.'
const PENDING = 'Vai ao Builder no próximo passo'

/** The person's `message_start` as unit 12's server tells it, with the id of the send that made it. */
function readByMastra(key: string | null): ConversationEvent {
  const start = ConversationEvent.parse(steerStart)
  if (start.type !== 'message_start') throw new Error('the fixture is a message_start')
  return { ...start, message: { ...start.message, id: MessageId.parse(`${FIRST}:${key}`) } }
}

/**
 * The Hub's answer to the sends after the first: Mastra saves a steer where it reads it, so the
 * conversation does not hold it yet.
 */
function afterFirst(reply: () => Response | Promise<Response>) {
  let sends = 0
  return () => (++sends > 1 ? reply() : undefined)
}

function accepted() {
  return new HttpResponse(null, { status: 202 })
}

/** A turn running with the first message sent, the Builder's first words heard. */
async function answering() {
  const hub = await openConversation(conversationOf({ id: FIRST }), view(), {
    message: afterFirst(accepted),
  })
  say(hub.field, 'Crie um app de encomendas')
  await screen.findByRole('button', { name: 'Parar' })
  hub.lines[0]?.emit(opening())
  hub.lines[0]?.emit(stepStarted())
  hub.lines[0]?.emit(textDelta('Vou começar'))
  await screen.findByText('Vou começar')
  return hub
}

test('a mensagem enviada durante a resposta aparece embaixo com "Vai ao Builder no próximo passo" e entra na volta quando o stream a confirma', async () => {
  const { field, lines, sent } = await answering()
  say(field, STEER)
  const steer = await screen.findByText(STEER)
  await waitFor(() => expect(sent.filter((one) => one.path.endsWith('/messages'))).toHaveLength(2))
  const [first, second] = sent.filter((one) => one.path.endsWith('/messages'))
  expect(second?.body).toEqual({ content: STEER })
  expect(second?.attemptKey).not.toBe(first?.attemptKey)
  expect(screen.getByText(PENDING)).toBeTruthy()
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  expect(steer.compareDocumentPosition(screen.getByText('Vou começar'))).toBe(
    Node.DOCUMENT_POSITION_PRECEDING,
  )
  lines[0]?.emit(readByMastra(second?.attemptKey ?? null))
  await waitFor(() => expect(screen.queryByText(PENDING)).toBeNull())
  expect(within(log).getAllByText(STEER)).toHaveLength(1)
  expect(typed(field)).toBe('')
})

test('Parar com uma mensagem não lida: ela volta para o campo e a tela diz por quê', async () => {
  const { field, lines } = await answering()
  say(field, STEER)
  await screen.findByText(PENDING)
  await waitFor(() => expect(typed(field)).toBe(''))
  lines[0]?.emit({ type: 'turnEnd', reason: 'aborted' })
  await waitFor(() => expect(typed(field)).toBe(STEER))
  expect((await screen.findByRole('alert')).textContent).toBe(
    'O Builder parou antes de ler sua mensagem. Ela voltou para o campo.',
  )
  expect(screen.queryByText(PENDING)).toBeNull()
})

test('duas mensagens seguidas durante a resposta vão com chaves diferentes', async () => {
  const gate = Promise.withResolvers<void>()
  const { field, sent } = await openConversation(conversationOf({ id: FIRST }), view(), {
    message: afterFirst(async () => {
      await gate.promise
      return accepted()
    }),
  })
  say(field, 'Crie um app de encomendas')
  await screen.findByRole('button', { name: 'Parar' })
  say(field, STEER)
  say(field, 'E o estoque também.')
  await waitFor(() => expect(sent.filter((one) => one.path.endsWith('/messages'))).toHaveLength(3))
  const keys = sent.filter((one) => one.path.endsWith('/messages')).map((one) => one.attemptKey)
  expect(new Set(keys).size).toBe(3)
  expect(screen.queryByText(FAILURES.IDEMPOTENCY_CONFLICT.phrase)).toBeNull()
  gate.resolve()
})

test('o envio que falha deixa o balão marcado como não enviado e o texto no campo', async () => {
  const { field } = await openConversation(conversationOf({ id: FIRST }), view(), {
    message: afterFirst(() => HttpResponse.error()),
  })
  say(field, 'Crie um app de encomendas')
  await screen.findByRole('button', { name: 'Parar' })
  say(field, STEER)
  expect((await screen.findByRole('alert')).textContent).toBe(UNCONFIRMED_SEND)
  expect(screen.queryByText(PENDING)).toBeNull()
  expect(screen.getByText(STEER_FAILED)).toBeTruthy()
  expect(typed(field)).toBe(STEER)
})
