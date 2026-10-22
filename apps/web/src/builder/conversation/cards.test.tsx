import type { MessagePart, Question } from '@conexus/hub-api'
import { ToolCallId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { afterEach, expect, test } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS, refusal } from '../../platform/test-hub.tsx'
import { builderSaid, conversationOf, FIRST, say, screens } from './test-hub.tsx'

const server = hubServer()
const { openConversation } = screens(server)
const CALL = ToolCallId.parse('call-1')
const ANSWER = `*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/conversations/${FIRST}/questions/${CALL}`

/** The bodies the Hub received for the card, and the reply each gets: 202 unless `reply` says. */
function answering(reply: () => Promise<Response | undefined> = async () => undefined) {
  const bodies: unknown[] = []
  server.use(
    http.post(ANSWER, async ({ request }) => {
      bodies.push(await request.json())
      return (await reply()) ?? new HttpResponse(null, { status: 202 })
    }),
  )
  return bodies
}

/** A turn in progress whose parts the test says, on the conversation's line. */
async function turn(...parts: MessagePart[]) {
  const opened = await openConversation(conversationOf({ id: FIRST }))
  say(opened.field, 'Crie um app de encomendas')
  const line = opened.lines[0]
  line?.emit({
    type: 'turn',
    message: { ...builderSaid(''), parts: [] },
    startedAt: new Date().toISOString(),
  })
  function tell(...more: MessagePart[]) {
    for (const part of more) line?.emit({ type: 'part', part })
  }
  tell(...parts)
  return { tell, log: screen.getByRole('log', { name: 'Conversa com o Builder' }) }
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

function question(state: 'open' | 'expired' | 'closed' = 'open'): MessagePart {
  return { type: 'question', toolCallId: CALL, questions: [WHO, STATE], state }
}

test('o cartão de perguntas: uma por vez, a recomendada escolhida, outra resposta digitada, "Enviando…" e o envio (21)', async () => {
  const held = Promise.withResolvers<undefined>()
  const bodies = answering(() => held.promise)
  const { tell } = await turn(question())
  const first = await screen.findByRole('radio', { name: 'Todos (recomendado)' })
  expect(first).toHaveProperty('checked', true)
  fireEvent.click(screen.getByRole('radio', { name: 'Só eu' }))
  fireEvent.click(screen.getByRole('button', { name: 'Próxima' }))
  const other = await screen.findByRole('textbox', { name: 'Outra resposta' })
  expect(other.getAttribute('placeholder')).toBe('outra resposta…')
  fireEvent.change(other, { target: { value: 'Só quando for entrega' } })
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
  const sending = await screen.findByRole('button', { name: 'Enviando…' })
  expect(sending).toHaveProperty('disabled', true)
  held.resolve(undefined)
  await waitFor(() => expect(bodies).toHaveLength(1))
  expect(bodies[0]).toEqual({ kind: 'answers', answers: ['Só eu', 'Só quando for entrega'] })
  const answers = ['Só eu', ['Sim', 'Só quando for entrega']]
  tell({ type: 'question', toolCallId: CALL, questions: [WHO, STATE], state: 'answered', answers })
  await waitFor(() => expect(screen.queryByRole('radio')).toBeNull())
  const asked = screen.getByText('Quem cadastra as encomendas?').closest('ul')
  expect([...(asked?.children ?? [])].map((item) => item.textContent)).toEqual([
    'Quem cadastra as encomendas?Só eu',
    'Uma encomenda tem situação?Sim, Só quando for entrega',
  ])
})

test('dois cliques em Enviar mandam a resposta uma vez', async () => {
  const held = Promise.withResolvers<undefined>()
  const bodies = answering(() => held.promise)
  await turn({ type: 'question', toolCallId: CALL, questions: [WHO], state: 'open' })
  const send = await screen.findByRole('button', { name: 'Enviar' })
  fireEvent.click(send)
  fireEvent.click(send)
  await screen.findByRole('button', { name: 'Enviando…' })
  held.resolve(undefined)
  await waitFor(() => expect(bodies).toHaveLength(1))
  await new Promise((settled) => setTimeout(settled, 50))
  expect(bodies).toHaveLength(1)
  expect(screen.queryByText(/Esta pergunta já foi respondida/)).toBeNull()
})

test('com uma pergunta aberta, a linha diz que o Builder espera a pessoa, sem relógio', async () => {
  const { tell } = await turn({
    type: 'question',
    toolCallId: CALL,
    questions: [WHO],
    state: 'open',
  })
  await waitFor(() =>
    expect(screen.getByRole('status').textContent).toBe('Builder esperando sua resposta.'),
  )
  tell({
    type: 'question',
    toolCallId: CALL,
    questions: [WHO],
    state: 'answered',
    answers: ['Só eu'],
  })
  await waitFor(() =>
    expect(screen.getByRole('status').textContent).toMatch(/^Builder trabalhando · há /),
  )
})

test('o cartão de perguntas que falha: sem resposta do Hub, a frase do cartão; recusado, a da tabela', async () => {
  let refused = false
  answering(async () => (refused ? refusal('QUESTION_CLOSED') : HttpResponse.error()))
  await turn({ type: 'question', toolCallId: CALL, questions: [WHO], state: 'open' })
  fireEvent.click(await screen.findByRole('button', { name: 'Enviar' }))
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Não foi possível enviar. Tente de novo.',
  )
  refused = true
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
  await screen.findByText(/Esta pergunta já foi respondida ou não espera mais/)
})

