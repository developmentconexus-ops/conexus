import { BUILDER_ROUTES, CONSTRUTOR_CONTROLLER } from '@conexus/hub-api'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { SANKHYA, toolSaid } from '../assistant/test-hub.tsx'
import { AGENT_START } from '../conversation/test-events.ts'
import { onPhone } from '../conversation/test-hub.tsx'
import { recordedEvent, TaskUpdated } from '../conversation/test-recorded.ts'
import { displayOf, parkedOf } from '../conversation/test-stream.tsx'
import { AREA, BUILDER_CHAT } from './test-agents.ts'
import { agentScreens } from './test-hub.tsx'

const server = hubServer()
const { at } = agentScreens(server)
const QUESTION = {
  question: 'Qual destas ideias?',
  options: [{ label: 'Um agente de vendas' }, { label: 'Conferir as metas' }],
  multiSelect: false,
}
const SESSIONS = `*${BUILDER_ROUTES}/agent-controller`

function asked(result?: unknown) {
  const message = toolSaid('ask_user', { questions: [QUESTION] }, result)
  for (const part of message.content.parts) {
    if (part.type === 'tool-invocation' && result === undefined) part.toolInvocation.state = 'call'
  }
  return message
}

function stored(result?: unknown) {
  server.use(
    http.get('*/api/companies/:companyId/connections', () =>
      HttpResponse.json({ connectors: [SANKHYA], connections: [], mayManage: false }),
    ),
    http.get(`${SESSIONS}/${CONSTRUTOR_CONTROLLER}/sessions/:id/threads/:t/messages`, () =>
      HttpResponse.json({
        messages: [asked(result)],
      }),
    ),
  )
}

function open() {
  return at(`${AREA}/construtor/${BUILDER_CHAT}`, {
    agents: [],
    construtor: [
      {
        id: BUILDER_CHAT,
        title: 'Ideias',
        createdAt: '2026-11-04T12:51:00.000Z',
        updatedAt: '2026-11-04T12:51:00.000Z',
      },
    ],
  })
}

test('a conversa do Construtor com uma pergunta guardada abre com o cartão, não com a página de erro', async () => {
  open()
  stored({
    content: 'Answered',
    answers: ['Um agente de vendas'],
  })

  await screen.findByRole('textbox', { name: 'Mensagem para o Construtor' })
  expect(screen.queryByText('Não foi possível abrir esta página')).toBeNull()
  expect(await screen.findByRole('button', { name: 'Respondeu 1 pergunta' })).toBeTruthy()
})

/** The conversation with its question open: the stored call, parked by the stream as Mastra parks it. */
async function openAsking() {
  const opened = open()
  stored()
  await screen.findByRole('textbox', { name: 'Mensagem para o Construtor' })
  const asking = {
    toolCallId: 'call-tool-1',
    toolName: 'ask_user',
    args: { questions: [QUESTION] },
  }
  await waitFor(() => expect(opened.lines.length).toBeGreaterThan(0))
  opened.lines.at(-1)?.emit(displayOf({ pendingSuspensions: parkedOf(asking) }))
}

test('responder o cartão do Construtor vai para a sessão do Construtor, nunca para a do Builder', async () => {
  const sent: string[] = []
  server.use(
    http.post(`${SESSIONS}/:controller/sessions/:id/tool-suspension`, ({ params }) => {
      sent.push(String(params.controller))
      return HttpResponse.json({ ok: true })
    }),
  )
  await openAsking()

  fireEvent.click(await screen.findByRole('radio', { name: 'Conferir as metas' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Enviar' }))

  await waitFor(() => expect(sent).toEqual([CONSTRUTOR_CONTROLLER]))
})

test('no celular, a pergunta aberta diz que o Construtor espera, não o Builder', async () => {
  await onPhone(async () => {
    await openAsking()
    expect((await screen.findByRole('status')).textContent).toBe(
      'Construtor esperando sua resposta',
    )
  })
})

test('uma pergunta que a pessoa parou diz "Você parou o Construtor."', async () => {
  open()
  stored('Aborted by the user')
  fireEvent.click(await screen.findByRole('button', { name: /sem resposta/ }))
  expect(await screen.findByText('Você parou o Construtor.')).toBeTruthy()
})

test('a conversa do Construtor que recebe tarefas mostra o painel de tarefas', async () => {
  const opened = open()
  stored()
  await screen.findByRole('textbox', { name: 'Mensagem para o Construtor' })
  await waitFor(() => expect(opened.lines.length).toBeGreaterThan(0))
  const line = opened.lines.at(-1)
  line?.emit(AGENT_START)
  line?.emit(recordedEvent('tasks', TaskUpdated, (event) => event.tasks.length === 3))
  expect(await screen.findByRole('region', { name: 'Painel de tarefas' })).toBeTruthy()
})
