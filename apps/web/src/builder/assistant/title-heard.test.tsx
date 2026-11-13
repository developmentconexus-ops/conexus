import { screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { agentEnd, observerTitleUpdated, titleUpdated } from '../conversation/test-events.ts'
import {
  ASKED,
  assistantConversation,
  assistantScreens,
  COMPANY_ROOT,
  running,
} from './test-hub.tsx'

// Mastra names the conversation after the answer ended, and the observer renames it later: the
// header and the list ask the Hub again when Mastra says so, with no focus and no new message.
const server = hubServer()
const { at } = assistantScreens(server)
const OPEN = `${COMPANY_ROOT}/conversations/${ASKED}`
const UNTITLED = /^Conversa de /

async function namedBy(event: () => object, title: string) {
  const opened = assistantConversation({ title: null })
  const hub = at(OPEN, { conversations: [opened] })
  expect(await screen.findByRole('heading', { name: UNTITLED })).toBeTruthy()
  const line = await running(hub)
  line.emit(agentEnd())
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull())
  // The title is saved after the answer, as Mastra does; the header still says the date.
  opened.conversation.title = title
  expect(screen.getByRole('heading', { name: UNTITLED })).toBeTruthy()
  line.emit(event())
  expect(await screen.findByRole('heading', { name: title })).toBeTruthy()
  const nav = screen.getByRole('navigation', { name: 'Navegação' })
  expect(await within(nav).findByRole('link', { name: new RegExp(title) })).toBeTruthy()
}

test('a conversa sem título ganha o nome na tela quando o Mastra avisa que o criou', async () => {
  await namedBy(titleUpdated, 'Automatizar pagamento de contas')
})

test('o título que o observador troca aparece na tela quando ele avisa', async () => {
  await namedBy(observerTitleUpdated, 'Pagamento de contas automático')
})
