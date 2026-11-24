import type { Question } from '@conexus/hub-api'
import { BUILDER_CONTROLLER, BUILDER_ROUTES, CARD_TOOLS, ToolCallId } from '@conexus/hub-api'
import type { MastraMessagePart as MastraPart } from '@mastra/client-js'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { AGENT_START, agentEnd, RUNNING, stepStarted, updatePart } from './test-events.ts'
import { conversationOf, FIRST, onPhone, say, screens } from './test-hub.tsx'
import { displayOf, parkedOf } from './test-stream.tsx'

const server = hubServer()
const { openConversation } = screens(server)
const CALL = ToolCallId.parse('call-1')
const ANSWER = `*${BUILDER_ROUTES}/agent-controller/${BUILDER_CONTROLLER}/sessions/${FIRST}/tool-suspension`
const STEP_MSG_ID = 'builder-step-1'

function answering(reply: () => Promise<Response | undefined> = async () => undefined) {
  const bodies: unknown[] = []
  server.use(
    http.post(ANSWER, async ({ request }) => {
      bodies.push(await request.json())
      return (await reply()) ?? HttpResponse.json({ ok: true })
    }),
  )
  return bodies
}

function isCard(part: MastraPart) {
  return (
    part.type === 'tool-invocation' &&
    (part.toolInvocation.toolName === CARD_TOOLS.question ||
      part.toolInvocation.toolName === CARD_TOOLS.plan)
  )
}

/**
 * A run that tells its step's parts. A card's call left waiting parks the run, as Mastra does: its
 * display state holds the call, and the run ends `suspended`; its result opens the resumed run.
 */
async function turn(...parts: MastraPart[]) {
  const opened = await openConversation(conversationOf({ id: FIRST }))
  say(opened.field, 'Crie um app de encomendas')
  const line = opened.line()
  line.emit(AGENT_START)
  line.emit(RUNNING)
  line.emit(stepStarted(STEP_MSG_ID, []))
  function tell(...more: MastraPart[]) {
    for (const [index, part] of more.entries()) {
      if (
        part.type === 'tool-invocation' &&
        isCard(part) &&
        part.toolInvocation.state === 'result'
      ) {
        line.emit(AGENT_START)
        line.emit(RUNNING)
      }
      line.emit(updatePart(part, index, STEP_MSG_ID))
      if (part.type !== 'tool-invocation' || !isCard(part)) continue
      const { toolCallId, toolName, args, state } = part.toolInvocation
      if (state !== 'call' && state !== 'approval-requested') continue
      const parked = parkedOf({ toolCallId, toolName, args })
      line.emit(displayOf({ isRunning: true, pendingSuspensions: parked }))
      line.emit(agentEnd('suspended'))
      line.emit(displayOf({ pendingSuspensions: parked }))
    }
  }
  tell(...parts)
  return { tell, log: screen.getByRole('log', { name: 'Conversa com o Builder' }), line }
}

const WHO: Question = {
  question: 'Quem cadastra as encomendas?',
  options: [{ label: 'Todos (recomendado)' }, { label: 'Só eu' }],
  multiSelect: false,
}
const STATE: Question = {
  question: 'Uma encomenda tem situação?',
  options: [{ label: 'Sim' }],
  multiSelect: false,
}

function questionPart(
  state: 'call' | 'approval-requested' | 'result' | 'output-error' = 'call',
  answers?: unknown,
): MastraPart {
  return {
    type: 'tool-invocation',
    toolInvocation: {
      toolCallId: CALL,
      toolName: 'ask_user',
      state,
      args: { questions: [WHO, STATE] },
      result: answers ? { content: 'Answered', answers } : undefined,
    },
  }
}

/** The card's own send button: the field's stays beside it while the Builder waits. */
function questionSend() {
  const field = screen.getByRole('textbox', { name: 'Mensagem para o Builder' })
  const found = screen
    .getAllByRole('button', { name: 'Enviar' })
    .find((one) => one.closest('form') !== field.closest('form'))
  if (!found) throw new Error('the card has no send button')
  return found
}

