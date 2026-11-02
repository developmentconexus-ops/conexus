import type { ConversationStart, ConversationSummary, Effort, Task } from '@conexus/hub-api'
import {
  ATTEMPT_KEY_HEADER,
  BUILDER_CONTROLLER,
  BUILDER_ROUTES,
  ConversationId,
  listConversations,
  listModelAccounts,
  listModelProviders,
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
import { afterEach, expect, vi } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { PEDIDOS, projectsRead, refusal } from '../../platform/test-hub.tsx'
import type { Stored } from './messages.ts'
import { PROVIDERS } from './test-providers.ts'
import type { Line } from './test-stream.tsx'
import { displayOf, newest, openLine, personSent } from './test-stream.tsx'

export const FIRST = ConversationId.parse('11111111-1111-4111-8111-111111111111')
export const SECOND = ConversationId.parse('22222222-2222-4222-8222-222222222222')
export const PROJECT = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}`
const BASE = `*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}/conversations`
const SESSION = `*${BUILDER_ROUTES}/agent-controller/${BUILDER_CONTROLLER}/sessions/:id`
const MODEL = ModelId.parse('anthropic/claude-sonnet-4')
const COMPANY_DEFAULT = { model: MODEL, effort: 'off' }

/** A conversation as the fake Hub keeps it: the Hub's read, Mastra's session state and its transcript. */
export type Opened = ConversationSummary & {
  model: ModelId
  effort: Effort
  tasks: Task[]
  messages: Stored[]
}

export function conversationOf(fields: Partial<Opened> & { id: ConversationId }): Opened {
  const { messages = [], model = MODEL, effort = 'off', tasks = [], ...read } = fields
  const { conversation } = readConversation.success.body.parse({
    conversation: { title: null, createdAt: '2026-10-19T12:00:00.000Z', ...read },
  })
  return { ...conversation, model, effort, tasks, messages }
}

export type View = {
  conversations: Opened[]
  providers: string[]
  usable?: string[]
  /** What a conversation created now begins on, the box's model on Início. */
  start?: ConversationStart
  /** What the stream's first display state says, past an idle session's. */
  display?: Record<string, unknown>
  /** The person's role in the company; the owner by default. */
  role?: string
}

type Sent = { method: string; path: string; body: unknown; attemptKey: string | null }

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
      const start = view.start ?? null
      const offered = PROVIDERS.filter((one) => view.providers.includes(one.id))
      return HttpResponse.json(
        listModelAccounts.success.body.parse({
          company: [],
          mine,
          order: mine.map((one) => ({ provider: one.provider, accounts: [one.id] })),
          kinds: [],
          defaults: { company: COMPANY_DEFAULT, mine: null, start, companyStart: null },
          choices: { mine: offered, company: [] },
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
    http.post(`${SESSION}/messages`, async ({ request, params }) => {
      const body = await note(request)
      const replaced = await answers.message?.()
      if (replaced) return replaced
      const conversation = view.conversations.find((one) => one.id === params.id)
      if (!conversation) return refusal('CONVERSATION_NOT_FOUND')
      conversation.messages.push(personSent(body, `person-${conversation.messages.length}`))
      return HttpResponse.json({ ok: true })
    }),
    http.post(`${SESSION}/abort`, async ({ request }) => {
      await note(request)
      return HttpResponse.json({ ok: true })
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

export type Answers = Partial<
  Record<
    'create' | 'message' | 'model' | 'stream',
    () => Response | undefined | Promise<Response | undefined>
  >
>

function listRead(view: View) {
  return http.get(BASE, () =>
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
  )
}

function conversationHub(view: View, answers: Answers = {}) {
  const sent: Sent[] = []
  const lines: Line[] = []
  const reads: number[] = []
  const conversationReads: number[] = []
  return {
    sent,
    lines,
    /** The stream the screen follows: the last it opened (React mounts the screen twice in dev). */
    line: () => {
      const last = lines.at(-1)
      if (last === undefined) throw new Error('the screen opened no stream')
      return last
    },
    reads,
    conversationReads,
    handlers: [
      ...projectsRead({
        projects: [PEDIDOS],
        databaseReady: true,
        mayDelete: true,
        role: view.role,
      }),
      ...accountsRead(view),
      listRead(view),
      http.get(`${SESSION}/stream`, async () => {
        const replaced = await answers.stream?.()
        if (replaced) return replaced
        const { line, response } = openLine(displayOf(view.display))
        lines.push(line)
        return response
      }),
      http.get(SESSION, ({ params }) => {
        const conversation = view.conversations.find((one) => one.id === params.id)
        if (!conversation) return refusal('CONVERSATION_NOT_FOUND')
        return HttpResponse.json({
          controllerId: BUILDER_CONTROLLER,
          sessionId: conversation.id,
          resourceId: 'company:c1:person:p1',
          threadId: conversation.id,
          modeId: 'build',
          modelId: conversation.model,
          running: false,
          tasks: conversation.tasks,
          settings: { thinkingLevel: conversation.effort },
        })
      }),
      http.get(`${SESSION}/threads/:threadId/messages`, ({ params, request }) => {
        const conversation = view.conversations.find((one) => one.id === params.threadId)
        if (!conversation) return refusal('CONVERSATION_NOT_FOUND')
        reads.push(Date.now())
        return HttpResponse.json({ messages: newest(conversation.messages, request) })
      }),
      http.get(`${BASE}/:id`, ({ params }) => {
        const conversation = view.conversations.find((one) => one.id === params.id)
        if (!conversation) return refusal('CONVERSATION_NOT_FOUND')
        conversationReads.push(Date.now())
        const { id, title, createdAt } = conversation
        return HttpResponse.json(
          readConversation.success.body.parse({ conversation: { id, title, createdAt } }),
        )
      }),
      ...writesOf(view, sent, answers),
    ],
  }
}

export async function choose(trigger: HTMLElement, name: string) {
  fireEvent.click(trigger)
  const option = await screen.findByRole('option', { name })
  for (const event of ['pointerDown', 'mouseDown', 'pointerUp', 'mouseUp', 'click'] as const) {
    fireEvent[event](option)
  }
}

export function view(fields: Partial<View> = {}): View {
  return { conversations: [], providers: ['anthropic', 'google'], ...fields }
}

export function typed(field: HTMLElement): string {
  return field instanceof HTMLTextAreaElement ? field.value : ''
}

export function say(field: HTMLElement, text: string) {
  fireEvent.change(field, { target: { value: text } })
  fireEvent.keyDown(field, { key: 'Enter' })
}

export function screens(server: ReturnType<typeof setupServer>) {
  let opened: { conexus: ReturnType<typeof createConexus>; lines: Line[] } | undefined
  // A read or a stream still open when the test ends lands in the next one's fake Hub.
  afterEach(async () => {
    const last = opened
    opened = undefined
    if (!last) return
    for (const line of last.lines) line.close()
    await waitFor(() => expect(last.conexus.queryClient.isFetching()).toBe(0))
  })

  function open(shown: View, path: string, answers: Answers = {}) {
    const hub = conversationHub(shown, answers)
    server.use(...hub.handlers)
    const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
    opened = { conexus, lines: hub.lines }
    render(<Conexus conexus={conexus} />)
    return { ...hub, conexus }
  }

  async function openConversation(conversation: Opened, shown = view(), answers: Answers = {}) {
    shown.conversations = [conversation]
    const hub = open(shown, `${PROJECT}/conversations/${conversation.id}`, answers)
    const field = await screen.findByRole('textbox', { name: 'Mensagem para o Builder' })
    await waitFor(() => expect(hub.lines.length).toBe(1))
    await waitFor(() => expect(hub.reads.length).toBeGreaterThan(0))
    return { ...hub, field, shown }
  }

  return { open, openConversation }
}

/** A phone: narrow, and a finger for a pointer, for the length of one test. */
export async function onPhone<T>(run: () => Promise<T>): Promise<T> {
  const phone = vi.spyOn(globalThis, 'matchMedia').mockImplementation((media: string) =>
    Object.assign(new EventTarget(), {
      matches: media.includes('767') || media.includes('coarse'),
      media,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    }),
  )
  try {
    return await run()
  } finally {
    phone.mockRestore()
  }
}
