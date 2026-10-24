import type { MastraPart, Question } from '@conexus/hub-api'
import { MessageId, QuestionAnswer, ToolCallId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS } from '../../platform/test-hub.tsx'
import { builderSaid, conversationOf, FIRST, say, screens } from './test-hub.tsx'

const server = hubServer()
const { openConversation } = screens(server)
const CALL = ToolCallId.parse('call-1')
const ANSWER = `*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/conversations/${FIRST}/questions/${CALL}`
const BUILDER_MSG_ID = MessageId.parse('builder-msg-1')
const STEP_MSG_ID = MessageId.parse('builder-step-1')

function answering(reply: () => Promise<Response | undefined> = async () => undefined) {
  const bodies: unknown[] = []
  server.use(
    http.post(ANSWER, async ({ request }) => {
      const parsed = QuestionAnswer.parse(await request.json())
      bodies.push(parsed)
      return (await reply()) ?? new HttpResponse(null, { status: 202 })
    }),
  )
  return bodies
}

async function turn(...parts: MastraPart[]) {
  const opened = await openConversation(conversationOf({ id: FIRST }))
  say(opened.field, 'Crie um app de encomendas')
  const line = opened.lines[0]
  line?.emit({
    type: 'turn',
    messages: [{ ...builderSaid(''), id: BUILDER_MSG_ID, parts: [] }],
    startedAt: new Date().toISOString(),
  })
  line?.emit({
    type: 'message_start',
    message: { ...builderSaid(''), id: STEP_MSG_ID, parts: [] },
  })
  function tell(...more: MastraPart[]) {
    for (const [index, part] of more.entries()) {
      line?.emit({
        type: 'message_update',
        id: STEP_MSG_ID,
        event: { type: 'part', index, part },
      })
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
  // Multiline free response (#272)
  const multilineText = 'Linha 1: só quando for entrega\nLinha 2: após as 18h'
  fireEvent.change(other, { target: { value: multilineText } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

  const sending = await screen.findByRole('button', { name: 'Enviando…' })
  expect(sending).toHaveProperty('disabled', true)
  held.resolve(undefined)

  await waitFor(() => expect(bodies).toHaveLength(1))
  expect(bodies[0]).toEqual({ kind: 'answers', answers: ['Só eu', multilineText] })

  const answers = ['Só eu', multilineText]
  tell(questionPart('result', answers))

  await waitFor(() => expect(screen.queryByRole('radio')).toBeNull())
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
  const send = await screen.findByRole('button', { name: 'Enviar' })
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
  await turn({
    type: 'tool-invocation',
    toolInvocation: {
      toolCallId: CALL,
      toolName: 'ask_user',
      state: 'output-error',
      args: { questions: [WHO] },
    },
  })
  await screen.findByText(/Esta pergunta já foi respondida ou não espera mais/)
  expect(screen.queryByRole('button', { name: 'Enviar' })).toBeNull()
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
      { kind: 'plan', action: 'rejected', feedback: 'Adicione filtro por data' },
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