test('a pergunta vencida diz que expirou e não se responde', async () => {
  await turn(question('expired'))
  await screen.findByText('Esta pergunta expirou.')
  expect(screen.queryByRole('button', { name: 'Enviar' })).toBeNull()
})

test('o cartão da versão: montou; não montou e as palavras de APP_CHECK_FAILED; sem conferência e as de CHECK_PLATFORM_FAILED; parada antes da conferência, sem conferência e sem palavras de falha', async () => {
  const version = { type: 'version', changed: true, files: 7, changedFiles: 2 } as const
  const { tell, log } = await turn({ ...version, number: 1, check: { state: 'passed' } })
  await within(log).findByText('Versão 1 guardada, montou: 7 arquivos.')
  tell({ ...version, number: 2, check: { state: 'failed', code: 'APP_CHECK_FAILED' } })
  const failed = await within(log).findByText(
    /^Versão 2 guardada, não montou: 2 arquivos mudados\./,
  )
  expect(failed.textContent).toBe(
    'Versão 2 guardada, não montou: 2 arquivos mudados.O app não passou na conferência depois de 4 tentativas. O código ficou guardado. Peça ao Builder para corrigir.',
  )
  tell({ ...version, number: 3, check: { state: 'unchecked', code: 'CHECK_PLATFORM_FAILED' } })
  const unchecked = await within(log).findByText(/^Versão 3 guardada, sem conferência:/)
  expect(unchecked.textContent).toBe(
    'Versão 3 guardada, sem conferência: 2 arquivos mudados.Não consegui conferir o app. O código ficou guardado sem conferência. Peça de novo ao Builder.',
  )
  tell({ ...version, number: 4 })
  const stopped = await within(log).findByText(/^Versão 4 guardada, sem conferência:/)
  expect(stopped.textContent).toBe('Versão 4 guardada, sem conferência: 2 arquivos mudados.')
})

// jsdom lays nothing out: the plan's text says it is taller than its box when the test says so.
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

const PLAN = {
  type: 'plan',
  toolCallId: CALL,
  title: 'App de encomendas',
  plan: '## Para a pessoa\n\nUma tela de encomendas.',
  state: 'open',
} as const

test('o plano que cabe: sem "Ler plano completo"; Pedir ajustes abre o campo do motivo e o envia; substituído, diz', async () => {
  const bodies = answering()
  const { tell } = await turn(PLAN)
  const card = await screen.findByRole('region', { name: 'Plano: App de encomendas' })
  expect(within(card).getByText('Uma tela de encomendas.')).toBeTruthy()
  expect(within(card).queryByRole('button', { name: 'Ler plano completo' })).toBeNull()
  fireEvent.click(within(card).getByRole('button', { name: 'Pedir ajustes' }))
  const reason = within(card).getByRole('textbox', { name: 'O que mudar no plano' })
  expect(document.activeElement).toBe(reason)
  fireEvent.change(reason, { target: { value: 'Inclua o telefone' } })
  fireEvent.click(within(card).getByRole('button', { name: 'Pedir ajustes' }))
  await waitFor(() =>
    expect(bodies).toEqual([{ kind: 'plan', action: 'rejected', feedback: 'Inclua o telefone' }]),
  )
  tell({ ...PLAN, state: 'rejected' })
  await within(card).findByText('Este plano foi substituído.')
  expect(within(card).queryByRole('button', { name: 'Aprovar e construir' })).toBeNull()
})

test('o plano aprovado diz que foi aprovado; o fechado por Parar ou por uma mensagem, que foi fechado', async () => {
  const { tell } = await turn(PLAN)
  const card = await screen.findByRole('region', { name: 'Plano: App de encomendas' })
  tell({ ...PLAN, state: 'approved' })
  await within(card).findByText('Plano aprovado.')
  tell({ ...PLAN, state: 'closed' })
  await within(card).findByText('Este plano foi fechado.')
  expect(within(card).queryByRole('button', { name: 'Aprovar e construir' })).toBeNull()
})

test('o plano longo: cortado, "Ler plano completo" abre o plano inteiro com os dois botões, e aprova (34)', async () => {
  planHeight = 900
  const bodies = answering()
  await turn(PLAN)
  const card = await screen.findByRole('region', { name: 'Plano: App de encomendas' })
  fireEvent.click(await within(card).findByRole('button', { name: 'Ler plano completo' }))
  const dialog = await screen.findByRole('dialog', { name: 'Plano: App de encomendas' })
  expect(within(dialog).getByText('Uma tela de encomendas.')).toBeTruthy()
  expect(within(dialog).getByRole('button', { name: 'Pedir ajustes' })).toBeTruthy()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Aprovar e construir' }))
  await waitFor(() => expect(bodies).toEqual([{ kind: 'plan', action: 'approved' }]))
})

test('a lista de tarefas: a em andamento diz o que faz, a concluída é marcada; sem tarefas, nada', async () => {
  const { tell } = await turn({ type: 'tasks', items: [] })
  const items = [
    { id: '1', content: 'Montar a tabela', activeForm: 'Montando a tabela', status: 'completed' },
    { id: '2', content: 'Fazer a tela', activeForm: 'Fazendo a tela', status: 'in_progress' },
    { id: '3', content: 'Conferir', activeForm: 'Conferindo', status: 'pending' },
  ] as const
  expect(screen.queryByText('Conferir')).toBeNull()
  tell({ type: 'tasks', items: [...items] })
  const list = (await screen.findByText('Conferir')).closest('ul')
  expect([...(list?.children ?? [])].map((item) => item.textContent)).toEqual([
    'Montar a tabelaconcluída',
    'Fazendo a telaem andamento',
    'Conferir',
  ])
})
