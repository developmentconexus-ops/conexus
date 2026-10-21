import type { Conversation, ConversationEvent, Message } from '@conexus/hub-api'
import {
  ATTEMPT_KEY_HEADER,
  ConversationId,
  LAST_EVENT_ID_HEADER,
  listConversations,
  listModelAccounts,
  listModelProviders,
  MessageId,
  ModelAccount,
  ModelId,
  readConversation,
  setConversationModel,
} from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { HttpHandler } from 'msw'
import { HttpResponse, http } from 'msw'
import type { setupServer } from 'msw/node'
import { expect } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { PEDIDOS, projectsRead, refusal } from '../../platform/test-hub.tsx'

export const FIRST = ConversationId.parse('11111111-1111-4111-8111-111111111111')
export const SECOND = ConversationId.parse('22222222-2222-4222-8222-222222222222')
export const PROJECT = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}`
const BASE = `*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/conversations`
const MODEL = ModelId.parse('anthropic/claude-sonnet-4')

const PROVIDERS = [
  { id: 'anthropic', name: 'Anthropic', models: ['claude-sonnet-4', 'claude-opus-4'] },
  { id: 'google', name: 'Google', models: ['gemini-2.5-pro', 'gemini-2.5-flash'] },
  { id: 'openai', name: 'OpenAI', models: ['gpt-5'] },
].map((provider) => ({
  ...provider,
  models: provider.models.map((name) => ({
    id: `${provider.id}/${name}`,
    efforts:
      name === 'claude-sonnet-4'
        ? ['off', 'low', 'high']
        : name === 'gpt-5'
          ? ['low', 'medium', 'high']
          : name === 'gemini-2.5-flash'
            ? ['off', 'medium', 'high']
            : ['off'],
  })),
}))

/** A conversation as the Hub reads it, empty and untitled unless `fields` say otherwise. */
export function conversationOf(fields: Partial<Conversation> & { id: ConversationId }) {
  return readConversation.success.body.parse({
    conversation: {
      title: null,
      createdAt: '2026-10-19T12:00:00.000Z',
      model: MODEL,
      effort: 'off',
      messages: [],
      ...fields,
    },
  }).conversation
}

/** What the Hub holds for Ana in the Projeto Pedidos; the tests change it between reads. */
export type View = {
  conversations: Conversation[]
  /** The providers Ana has an account for: her order lists them. */
  providers: string[]
  /** The providers the Hub says Ana may use now; all of hers unless a test says otherwise. */
  usable?: string[]
}

type Sent = { method: string; path: string; body: unknown; attemptKey: string | null }

/** A stream the Hub holds open for a test to speak on. */
type Line = {
  /** Says `event` with `id`, or with the next of the line's own ids. */
  emit: (event: ConversationEvent, id?: string) => void
  /** Writes `text` as it is, such as a `data:` line that is not JSON. */
  write: (text: string) => void
  close: () => void
}

function accountOf(provider: string, index: number): ModelAccount {
  return ModelAccount.parse({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    owner: 'me',
    kind: 'api_key',
    provider,
    label: `Conta ${provider}`,
    position: 0,
    state: 'ready',
    kindOff: false,
    hint: 'x7Qa',
    linkedBy: ANA.name,
    limitedUntil: null,
    linkedAt: '2026-10-19T12:00:00.000Z',
    assignees: [],
    revision: 0,
  })
}

function accountsRead(view: View): HttpHandler[] {
  return [
    http.get(`*/api/companies/${COMPANY.id}/model-accounts`, () => {
      const mine = view.providers.map(accountOf)
      return HttpResponse.json(
        listModelAccounts.success.body.parse({
          company: [],
          mine,
          order: mine.map((one) => ({ provider: one.provider, accounts: [one.id] })),
          kinds: [],
          defaults: { company: { model: MODEL, effort: 'off' }, mine: null, start: null },
          connected: { mine: view.providers, company: [] },
          fallback: { enabled: false, chain: [], revision: 0 },
          usableProviders: view.usable ?? view.providers,
          mayManage: false,
        }),
      )
    }),
    http.get('*/api/model-providers', () =>
      HttpResponse.json(listModelProviders.success.body.parse({ providers: PROVIDERS })),
    ),
  ]
}

function openLine(name: string): { line: Line; response: Response } {
  const encoder = new TextEncoder()
  let said = 0
  let sink: ReadableStreamDefaultController<Uint8Array> | undefined
  const body = new ReadableStream<Uint8Array>({
    // The Hub writes a comment as it opens the stream (`platform/event-stream.ts`).
    start(controller) {
      sink = controller
      controller.enqueue(encoder.encode(': \n\n'))
    },
  })
  function write(text: string) {
    try {
      sink?.enqueue(encoder.encode(text))
    } catch {
      // The browser closed the line first.
    }
  }
  const line: Line = {
    emit: (event, id) => {
      said += 1
      write(`id: ${id ?? `${name}.${said}`}\ndata: ${JSON.stringify(event)}\n\n`)
    },
    write,
    close: () => {
      try {
        sink?.close()
      } catch {
        // Closed already.
      }
    },
  }
  return {
    line,
    response: new HttpResponse(body, { headers: { 'content-type': 'text/event-stream' } }),
  }
}

function writesOf(view: View, sent: Sent[], answers: Answers): HttpHandler[] {
  async function note(request: Request) {
    const text = await request.text()
    const body: unknown = text === '' ? undefined : JSON.parse(text)
    sent.push({
      method: request.method,
      path: new URL(request.url).pathname,
      body,
      attemptKey: request.headers.get(ATTEMPT_KEY_HEADER),
    })
    return body
  }
  return [
    http.post(BASE, async ({ request }) => {
      await note(request)
      const replaced = await answers.create?.()
      if (replaced) return replaced
      const conversation = conversationOf({ id: SECOND })
      view.conversations.unshift(conversation)
      return HttpResponse.json({ conversation }, { status: 201 })
    }),
    http.post(`${BASE}/:id/messages`, async ({ request, params }) => {
      const body = await note(request)
      const replaced = await answers.message?.()
      if (replaced) return replaced
      const conversation = view.conversations.find((one) => one.id === params.id)
      if (!conversation) return refusal('CONVERSATION_NOT_FOUND')
      const text =
        typeof body === 'object' && body !== null && 'content' in body ? String(body.content) : ''
      conversation.messages.push({
        id: MessageId.parse(`person-${conversation.messages.length}`),
        role: 'person',
        parts: [{ type: 'text', text }],
        model: null,
        createdAt: '2026-10-19T12:01:00.000Z',
      })
      return new HttpResponse(null, { status: 202 })
    }),
    http.post(`${BASE}/:id/stop`, async ({ request }) => {
      await note(request)
      return new HttpResponse(null, { status: 204 })
    }),
    http.put(`${BASE}/:id/model`, async ({ request, params }) => {
      const body = await note(request)
      const replaced = await answers.model?.()
      if (replaced) return replaced
      const model =
        typeof body === 'object' && body !== null && 'model' in body
          ? ModelId.parse(body.model)
          : MODEL
      const { effort } = setConversationModel.input.body.parse(body)
      view.conversations = view.conversations.map((one) =>
        one.id === params.id ? { ...one, model, effort } : one,
      )
      return HttpResponse.json({ model, effort })
    }),
  ]
}

/** A reply that replaces the Hub's usual answer to a write. */
export type Answers = Partial<
  Record<
    'create' | 'message' | 'model' | 'events',
    () => Response | undefined | Promise<Response | undefined>
  >
>

/**
 * The Hub as Ana sees Pedidos' conversations. `lines` holds every stream the browser opened, in
 * order, for the test to speak on, and `resumedFrom` the `Last-Event-ID` each was opened with;
 * `sent` lists the writes the Hub received.
 */
function conversationHub(view: View, answers: Answers = {}) {
  const sent: Sent[] = []
  const lines: Line[] = []
  const resumedFrom: Array<string | null> = []
  const reads: number[] = []
  return {
    sent,
    lines,
    resumedFrom,
    reads,
    handlers: [
      ...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: true }),
      ...accountsRead(view),
      http.get(BASE, () =>
        HttpResponse.json(
          listConversations.success.body.parse({
            conversations: view.conversations.map(({ id, title, createdAt }) => ({
              id,
              title,
              createdAt,
            })),
            next: { kind: 'END' },
          }),
        ),
      ),
      http.get(`${BASE}/:id/events`, async ({ request }) => {
        const replaced = await answers.events?.()
        if (replaced) return replaced
        const { line, response } = openLine(`line-${lines.length}`)
        lines.push(line)
        resumedFrom.push(request.headers.get(LAST_EVENT_ID_HEADER))
        return response
      }),
      http.get(`${BASE}/:id`, ({ params }) => {
        const conversation = view.conversations.find((one) => one.id === params.id)
        if (!conversation) return refusal('CONVERSATION_NOT_FOUND')
        reads.push(Date.now())
        return HttpResponse.json({ conversation })
      }),
      ...writesOf(view, sent, answers),
    ],
  }
}

/** Opens a select of the UI by its trigger and picks the option named `name`. */
export async function choose(trigger: HTMLElement, name: string) {
  fireEvent.click(trigger)
  const option = await screen.findByRole('option', { name })
  fireEvent.pointerDown(option)
  fireEvent.mouseDown(option)
  fireEvent.pointerUp(option)
  fireEvent.mouseUp(option)
  fireEvent.click(option)
}

export function view(fields: Partial<View> = {}): View {
  return { conversations: [], providers: ['anthropic', 'google'], ...fields }
}

export function builderSaid(text: string): Message {
  return {
    id: MessageId.parse('builder-1'),
    role: 'builder',
    parts: [{ type: 'text', text }],
    model: MODEL,
    createdAt: '2026-10-19T12:02:00.000Z',
  }
}

export function typed(field: HTMLElement): string {
  return field instanceof HTMLTextAreaElement ? field.value : ''
}

export function say(field: HTMLElement, text: string) {
  fireEvent.change(field, { target: { value: text } })
  fireEvent.keyDown(field, { key: 'Enter' })
}

/** The Conexus open at `path`, over the Hub `shown` describes, through the test's `server`. */
export function screens(server: ReturnType<typeof setupServer>) {
  function open(shown: View, path: string, answers: Answers = {}) {
    const hub = conversationHub(shown, answers)
    server.use(...hub.handlers)
    const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
    render(<Conexus conexus={conexus} />)
    return { ...hub, conexus }
  }

  /** The conversation, open, with its stream connected: the field is there and the line is ours. */
  async function openConversation(
    conversation: Conversation,
    shown = view(),
    answers: Answers = {},
  ) {
    shown.conversations = [conversation]
    const hub = open(shown, `${PROJECT}/conversations/${conversation.id}`, answers)
    const field = await screen.findByRole('textbox', { name: 'Mensagem para o Builder' })
    await waitFor(() => expect(hub.lines.length).toBe(1))
    return { ...hub, field, shown }
  }

  return { open, openConversation }
}
