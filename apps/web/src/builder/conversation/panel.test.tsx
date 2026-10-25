import { FAILURES } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { afterEach, expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import {
  AGENT_START,
  agentEnd,
  RUNNING,
  signalStarted,
  stepStarted,
  textDelta,
} from './test-events.ts'
import { conversationOf, FIRST, PROJECT, SECOND, say, screens, typed, view } from './test-hub.tsx'
import { UNCONFIRMED_SEND } from './text.ts'

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
  const { conexus } = open(
    view({ conversations: [conversationOf({ id: FIRST, title: 'Primeira' })] }),
    `${PROJECT}/conversations/${SECOND}`,
  )
  expect(await screen.findByText(FAILURES.NOT_FOUND.phrase)).toBeTruthy()
  expect(screen.queryByRole('textbox', { name: 'Mensagem para o Builder' })).toBeNull()
  // The company's frame around the page still reads its companies; the test ends once it has.
  await waitFor(() => expect(conexus.queryClient.isFetching()).toBe(0))
})

const STEER = 'Só eu cadastro.'
const PENDING = 'Vai ao Builder no próximo passo'

/** The Hub's answer to the sends after the first, which enter the running run. */
function afterFirst(reply: () => Response | Promise<Response>) {
  let sends = 0
  return () => (++sends > 1 ? reply() : undefined)
}

/** A run going with the first message sent, the Builder's first words heard. */
async function answering(answers: Parameters<typeof openConversation>[2] = {}) {
  const hub = await openConversation(conversationOf({ id: FIRST }), view(), answers)
  say(hub.field, 'Crie um app de encomendas')
  await waitFor(() => expect(hub.sent).toHaveLength(1))
  hub.line().emit(AGENT_START)
  hub.line().emit(RUNNING)
  hub.line().emit(stepStarted())
  hub.line().emit(textDelta('Vou começar'))
  await screen.findByText('Vou começar')
  await screen.findByRole('button', { name: 'Parar' })
  return hub
}

function messagesOf(sent: { path: string; body: unknown }[]) {
  return sent.filter((one) => one.path.endsWith('/messages'))
}

test('a mensagem enviada durante a resposta aparece embaixo com "Vai ao Builder no próximo passo" e entra na volta quando o stream a confirma (45)', async () => {
  const { field, line, sent } = await answering()
  say(field, STEER)
  const steer = await screen.findByText(STEER)
  await waitFor(() => expect(messagesOf(sent)).toHaveLength(2))
  expect(messagesOf(sent)[1]?.body).toEqual({ message: STEER })
  expect(screen.getByText(PENDING)).toBeTruthy()
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  expect(steer.compareDocumentPosition(screen.getByText('Vou começar'))).toBe(
    Node.DOCUMENT_POSITION_PRECEDING,
  )
  line().emit(signalStarted('signal-1', STEER))
  await waitFor(() => expect(screen.queryByText(PENDING)).toBeNull())
  expect(within(log).getAllByText(STEER)).toHaveLength(1)
  expect(typed(field)).toBe('')
})

test('Parar com uma mensagem não lida: ela fica pendente até a volta que o Mastra abre com ela (46)', async () => {
  const { field, line } = await answering()
  say(field, STEER)
  await screen.findByText(PENDING)
  line().emit(agentEnd('aborted'))
  expect(screen.getByText(PENDING)).toBeTruthy()
  line().emit(AGENT_START)
  line().emit(signalStarted('signal-1', STEER))
  await waitFor(() => expect(screen.queryByText(PENDING)).toBeNull())
  expect(typed(field)).toBe('')
})

test('Esc durante a resposta para pelo abort do Mastra', async () => {
  const { field, sent } = await answering()
  fireEvent.keyDown(field, { key: 'Escape' })
  await waitFor(() => expect(sent.some((one) => one.path.endsWith('/abort'))).toBe(true))
})

test('o envio que falha tira o balão e deixa o texto no campo', async () => {
  const { field } = await answering({ message: afterFirst(() => HttpResponse.error()) })
  say(field, STEER)
  expect((await screen.findByRole('alert')).textContent).toBe(UNCONFIRMED_SEND)
  expect(screen.queryByText(PENDING)).toBeNull()
  expect(typed(field)).toBe(STEER)
})
