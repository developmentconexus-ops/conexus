import type { MessagePart, Question } from '@conexus/hub-api'
import { PackageName, ToolCallId } from '@conexus/hub-api'
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
  kind: 'choice',
  question: 'Quem cadastra as encomendas?',
  options: [{ label: 'Todos (recomendado)' }, { label: 'Só eu' }],
  multiSelect: false,
}
const STATE: Question = {
  kind: 'choice',
  question: 'Uma encomenda tem situação?',
  options: [{ label: 'Sim' }],
  multiSelect: false,
}

function question(state: 'open' | 'answered' | 'expired' | 'closed' = 'open'): MessagePart {
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
  tell(question('answered'))
  await waitFor(() => expect(screen.queryByRole('radio')).toBeNull())
  expect(screen.getByText('Quem cadastra as encomendas?')).toBeTruthy()
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

test('o cartão de biblioteca: o nome e a versão, Permitir (recomendado) escolhido, e o envio', async () => {
  const bodies = answering()
  await turn({
    type: 'question',
    toolCallId: CALL,
    questions: [
      {
        kind: 'library',
        question: 'Preciso da biblioteca react-big-calendar (≈ 300 KB). Permitir?',
        name: PackageName.parse('react-big-calendar'),
        version: '1.19.4',
      },
    ],
    state: 'open',
  })
  await screen.findByText('react-big-calendar@1.19.4')
  expect(screen.getByRole('radio', { name: 'Permitir (recomendado)' })).toHaveProperty(
    'checked',
    true,
  )
  expect(screen.getByRole('radio', { name: 'Não, faça sem ela' })).toBeTruthy()
  expect(screen.queryByRole('textbox', { name: 'Outra resposta' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))
  await waitFor(() => expect(bodies).toEqual([{ kind: 'answers', answers: ['Permitir'] }]))
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
