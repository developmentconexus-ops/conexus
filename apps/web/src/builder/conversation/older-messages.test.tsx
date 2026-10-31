import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { OPENED, session } from './session-state.ts'
import { agentEnd } from './test-events.ts'
import { conversationOf, FIRST, screens } from './test-hub.tsx'
import { builderSaid, personSaid } from './test-stream.tsx'

const { openConversation } = screens(hubServer())

function said(count: number) {
  return Array.from({ length: count }, (_, index) => personSaid(`mensagem ${index}`, `p${index}`))
}

/** jsdom lays nothing out: the viewport is given a height, and the reader a place, to scroll from. */
function scrollerAt(top: number) {
  const viewport = screen.getByLabelText('Rolagem da conversa')
  let at = top
  Object.defineProperties(viewport, {
    scrollHeight: { value: 1000, configurable: true },
    clientHeight: { value: 100, configurable: true },
    scrollTop: {
      get: () => at,
      set: (to: number) => {
        at = to
      },
      configurable: true,
    },
  })
  return (to: number) => {
    act(() => {
      at = to
      fireEvent.scroll(viewport)
    })
  }
}

/** The reader scrolls up from the middle of the conversation to its top. */
function reachTop() {
  const scrollTo = scrollerAt(500)
  scrollTo(500)
  scrollTo(0)
}

test('uma conversa com mais de 100 mensagens mostra as últimas 100 e, ao chegar ao topo, traz as 100 anteriores', async () => {
  const hub = await openConversation(conversationOf({ id: FIRST, messages: said(250) }))
  expect(await screen.findByText('mensagem 249')).toBeTruthy()
  expect(screen.getByText('mensagem 150')).toBeTruthy()
  expect(screen.queryByText('mensagem 149')).toBeNull()
  expect(screen.queryByRole('button', { name: /anteriores/ })).toBeNull()

  const before = hub.reads.length
  reachTop()
  expect(await screen.findByText('mensagem 50')).toBeTruthy()
  expect(screen.getByText('mensagem 249')).toBeTruthy()
  expect(screen.queryByText('mensagem 49')).toBeNull()
  expect(hub.reads.length).toBe(before + 1)

  reachTop()
  expect(await screen.findByText('mensagem 0')).toBeTruthy()
  await waitFor(() => expect(screen.queryByRole('status', { name: /anteriores/ })).toBeNull())
})

test('uma conversa de até 99 mensagens não pede as anteriores ao chegar ao topo', async () => {
  const hub = await openConversation(conversationOf({ id: FIRST, messages: said(99) }))
  expect(await screen.findByText('mensagem 0')).toBeTruthy()
  const before = hub.reads.length
  reachTop()
  await new Promise((resolve) => setTimeout(resolve, 100))
  expect(hub.reads.length).toBe(before)
})

test('voltar à aba não lê a conversa de novo', async () => {
  const hub = await openConversation(conversationOf({ id: FIRST, messages: said(120) }))
  await screen.findByText('mensagem 119')
  const before = hub.reads.length
  window.dispatchEvent(new Event('focus'))
  window.dispatchEvent(new Event('visibilitychange'))
  await new Promise((resolve) => setTimeout(resolve, 100))
  expect(hub.reads.length).toBe(before)
})

test('quando a janela das últimas 100 desliza, as mensagens que saíram dela ficam antes das novas', async () => {
  const conversation = conversationOf({ id: FIRST, messages: said(120) })
  const hub = await openConversation(conversation)
  await screen.findByText('mensagem 119')
  expect(screen.queryByText('mensagem 19')).toBeNull()

  conversation.messages.push(
    personSaid('pergunta nova', 'p-new'),
    builderSaid('resposta nova', 'b-new'),
  )
  act(() => hub.line().emit(agentEnd()))
  await screen.findByText('resposta nova')

  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  const text = log.textContent ?? ''
  expect(text.indexOf('mensagem 119')).toBeLessThan(text.indexOf('pergunta nova'))
  expect(text.indexOf('pergunta nova')).toBeLessThan(text.indexOf('resposta nova'))
  expect(text.endsWith('resposta nova')).toBe(true)
  expect(screen.queryByText('mensagem 19')).toBeNull()
})

test('depois de uma reconexão, a leitura que perdeu as mensagens mais antigas não as manda para baixo das novas', () => {
  const all = said(130)
  let state = session(OPENED, { type: 'loaded', messages: all.slice(-100) })
  state = session(state, { type: 'loaded', messages: all.slice(-100, -50) })
  state = session(state, { type: 'loaded', messages: all.slice(-120) })
  const ids = state.messages.map((message) => message.id)
  expect(ids).toEqual(all.slice(-120).map((message) => message.id))
})
