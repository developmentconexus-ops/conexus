import { screen, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { AGENT_START, agentEnd, RUNNING, signalStarted, titleUpdated } from './test-events.ts'
import { conversationOf, FIRST, say, screens } from './test-hub.tsx'

// The Builder's panel names the conversation when Mastra says so, with no focus and no new message.
const { openConversation } = screens(hubServer())

test('a conversa do Builder sem título ganha o nome na caixa de conversas quando o Mastra avisa que o criou', async () => {
  const opened = conversationOf({ id: FIRST })
  const hub = await openConversation(opened)
  const box = screen.getByRole('combobox', { name: 'Conversas' })
  expect(box).toHaveProperty('value', expect.stringMatching(/^Conversa de /))
  say(hub.field, 'Crie um app de encomendas')
  await waitFor(() => expect(hub.sent).toHaveLength(1))
  hub.line().emit(AGENT_START)
  hub.line().emit(RUNNING)
  hub.line().emit(signalStarted('signal-1', 'Crie um app de encomendas'))
  await screen.findByRole('button', { name: 'Parar' })
  hub.line().emit(agentEnd())
  await waitFor(() => expect(screen.queryByRole('button', { name: 'Parar' })).toBeNull())
  const listed = hub.listReads.length
  opened.title = 'Encomendas da padaria'
  expect(box).toHaveProperty('value', expect.stringMatching(/^Conversa de /))
  hub.line().emit(titleUpdated())
  await waitFor(() => expect(box).toHaveProperty('value', 'Encomendas da padaria'))
  // The list the box opens on is read again too: the open conversation's own name comes from its own read.
  await waitFor(() => expect(hub.listReads.length).toBeGreaterThan(listed))
})
