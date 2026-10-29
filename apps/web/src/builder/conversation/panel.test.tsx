import { FAILURES } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { afterEach, expect, test, vi } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import {
  AGENT_START,
  agentEnd,
  RUNNING,
  signalStarted,
  stepStarted,
  textDelta,
} from './test-events.ts'
import {
  conversationOf,
  FIRST,
  onPhone,
  PROJECT,
  SECOND,
  say,
  screens,
  typed,
  view,
} from './test-hub.tsx'
import { attach, displayOf, parkedOf } from './test-stream.tsx'
import { EMPTY_CONVERSATION, UNCONFIRMED_SEND } from './text.ts'

const { open, openConversation } = screens(hubServer())

afterEach(() => sessionStorage.clear())

const PDF = new File(['%PDF-1.4'], 'tabela.pdf', { type: 'application/pdf' })

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

test('um Projeto sem conversa abre numa conversa vazia, pronta para escrever, sem criar nada', async () => {
  const { sent } = open(view(), PROJECT)
  expect(await screen.findByText(EMPTY_CONVERSATION)).toBeTruthy()
  expect(screen.getByRole('textbox', { name: 'Mensagem para o Builder' })).toBeTruthy()
  expect(sent).toHaveLength(0)
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
  const { sent } = open(
    view({ conversations: [conversationOf({ id: FIRST })] }),
    `${PROJECT}/conversations/${FIRST}`,
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Nova conversa' }))
  await waitFor(() => expect(sent).toHaveLength(1))
  await waitFor(() => expect(box()).toHaveProperty('value', expect.stringMatching(/^Conversa de /)))
  const field = screen.getByRole('textbox', { name: 'Mensagem para o Builder' })
  await waitFor(() => expect(document.activeElement).toBe(field))
  expect(sent[0]?.attemptKey).toMatch(/^[0-9a-f-]{36}$/)
  expect(sent[0]?.body).toEqual({})
  expect(box()).toHaveProperty('value', expect.stringMatching(/^Conversa de /))
})

test('a primeira mensagem do Projeto sem conversa cria a conversa e a abre enviando o pedido', async () => {
  const { sent, conexus } = open(view(), PROJECT)
  const field = await screen.findByRole('textbox', { name: 'Mensagem para o Builder' })
  fireEvent.change(field, { target: { value: 'Um app de encomendas' } })
  fireEvent.keyDown(field, { key: 'Enter' })
  await waitFor(() => expect(sent).toHaveLength(1))
  expect(sent[0]?.attemptKey).toMatch(/^[0-9a-f-]{36}$/)
  await waitFor(() => expect(conexus.router.state.location.pathname).toMatch(/\/conversations\//))
})

test('a recusa do modelo no primeiro envio do Projeto sem conversa devolve o texto e diz o que fazer', async () => {
  open(view(), PROJECT, { create: () => refusal('MODEL_NO_ACCOUNT') })
  const field = await screen.findByRole('textbox', { name: 'Mensagem para o Builder' })
  fireEvent.change(field, { target: { value: 'Um app de encomendas' } })
  fireEvent.keyDown(field, { key: 'Enter' })
  expect((await screen.findByRole('status')).textContent).toBe(
    'Nenhuma conta que você pode usar atende a este modelo. Escolha outro modelo ou fale com quem administra a empresa. Escolha outro modelo e envie de novo.',
  )
  expect(typed(field)).toBe('Um app de encomendas')
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

test('A→B→A não repete a mensagem: o envio tira texto e arquivos da caixa no começo (#167, 12)', async () => {
  const gate = Promise.withResolvers<void>()
  const { sent, conexus } = open(
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
  const field = await screen.findByRole('textbox', { name: 'Mensagem para o Builder' })
  attach(PDF)
  await screen.findByRole('button', { name: 'Tirar tabela.pdf' })
  say(field, 'já enviada')
  await waitFor(() => expect(sent.length).toBe(1))
  await pick('Segunda')
  await waitFor(() => expect(box()).toHaveProperty('value', 'Segunda'))
  await pick('Primeira')
  await waitFor(() => expect(box()).toHaveProperty('value', 'Primeira'))
  expect(typed(await screen.findByRole('textbox', { name: 'Mensagem para o Builder' }))).toBe('')
  expect(screen.queryByRole('button', { name: 'Tirar tabela.pdf' })).toBeNull()
  gate.resolve()
  await waitFor(() => expect(conexus.queryClient.isFetching()).toBe(0))
  expect(typed(screen.getByRole('textbox', { name: 'Mensagem para o Builder' }))).toBe('')
  expect(screen.queryByRole('button', { name: 'Tirar tabela.pdf' })).toBeNull()
})

test('recarregar guarda o texto e tira os arquivos (12)', async () => {
  const conversation = conversationOf({ id: FIRST })
  const { field } = await openConversation(conversation)
  fireEvent.change(field, { target: { value: 'meio da frase' } })
  attach(PDF)
  await screen.findByRole('button', { name: 'Tirar tabela.pdf' })
  cleanup()
  // A reload starts the page's modules over; the tab's session storage stays.
  vi.resetModules()
  const page = await import('../../main.tsx')
  render(
    <page.Conexus
      conexus={page.createConexus(
        createMemoryHistory({ initialEntries: [`${PROJECT}/conversations/${FIRST}`] }),
      )}
    />,
  )
  const again = await screen.findByRole('textbox', { name: 'Mensagem para o Builder' })
  expect(typed(again)).toBe('meio da frase')
  expect(screen.queryByRole('button', { name: 'Tirar tabela.pdf' })).toBeNull()
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

test('a mensagem que o stream não confirmou e a releitura traz sai da espera, uma vez (45)', async () => {
  const hub = await answering()
  say(hub.field, STEER)
  await screen.findByText(PENDING)
  hub.line().emit(agentEnd('complete'))
  await waitFor(() => expect(screen.queryByText(PENDING)).toBeNull())
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  expect(within(log).getAllByText(STEER)).toHaveLength(1)
})

test('Esc durante a resposta para pelo abort do Mastra', async () => {
  const { field, sent } = await answering()
  fireEvent.keyDown(field, { key: 'Escape' })
  await waitFor(() => expect(sent.some((one) => one.path.endsWith('/abort'))).toBe(true))
})

test('o envio que falha tira o balão e devolve texto e arquivos (12)', async () => {
  const { field } = await answering({ message: afterFirst(() => HttpResponse.error()) })
  attach(PDF)
  await screen.findByRole('button', { name: 'Tirar tabela.pdf' })
  say(field, STEER)
  expect((await screen.findByRole('alert')).textContent).toBe(UNCONFIRMED_SEND)
  expect(screen.queryByText(PENDING)).toBeNull()
  expect(typed(field)).toBe(STEER)
  expect(screen.getByRole('button', { name: 'Tirar tabela.pdf' })).toBeTruthy()
})

test('com um cartão esperando a pessoa, Parar e Esc cancelam, e a mensagem digitada fica pendente (44, 45)', async () => {
  const { field, line, sent } = await answering()
  const parked = parkedOf({ toolCallId: 'call-1', toolName: 'ask_user', args: { questions: [] } })
  line().emit(agentEnd('suspended'))
  line().emit(displayOf({ pendingSuspensions: parked }))
  const stop = await screen.findByRole('button', { name: 'Parar' })
  say(field, STEER)
  expect(await screen.findByText(PENDING)).toBeTruthy()
  fireEvent.keyDown(field, { key: 'Escape' })
  await waitFor(() => expect(sent.some((one) => one.path.endsWith('/abort'))).toBe(true))
  fireEvent.click(stop)
})

test('no celular, o título da conversa é um botão que abre a lista por baixo, com "Nova conversa" primeiro', async () => {
  await onPhone(async () => {
    const { conexus } = open(
      view({
        conversations: [
          conversationOf({ id: FIRST, title: 'Padarias' }),
          conversationOf({ id: SECOND, title: 'Entregas' }),
        ],
      }),
      `${PROJECT}/conversations/${FIRST}`,
    )
    const title = await screen.findByRole('button', { name: 'Padarias' })
    fireEvent.click(title)
    const sheet = await screen.findByRole('dialog', { name: 'Conversas' })
    await waitFor(() => {
      const rows = within(sheet)
        .getAllByRole('button')
        .map((one) => one.textContent)
      expect(rows.slice(0, 3)).toEqual(['Nova conversa', 'Padarias', 'Entregas'])
    })
    fireEvent.click(within(sheet).getByRole('button', { name: 'Entregas' }))
    await waitFor(() => expect(conexus.router.state.location.pathname).toMatch(new RegExp(SECOND)))
    expect(await screen.findByRole('button', { name: 'Entregas' })).toBeTruthy()
  })
})