test('cartão de perguntas da tool-invocation ask_user: resposta livre em várias linhas (#272), envio e respostas (Critério 12)', async () => {
  const held = Promise.withResolvers<undefined>()
  const bodies = answering(() => held.promise)
  const { tell } = await turn(questionPart())

  const first = await screen.findByRole('radio', { name: 'Todos (recomendado)' })
  expect(first).toHaveProperty('checked', true)
  fireEvent.click(screen.getByRole('radio', { name: 'Só eu' }))
  fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))

  const other = await screen.findByRole('textbox', { name: 'Outra resposta' })
  expect(other.getAttribute('placeholder')).toBe('outra resposta…')
  const multilineText = 'Linha 1: só quando for entrega\nLinha 2: após as 18h'
  fireEvent.change(other, { target: { value: multilineText } })
  fireEvent.click(questionSend())

  expect(await screen.findByRole('button', { name: 'Enviando…' })).toHaveProperty('disabled', true)
  held.resolve(undefined)

  await waitFor(() => expect(bodies).toHaveLength(1))
  expect(bodies[0]).toEqual({ toolCallId: CALL, resumeData: ['Só eu', multilineText] })
  tell(questionPart('result', ['Só eu', multilineText]))
  fireEvent.click(await screen.findByRole('button', { name: 'Respondeu 2 perguntas' }))
  const asked = screen.getByText('Quem cadastra as encomendas?').closest('ul')
  expect([...(asked?.children ?? [])].map((item) => item.textContent)).toEqual([
    'Quem cadastra as encomendas?Só eu',
    `Uma encomenda tem situação?${multilineText}`,
  ])
})

test('dois cliques em Enviar mandam a resposta uma única vez', async () => {
  const held = Promise.withResolvers<undefined>()
  const bodies = answering(() => held.promise)
  await turn({
    type: 'tool-invocation',
    toolInvocation: {
      toolCallId: CALL,
      toolName: 'ask_user',
      state: 'call',
      args: { questions: [WHO] },
    },
  })
  const send = await waitFor(questionSend)
  fireEvent.click(send)
  fireEvent.click(send)
  await screen.findByRole('button', { name: 'Enviando…' })
  held.resolve(undefined)
  await waitFor(() => expect(bodies).toHaveLength(1))
  await new Promise((settled) => setTimeout(settled, 50))
  expect(bodies).toHaveLength(1)
})

test('com pergunta aberta de tool-invocation, a linha diz que o Builder espera a pessoa, sem relógio', async () => {
  const { tell } = await turn(questionPart('approval-requested'))
  await waitFor(() =>
    expect(screen.getByRole('status').textContent).toBe('Builder esperando sua resposta.'),
  )
  tell(questionPart('result', ['Só eu', 'Sim']))
  await waitFor(() =>
    expect(screen.getByRole('status').textContent).toMatch(/^Builder trabalhando · há /),
  )
})

test('pergunta vencida ou fechada diz que foi fechada e não se responde', async () => {
  const { log } = await turn({
    type: 'tool-invocation',
    toolInvocation: {
      toolCallId: CALL,
      toolName: 'ask_user',
      state: 'output-error',
      args: { questions: [WHO] },
    },
  })
  fireEvent.click(await screen.findByRole('button', { name: '1 pergunta sem resposta' }))
  await screen.findByText(/Esta pergunta já foi respondida ou não espera mais/)
  expect(within(log).queryByRole('button', { name: 'Enviar' })).toBeNull()
})

test('o cartão da versão: montou, não montou, pela metade, sem conferência (Critério 12)', async () => {
  const base = { number: 1, files: 7, changed: true, changedFiles: 2 }
  const { tell, log } = await turn({
    type: 'data-conexus-version',
    data: { ...base, check: { state: 'passed' } },
  })
  await within(log).findByText('Versão 1 guardada, montou: 7 arquivos.')

  tell({
    type: 'data-conexus-version',
    data: { ...base, number: 2, check: { state: 'failed', code: 'APP_CHECK_FAILED' } },
  })
  const failed = await within(log).findByText(
    /^Versão 2 guardada, não montou: 2 arquivos mudados\./,
  )
  expect(failed.textContent).toBe(
    'Versão 2 guardada, não montou: 2 arquivos mudados.O app não passou na conferência depois de 4 tentativas. O código ficou guardado. Peça ao Builder para corrigir.',
  )

  tell({
    type: 'data-conexus-version',
    data: { ...base, number: 3, check: { state: 'unfinished', open: 2 } },
  })
  const unfinished = await within(log).findByText(/^Versão 3 guardada, pela metade:/)
  expect(unfinished.textContent).toBe('Versão 3 guardada, pela metade: 2 arquivos mudados.')

  tell({
    type: 'data-conexus-version',
    data: { ...base, number: 4, check: { state: 'unchecked', code: 'CHECK_PLATFORM_FAILED' } },
  })
  const unchecked = await within(log).findByText(/^Versão 4 guardada, sem conferência:/)
  expect(unchecked.textContent).toBe(
    'Versão 4 guardada, sem conferência: 2 arquivos mudados.Não consegui conferir o app. O código ficou guardado sem conferência. Peça de novo ao Builder.',
  )
})

