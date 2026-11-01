import type { AssistantConversation, SessionConnection } from '@conexus/hub-api'
import {
  ASSISTANT_CONTROLLER,
  ATTEMPT_KEY_HEADER,
  BUILDER_ROUTES,
  ConnectionId,
  ConversationId,
  ProjectId,
} from '@conexus/hub-api'
import { HttpResponse, http } from 'msw'
import type { setupServer } from 'msw/node'
import { afterEach } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { PEDIDOS, refusal } from '../../platform/test-hub.tsx'
import type { Stored } from '../conversation/messages.ts'
import { screens, view } from '../conversation/test-hub.tsx'
import { START } from '../conversation/test-start.tsx'
import { displayOf, newest, openLine } from '../conversation/test-stream.tsx'

export const SALES = ConnectionId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
export const STOCK = ConnectionId.parse('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')
export const ASKED = ConversationId.parse('33333333-3333-4333-8333-333333333333')
export const ELSEWHERE = ConversationId.parse('44444444-4444-4444-8444-444444444444')
export const PEDIDOS_ID = PEDIDOS.id
export const COMPANY_ROOT = `/companies/${COMPANY.id}`
const ASSISTANT_SESSION = `*${BUILDER_ROUTES}/agent-controller/${ASSISTANT_CONTROLLER}/sessions/:id`

const OFFERED: SessionConnection[] = [
  { connectionId: SALES, connector: 'sankhya', name: 'Vendas', chosen: true },
  { connectionId: STOCK, connector: 'sankhya', name: 'Estoque', chosen: true },
]

export function assistantConversation(
  fields: Partial<AssistantConversation> & { messages?: Stored[] } = {},
) {
  const { messages = [], ...rest } = fields
  const conversation: AssistantConversation = {
    id: ASKED,
    title: 'Vendas da semana',
    updatedAt: '2026-10-19T12:00:00.000Z',
    projectId: null,
    connections: OFFERED,
    ...rest,
  }
  return { conversation, messages }
}

type Opened = ReturnType<typeof assistantConversation>
export type Answers = {
  /** What a write of the chosen connections answers instead of the Hub's success. */
  choose?: () => Response | undefined
}

/** A tool call of the Assistant as Mastra stores it, answered. */
export function toolSaid(toolName: string, args: unknown, result: unknown, id = 'tool-1'): Stored {
  return {
    id,
    role: 'assistant',
    createdAt: '2026-10-19T12:02:00.000Z',
    content: {
      parts: [
        {
          type: 'tool-invocation',
          toolInvocation: { state: 'result', toolCallId: `call-${id}`, toolName, args, result },
        },
      ],
      metadata: { provider: 'anthropic', modelId: 'claude-sonnet-4' },
    },
  }
}

type Sent = { method: string; path: string; body: unknown; key: string | null }
type Held = { conversations: Opened[]; offered: SessionConnection[]; answers: Answers }

function chosenOf(body: unknown): ConnectionId[] {
  return typeof body === 'object' && body !== null && 'connections' in body
    ? ConnectionIds(body.connections)
    : []
}

const BASE = `*/api/companies/${COMPANY.id}/assistant`

const SANKHYA = {
  id: 'sankhya',
  name: 'Sankhya',
  version: '1',
  category: 'ERP',
  summary: 'ERP',
  logo: 'data:image/svg+xml,',
  auth: 'client_credentials',
  fields: [],
}

/** The Hub's reads of the Assistant's screens: the connections a place offers and the conversations. */
function readsOf(held: Held, asked: string[]) {
  return [
    http.get('*/api/companies/:companyId/connections', () =>
      HttpResponse.json({ connectors: [SANKHYA], connections: [], mayManage: false }),
    ),
    http.get(`${BASE}/connections`, ({ request }) => {
      asked.push(new URL(request.url).search)
      return HttpResponse.json({ connections: held.offered })
    }),
    http.get(`${BASE}/conversations`, ({ request }) => {
      const project = new URL(request.url).searchParams.get('projectId')
      const listed = held.conversations
        .map(({ conversation }) => conversation)
        .filter((one) => project === null || one.projectId === project)
        .map(({ id, title, updatedAt, projectId }) => ({ id, title, updatedAt, projectId }))
      return HttpResponse.json({ conversations: listed, next: { kind: 'END' } })
    }),
    http.get(`${BASE}/conversations/:id`, ({ params }) => {
      const found = held.conversations.find(({ conversation }) => conversation.id === params.id)
      if (!found) return refusal('CONVERSATION_NOT_FOUND')
      return HttpResponse.json({ conversation: found.conversation })
    }),
  ]
}

