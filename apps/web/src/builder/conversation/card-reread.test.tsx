import { BUILDER_CONTROLLER, BUILDER_ROUTES, ToolCallId } from '@conexus/hub-api'
import type { MastraMessagePart as MastraPart } from '@mastra/client-js'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { AGENT_START, agentEnd, RUNNING, signalStarted, stepStarted } from './test-events.ts'
import { conversationOf, FIRST, say, screens } from './test-hub.tsx'
import { builderSaid, displayOf, parkedOf } from './test-stream.tsx'

const server = hubServer()
const { openConversation } = screens(server)
const CALL = ToolCallId.parse('call-1')
const ANSWER = `*${BUILDER_ROUTES}/agent-controller/${BUILDER_CONTROLLER}/sessions/${FIRST}/tool-suspension`
const STEP = 'step-1'
const READ = 'Preciso saber os preços.'

const QUESTION = {
  type: 'tool-invocation',
  toolInvocation: {
    toolCallId: CALL,
    toolName: 'ask_user',
    state: 'call',
    args: { questions: [{ question: 'Quais produtos entram?', options: [{ label: 'Os pães' }] }] },
  },
} satisfies MastraPart

const PLAN = {
  type: 'tool-invocation',
  toolInvocation: {
    toolCallId: CALL,
    toolName: 'submit_plan',
    state: 'call',
    args: { title: 'Encomendas', plan: 'Uma tela de encomendas.' },
  },
} satisfies MastraPart

function answered() {
  const bodies: unknown[] = []
  server.use(
    http.post(ANSWER, async ({ request }) => {
      bodies.push(await request.json())
      return HttpResponse.json({ ok: true })
    }),
  )
  return bodies
}

/**
 * A run that asks, told on the stream; then its end, with the read already holding the step as
 * Mastra saves it (answer-lost: the card used to mount again here).
 */
async function asking(call: Extract<MastraPart, { type: 'tool-invocation' }>) {
  const opened = await openConversation(conversationOf({ id: FIRST }))
  say(opened.field, 'Monte a tabela de preços')
  await waitFor(() => expect(opened.shown.conversations[0]?.messages).toHaveLength(1))
  const line = opened.line()
  line.emit(AGENT_START)
  line.emit(RUNNING)
  line.emit(
    signalStarted(opened.shown.conversations[0]?.messages[0]?.id ?? '', 'Monte a tabela de preços'),
  )
  line.emit(stepStarted(STEP, [call]))
  const { toolCallId, toolName, args } = call.toolInvocation
  const parked = parkedOf({ toolCallId, toolName, args })
  line.emit(displayOf({ isRunning: true, pendingSuspensions: parked }))
  function end() {
    // The read says one more thing than the stream did, so the screen shows when it took the read.
    const saved = builderSaid('', STEP)
    saved.content = { ...saved.content, parts: [{ type: 'text', text: READ }, call] }
    opened.shown.conversations[0]?.messages.push(saved)
    line.emit(agentEnd('suspended'))
    line.emit(displayOf({ pendingSuspensions: parked }))
    return screen.findByText(READ)
  }
  return { end, log: screen.getByRole('log', { name: 'Conversa com o Builder' }) }
}

test('o texto digitado na pergunta sobrevive ao fim do turno: "Enviar" manda o que a pessoa escreveu', async () => {
  const bodies = answered()
  const { end, log } = await asking(QUESTION)
  const other = await within(log).findByRole('textbox', { name: 'Outra resposta' })
  fireEvent.change(other, { target: { value: 'Pão francês R$ 1,00' } })
  await end()
  await waitFor(() => expect(within(log).getAllByText('Quais produtos entram?')).toHaveLength(1))
  fireEvent.click(within(log).getByRole('button', { name: 'Enviar' }))
  await waitFor(() =>
    expect(bodies).toEqual([{ toolCallId: CALL, resumeData: ['Pão francês R$ 1,00'] }]),
  )
})

test('o ajuste digitado no plano sobrevive ao fim do turno: "Pedir ajustes" manda o que a pessoa escreveu', async () => {
  const bodies = answered()
  const { end, log } = await asking(PLAN)
  const card = await within(log).findByRole('region', { name: 'Plano: Encomendas' })
  fireEvent.click(within(card).getByRole('button', { name: 'Pedir ajustes' }))
  const reason = within(card).getByRole('textbox', { name: 'O que mudar no plano' })
  fireEvent.change(reason, { target: { value: 'Filtre por data' } })
  await end()
  const after = within(log).getByRole('region', { name: 'Plano: Encomendas' })
  fireEvent.click(within(after).getByRole('button', { name: 'Pedir ajustes' }))
  await waitFor(() =>
    expect(bodies).toEqual([
      {
        toolCallId: CALL,
        resumeData: {
          action: 'rejected',
          feedback: 'Filtre por data',
          title: 'Encomendas',
          plan: 'Uma tela de encomendas.',
        },
      },
    ]),
  )
})
