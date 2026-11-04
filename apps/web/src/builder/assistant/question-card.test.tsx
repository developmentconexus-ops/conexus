import { ASSISTANT_CONTROLLER, BUILDER_ROUTES } from '@conexus/hub-api'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { displayOf, parkedOf } from '../conversation/test-stream.tsx'
import {
  ASKED,
  assistantConversation,
  assistantScreens,
  COMPANY_ROOT,
  PEDIDOS_ID,
  toolSaid,
} from './test-hub.tsx'

// The Assistant asks by card (24.3 conversation tools): the card is the same screen as the Builder's, answered through the Assistant's own session.
const server = hubServer()
const { at } = assistantScreens(server)
const QUESTION = {
  question: 'Qual destas ideias?',
  options: [{ label: 'Um agente de vendas' }, { label: 'Conferir as metas' }],
  multiSelect: false,
}

test.each([
  ['no Início', `${COMPANY_ROOT}/conversations/${ASKED}`, null],
  ['num Projeto', `${COMPANY_ROOT}/projects/${PEDIDOS_ID}/assistant/${ASKED}`, PEDIDOS_ID],
])(
  'uma pergunta aberta %s vira cartão e a resposta vai para a sessão do Assistente, nunca para a do Builder',
  async (_place, path, projectId) => {
    const sent: string[] = []
    server.use(
      http.post(
        `*${BUILDER_ROUTES}/agent-controller/:controller/sessions/:id/tool-suspension`,
        ({ params }) => {
          sent.push(String(params.controller))
          return HttpResponse.json({ ok: true })
        },
      ),
    )
    const asked = toolSaid('ask_user', { questions: [QUESTION] }, undefined)
    for (const part of asked.content.parts) {
      if (part.type === 'tool-invocation') part.toolInvocation.state = 'call'
    }
    const hub = at(path, {
      conversations: [assistantConversation({ projectId, messages: [asked] })],
    })
    await screen.findByRole('textbox', { name: 'Mensagem para o Assistente' })
    await waitFor(() => expect(hub.stream()).toBeDefined())
    hub.stream()?.emit(
      displayOf({
        pendingSuspensions: parkedOf({
          toolCallId: 'call-tool-1',
          toolName: 'ask_user',
          args: { questions: [QUESTION] },
        }),
      }),
    )

    fireEvent.click(await screen.findByRole('radio', { name: 'Conferir as metas' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Enviar' }))

    await waitFor(() => expect(sent).toEqual([ASSISTANT_CONTROLLER]))
  },
)