/** The Hub's writes: a conversation begun, and the connections it reads changed. */
function writesOf(held: Held, note: (request: Request) => Promise<unknown>) {
  return [
    http.post(`${BASE}/conversations`, async ({ request }) => {
      const body = await note(request)
      const projectId =
        typeof body === 'object' && body !== null && 'projectId' in body
          ? ProjectId.parse(body.projectId)
          : null
      const made = assistantConversation({ projectId, title: null, connections: held.offered })
      held.conversations.unshift(made)
      return HttpResponse.json(
        { conversation: { ...made.conversation, model: 'anthropic/claude-sonnet-4' } },
        { status: 201 },
      )
    }),
    http.put(`${BASE}/conversations/:id/connections`, async ({ request, params }) => {
      const body = await note(request)
      const replaced = held.answers.choose?.()
      if (replaced) return replaced
      const found = held.conversations.find(({ conversation }) => conversation.id === params.id)
      if (!found) return refusal('CONVERSATION_NOT_FOUND')
      const chosen = chosenOf(body)
      found.conversation = {
        ...found.conversation,
        connections: found.conversation.connections.map((one) => ({
          ...one,
          chosen: chosen.includes(one.connectionId),
        })),
      }
      return HttpResponse.json({ conversation: found.conversation })
    }),
  ]
}

/** Mastra's session of the `assistant` controller: its stream, state, transcript and messages. */
function sessionOf(
  conversations: Opened[],
  lines: ReturnType<typeof openLine>['line'][],
  note: (request: Request) => Promise<unknown>,
) {
  return [
    http.get(`${ASSISTANT_SESSION}/stream`, () => {
      const { line, response } = openLine(displayOf())
      lines.push(line)
      return response
    }),
    http.get(ASSISTANT_SESSION, ({ params }) =>
      HttpResponse.json({
        controllerId: ASSISTANT_CONTROLLER,
        sessionId: params.id,
        resourceId: 'company:c1:person:p1',
        threadId: params.id,
        modeId: 'ask',
        modelId: 'anthropic/claude-sonnet-4',
        running: false,
        tasks: [],
        settings: { thinkingLevel: 'off' },
      }),
    ),
    http.get(`${ASSISTANT_SESSION}/threads/:threadId/messages`, ({ params, request }) => {
      const found = conversations.find(({ conversation }) => conversation.id === params.threadId)
      return HttpResponse.json({ messages: newest(found?.messages ?? [], request) })
    }),
    http.post(`${ASSISTANT_SESSION}/messages`, async ({ request }) => {
      await note(request)
      return HttpResponse.json({ ok: true })
    }),
  ]
}

/** The Assistant's screens on `server`: the Hub's assistant routes and Mastra's session of the `assistant` controller. */
export function assistantScreens(server: ReturnType<typeof setupServer>) {
  const { open } = screens(server)
  const lines: ReturnType<typeof openLine>['line'][] = []
  afterEach(() => {
    for (const line of lines.splice(0)) line.close()
  })

  function at(
    path: string,
    options: {
      conversations?: Opened[]
      offered?: SessionConnection[]
      role?: string
      answers?: Answers
    } = {},
  ) {
    const { conversations = [], offered = OFFERED, role, answers = {} } = options
    const sent: Sent[] = []
    const asked: string[] = []
    async function note(request: Request) {
      const text = await request.text()
      const body: unknown = text === '' ? undefined : JSON.parse(text)
      sent.push({
        method: request.method,
        path: new URL(request.url).pathname,
        body,
        key: request.headers.get(ATTEMPT_KEY_HEADER),
      })
      return body
    }
    const held: Held = { conversations, offered, answers }
    server.use(
      ...readsOf(held, asked),
      ...writesOf(held, note),
      ...sessionOf(conversations, lines, note),
    )
    const hub = open(view({ start: START, role }), path)
    return { ...hub, sent, asked, writes: () => sent.filter((one) => one.method !== 'GET') }
  }

  return { at }
}

function ConnectionIds(value: unknown): ConnectionId[] {
  return Array.isArray(value) ? value.map((one) => ConnectionId.parse(one)) : []
}
