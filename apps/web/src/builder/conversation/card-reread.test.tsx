import type { MastraPart, Message } from '@conexus/hub-api'
import { MessageId, QuestionAnswer, ToolCallId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS } from '../../platform/test-hub.tsx'
import { builderSaid, conversationOf, FIRST, say, screens } from './test-hub.tsx'

const server = hubServer()
const { openConversation } = screens(server)
const CALL = ToolCallId.parse('call-1')
const ANSWER = `*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/conversations/${FIRST}/questions/${CALL}`
const RUN = MessageId.parse('run-1')
const STEP = MessageId.parse('step-1')
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
      bodies.push(QuestionAnswer.parse(await request.json()))
      return new HttpResponse(null, { status: 202 })
    }),
  )
  return bodies
}

/**
 * A turn that asks, told on the stream; then its end, with the read already holding the step as
 * Mastra saves it, its call parked (answer-lost: the card used to mount again here).
 */
async function asking(call: Extract<MastraPart, { type: 'tool-invocation' }>) {
  const opened = await openConversation(conversationOf({ id: FIRST }))
  say(opened.field, 'Monte a tabela de preços')
  await waitFor(() => expect(opened.shown.conversations[0]?.messages).toHaveLength(1))
  const line = opened.lines[0]
  line?.emit({
    type: 'turn',
    messages: [{ ...builderSaid(''), id: RUN, parts: [] }],
    startedAt: new Date().toISOString(),
  })
  line?.emit({ type: 'message_start', message: { ...builderSaid(''), id: STEP, parts: [call] } })
  const { toolCallId, toolName, args } = call.toolInvocation
  const parked = { toolCallId, toolName, args, suspendPayload: args }
  line?.emit({ type: 'tool_suspended', ...parked })
  function end() {
    // The read says one more thing than the stream did, so the screen shows when it took the read.
    const parts = [{ type: 'text', text: READ }, call] satisfies MastraPart[]
    const saved: Message = { ...builderSaid(''), id: STEP, parts, suspended: { [CALL]: parked } }
    opened.shown.conversations[0]?.messages.push(saved)
    line?.emit({ type: 'turnEnd', reason: 'complete' })
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
    expect(bodies).toEqual([{ kind: 'answers', answers: ['Pão francês R$ 1,00'] }]),
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
    expect(bodies).toEqual([{ kind: 'plan', action: 'rejected', feedback: 'Filtre por data' }]),
  )
})