let planHeight = 0
const scrollHeight = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollHeight')
Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
  configurable: true,
  get(this: HTMLElement) {
    return this.dataset.slot === 'plan-text' ? planHeight : (scrollHeight?.get?.call(this) ?? 0)
  },
})
afterEach(() => {
  planHeight = 0
})

const PLAN_ARGS = {
  title: 'App de encomendas',
  plan: '## Para a pessoa\n\nUma tela de encomendas.',
}

const PLAN_PART: MastraPart = {
  type: 'tool-invocation',
  toolInvocation: {
    toolCallId: CALL,
    toolName: 'submit_plan',
    state: 'call',
    args: PLAN_ARGS,
  },
}

test('o plano lido da tool-invocation submit_plan: aprovação e pedido de ajustes com feedback (Critério 12)', async () => {
  const bodies = answering()
  const { tell } = await turn(PLAN_PART)
  const card = await screen.findByRole('region', { name: 'Plano: App de encomendas' })
  expect(within(card).getByText('Uma tela de encomendas.')).toBeTruthy()

  fireEvent.click(within(card).getByRole('button', { name: 'Pedir ajustes' }))
  const reason = within(card).getByRole('textbox', { name: 'O que mudar no plano' })
  expect(document.activeElement).toBe(reason)
  fireEvent.change(reason, { target: { value: 'Adicione filtro por data' } })
  fireEvent.click(within(card).getByRole('button', { name: 'Pedir ajustes' }))

  await waitFor(() =>
    expect(bodies).toEqual([
      {
        toolCallId: CALL,
        resumeData: { action: 'rejected', feedback: 'Adicione filtro por data', ...PLAN_ARGS },
      },
    ]),
  )

  tell({
    type: 'tool-invocation',
    toolInvocation: {
      toolCallId: CALL,
      toolName: 'submit_plan',
      state: 'output-error',
      args: PLAN_ARGS,
    },
  })
  await within(card).findByText('Este plano foi fechado.')
})

test('o plano recusado permanece como recusado após a resposta do Builder', async () => {
  const { tell } = await turn(PLAN_PART)
  const card = await screen.findByRole('region', { name: 'Plano: App de encomendas' })
  fireEvent.click(within(card).getByRole('button', { name: 'Pedir ajustes' }))
  const reason = within(card).getByRole('textbox', { name: 'O que mudar no plano' })
  fireEvent.change(reason, { target: { value: 'Adicione filtro por data' } })
  fireEvent.click(within(card).getByRole('button', { name: 'Pedir ajustes' }))
  tell({
    type: 'tool-invocation',
    toolInvocation: {
      toolCallId: CALL,
      toolName: 'submit_plan',
      state: 'result',
      args: PLAN_ARGS,
      result: {
        content: 'Plan was not approved. The user wants revisions.',
        submittedPlan: {
          title: 'App de encomendas',
          plan: 'Uma tela de encomendas.',
          action: 'rejected',
          feedback: 'Adicione filtro por data',
        },
      },
    },
  })
  await within(card).findByText('Este plano foi substituído.')
  expect(within(card).getByText('Uma tela de encomendas.')).toBeTruthy()
  expect(within(card).queryByRole('button', { name: 'Aprovar e construir' })).toBeNull()
})

test('o plano aprovado diz que foi aprovado (Critério 12)', async () => {
  const { tell } = await turn(PLAN_PART)
  const card = await screen.findByRole('region', { name: 'Plano: App de encomendas' })
  tell({
    type: 'tool-invocation',
    toolInvocation: {
      toolCallId: CALL,
      toolName: 'submit_plan',
      state: 'result',
      args: PLAN_ARGS,
      result: { action: 'approved' },
    },
  })
  await within(card).findByText('Plano aprovado.')
  expect(within(card).queryByRole('button', { name: 'Aprovar e construir' })).toBeNull()
})
test('no celular, o cartão aberto diz que o Builder espera a pessoa, e a linha de trabalho some', () =>
  onPhone(async () => {
    await turn(questionPart('approval-requested'))
    expect((await screen.findByRole('status')).textContent).toBe('Builder esperando sua resposta')
  }))
