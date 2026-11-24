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

/** The Assistant's conversation without a title, the run going; `when` says if Mastra's tell comes after the run ended or in the middle of it. */
async function namedBy(event: () => object, title: string, when: 'after' | 'during') {
  const opened = assistantConversation({ title: null })
  const hub = at(OPEN, { conversations: [opened] })
  expect(await screen.findByRole('heading', { name: UNTITLED })).toBeTruthy()
  const line = await running(hub)
  if (when === 'after') {
    line.emit(agentEnd())
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull())
  }
  // The title is saved before Mastra says so; the header still says the date.
  opened.conversation.title = title
  expect(screen.getByRole('heading', { name: UNTITLED })).toBeTruthy()
  line.emit(event())
  expect(await screen.findByRole('heading', { name: title })).toBeTruthy()
  const nav = screen.getByRole('navigation', { name: 'Navegação' })
  expect(await within(nav).findByRole('link', { name: new RegExp(title) })).toBeTruthy()
}

test('a conversa sem título ganha o nome na tela quando o Mastra avisa que o criou', async () => {
  await namedBy(titleUpdated, 'Automatizar pagamento de contas', 'after')
})

test('o título que o observador troca aparece na tela quando ele avisa, com o turno ainda rodando como na gravação', async () => {
  await namedBy(observerTitleUpdated, 'Pagamento de contas automático', 'during')
})
