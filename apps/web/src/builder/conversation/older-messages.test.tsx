import { fireEvent, screen, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { conversationOf, FIRST, screens } from './test-hub.tsx'
import { personSaid } from './test-stream.tsx'

const { openConversation } = screens(hubServer())
const LOAD = 'Carregar mensagens anteriores'

function said(count: number) {
  return Array.from({ length: count }, (_, index) => personSaid(`mensagem ${index}`, `p${index}`))
}

test('uma conversa com mais de 100 mensagens mostra as últimas 100 e o botão que traz as anteriores', async () => {
  await openConversation(conversationOf({ id: FIRST, messages: said(250) }))
  expect(await screen.findByText('mensagem 249')).toBeTruthy()
  expect(screen.getByText('mensagem 150')).toBeTruthy()
  expect(screen.queryByText('mensagem 149')).toBeNull()

  fireEvent.click(screen.getByRole('button', { name: LOAD }))
  expect(await screen.findByText('mensagem 50')).toBeTruthy()
  expect(screen.getByText('mensagem 249')).toBeTruthy()
  expect(screen.queryByText('mensagem 49')).toBeNull()

  fireEvent.click(screen.getByRole('button', { name: LOAD }))
  expect(await screen.findByText('mensagem 0')).toBeTruthy()
  await waitFor(() => expect(screen.queryByRole('button', { name: LOAD })).toBeNull())
})

test('uma conversa de até 99 mensagens não mostra o botão', async () => {
  await openConversation(conversationOf({ id: FIRST, messages: said(99) }))
  expect(await screen.findByText('mensagem 0')).toBeTruthy()
  expect(screen.queryByRole('button', { name: LOAD })).toBeNull()
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
