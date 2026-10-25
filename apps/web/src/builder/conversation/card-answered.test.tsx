import { screen, waitFor } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { AGENT_START, agentEnd, RUNNING, stepStarted, updatePart } from './test-events.ts'
import { conversationOf, FIRST, say, screens } from './test-hub.tsx'
import { displayOf, parkedOf } from './test-stream.tsx'
import { QUESTION_ANSWERED_PART, QUESTION_ASKING, QUESTION_DENIED } from './tool-fixtures.ts'

const { openConversation } = screens(hubServer())

test('a pergunta respondida nunca vira um cartão vazio: o resultado do Mastra vem sem os argumentos (12)', async () => {
  const opened = await openConversation(conversationOf({ id: FIRST }))
  say(opened.field, 'Crie um app de encomendas')
  const line = opened.line()
  line.emit(AGENT_START)
  line.emit(RUNNING)
  line.emit(stepStarted('step-1', []))
  line.emit(updatePart(QUESTION_ASKING, 0, 'step-1'))
  const { toolCallId, toolName, args } = QUESTION_DENIED
  const parked = parkedOf({ toolCallId, toolName, args })
  line.emit(displayOf({ isRunning: true, pendingSuspensions: parked }))
  line.emit(agentEnd('suspended'))
  line.emit(displayOf({ pendingSuspensions: parked }))
  await screen.findByRole('button', { name: 'Enviar' })
  line.emit(displayOf())
  line.emit(AGENT_START)
  line.emit(RUNNING)
  line.emit(stepStarted('step-2', [QUESTION_ANSWERED_PART]))
  await screen.findByText('Só eu')
  await waitFor(() => expect(screen.getAllByText(/Quem cadastra/).length).toBeGreaterThan(0))
})
