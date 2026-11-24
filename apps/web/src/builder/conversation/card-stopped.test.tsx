import { fireEvent, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { AGENT_START, agentEnd, RUNNING, stepStarted, updatePart } from './test-events.ts'
import { conversationOf, FIRST, say, screens } from './test-hub.tsx'
import { displayOf, parkedOf } from './test-stream.tsx'
import { QUESTION_ASKING, QUESTION_CLOSED_PART, QUESTION_DENIED } from './tool-fixtures.ts'

const { openConversation } = screens(hubServer())
const STEP = 'builder-step-1'

test('a pergunta que fecha porque a pessoa parou o Builder diz só que ela parou (12)', async () => {
  const opened = await openConversation(conversationOf({ id: FIRST }))
  say(opened.field, 'Crie um app de encomendas')
  const line = opened.line()
  line.emit(AGENT_START)
  line.emit(RUNNING)
  line.emit(stepStarted(STEP, []))
  line.emit(updatePart(QUESTION_ASKING, 0, STEP))
  const { toolCallId, toolName, args } = QUESTION_DENIED
  const parked = parkedOf({ toolCallId, toolName, args })
  line.emit(displayOf({ isRunning: true, pendingSuspensions: parked }))
  line.emit(agentEnd('suspended'))
  line.emit(displayOf({ pendingSuspensions: parked }))
  await screen.findByRole('button', { name: 'Parar' })
  line.emit(AGENT_START)
  line.emit(RUNNING)
  line.emit(updatePart(QUESTION_CLOSED_PART, 0, STEP))
  line.emit(displayOf({ isRunning: true }))
  line.emit(agentEnd('aborted'))
  line.emit(displayOf())
  fireEvent.click(await screen.findByRole('button', { name: /sem resposta/ }))
  await screen.findByText('Você parou o Builder.')
  // The next run starts: the card still says who closed it.
  line.emit(AGENT_START)
  line.emit(RUNNING)
  line.emit(stepStarted('step-2', []))
  line.emit(agentEnd('complete'))
  expect(await screen.findByText('Você parou o Builder.')).toBeTruthy()
  expect(screen.queryByText(/Veja a conversa/)).toBeNull()
  expect(screen.queryByText(/Esta pergunta já foi respondida/)).toBeNull()
})
