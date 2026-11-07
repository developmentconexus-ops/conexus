import type {
  AgentConversationSummary,
  AgentDetail,
  AgentVersionSummary,
  ConstrutorConversationSummary,
  ReadyTool,
  ToolSummary,
  ToolVersionDetail,
} from '@conexus/hub-api'
import {
  AGENTS_CONTROLLER,
  AgentId,
  AgentListed,
  ATTEMPT_KEY_HEADER,
  BUILDER_ROUTES,
  CONSTRUTOR_CONTROLLER,
  DraftPatch,
  ToolInput,
} from '@conexus/hub-api'
import { HttpResponse, http } from 'msw'
import type { setupServer } from 'msw/node'
import { z } from 'zod'
import { SANKHYA } from '../../hub/connectors/fixtures.ts'
import { COMPANY } from '../../platform/fixtures.ts'
import { PEDIDOS, refusal } from '../../platform/test-hub.tsx'
import type { ChosenModels } from '../assistant/test-model.tsx'
import { modelWrite } from '../assistant/test-model.tsx'
import type { View } from '../conversation/test-hub.tsx'
import { screens, view } from '../conversation/test-hub.tsx'
import { START } from '../conversation/test-start.tsx'
import { displayOf, openLine } from '../conversation/test-stream.tsx'
import { BUILDER_CHAT, CHAT, TEST_CHAT, TOOL_V1, toolSummary, version } from './test-agents.ts'
import { toolRoutes } from './test-hub-tools.tsx'

const PROJECT_API = `*/api/companies/${COMPANY.id}/projects/${PEDIDOS.id}`

function SESSION(controller: string) {
  return `*${BUILDER_ROUTES}/agent-controller/${controller}/sessions/:id`
}

type Answers = {
  /** What a save of the draft answers instead of the Hub's success; undefined, once it settles, lets the Hub answer. */
  save?: () => Response | undefined | Promise<Response | undefined>
  /** What the read of the agent answers instead of its row. */
  read?: () => Response | undefined
  publish?: () => Response | undefined
  /** What going back to a version answers instead of the Hub's success. */
  activate?: () => Response | undefined
  /** What the creation of a tool answers instead of the Hub's success. */
  createTool?: () => Response | undefined
  /** What the read of the Projeto's agents answers instead of the list. */
  list?: () => Response | undefined
  /** What the read of the tools the Projeto can use answers instead of the list. */
  tools?: () => Response | Promise<Response> | undefined
  /** What opening a conversation with the Construtor answers instead of the Hub's success. */
  openConstrutor?: () => Response | undefined
  /** What the write of a Construtor conversation's model answers instead of the Hub's success. */
  model?: () => Response | undefined
}

type Sent = { method: string; path: string; body: unknown; key: string | null }
type Held = {
  agents: AgentDetail[]
  versions?: AgentVersionSummary[]
  tools?: ToolSummary[]
  /** The versions of every tool the Projeto reads, newest last; a tool read without them has version 1 alone. */
  toolVersions?: ToolVersionDetail[]
  ready?: ReadyTool[]
  conversations?: AgentConversationSummary[]
  construtor?: ConstrutorConversationSummary[]
  answers?: Answers
  /** The person is a member: the Hub answers every route of the area `NOT_FOUND` (S10). */
  member?: boolean
}
type Note = (request: Request) => Promise<unknown>

function draftRoutes(held: Held, note: Note) {
  const answers = held.answers ?? {}
  function find(id: unknown) {
    return held.agents.find((one) => one.id === id)
  }
  return [
    http.get(`*/api/companies/${COMPANY.id}/agents`, ({ request }) => {
      const only = new URL(request.url).searchParams.get('projectId')
      return (
        answers.list?.() ??
        HttpResponse.json({
          agents: held.agents
            .filter((one) => only === null || one.projectId === only)
            .map((one) => AgentListed.parse({ ...one, tools: one.tools.length })),
        })
      )
    }),
    http.get(`${PROJECT_API}/agents/:id`, ({ params }) => {
      const replaced = answers.read?.()
      if (replaced) return replaced
      const found = find(params.id)
      return found ? HttpResponse.json({ agent: found }) : refusal('AGENT_NOT_FOUND')
    }),
    http.patch(`${PROJECT_API}/agents/:id/draft`, async ({ request, params }) => {
      const body = DraftPatch.parse(await note(request))
      const replaced = await answers.save?.()
      if (replaced) return replaced
      const found = find(params.id)
      if (!found) return refusal('AGENT_NOT_FOUND')
      if (body.revision !== found.revision) return refusal('AGENT_DRAFT_STALE')
      const {
        revision: _revision,
        tools: _tools,
        ready: _ready,
        approvals: _approvals,
        ...fields
      } = body
      Object.assign(found, { revision: found.revision + 1, draft: { ...found.draft, ...fields } })
      return HttpResponse.json({ agent: found })
    }),
    http.delete(`${PROJECT_API}/agents/:id`, async ({ request, params }) => {
      await note(request)
      if (!find(params.id)) return refusal('AGENT_NOT_FOUND')
      held.agents = held.agents.filter((one) => one.id !== params.id)
      return new HttpResponse(null, { status: 204 })
    }),
    ...versionRoutes(held, note, find),
  ]
}

function versionRoutes(held: Held, note: Note, find: (id: unknown) => AgentDetail | undefined) {
  const answers = held.answers ?? {}
  return [
    http.post(`${PROJECT_API}/agents/:id/publish`, async ({ request, params }) => {
      await note(request)
      const replaced = answers.publish?.()
      if (replaced) return replaced
      const found = find(params.id)
      if (!found) return refusal('AGENT_NOT_FOUND')
      const number = (held.versions?.length ?? 0) + 1
      const others = (held.versions ?? []).map((one) => ({ ...one, active: false }))
      held.versions = [version(number, true), ...others]
      found.state = { kind: 'PUBLISHED', version: number, changed: false }
      return HttpResponse.json({ agent: found, version: held.versions[0] })
    }),
    http.get(`${PROJECT_API}/agents/:id/versions`, () =>
      HttpResponse.json({ versions: held.versions ?? [] }),
    ),
    http.post(
      `${PROJECT_API}/agents/:id/versions/:number/activate`,
      async ({ request, params }) => {
        await note(request)
        const replaced = answers.activate?.()
        if (replaced) return replaced
        const found = find(params.id)
        if (!found) return refusal('AGENT_NOT_FOUND')
        const number = Number(params.number)
        held.versions = (held.versions ?? []).map((one) => ({
          ...one,
          active: one.number === number,
        }))
        found.state = { kind: 'PUBLISHED', version: number, changed: true }
        return HttpResponse.json({ agent: found })
      },
    ),
  ]
}

const OpenConversation = z.object({ draft: z.boolean().optional() })

function conversationRoutes(held: Held, chosen: ChosenModels, note: Note) {
  return [
    http.get(`${PROJECT_API}/agents/:id/conversations`, () =>
      HttpResponse.json({ conversations: held.conversations ?? [] }),
    ),
    http.post(`${PROJECT_API}/agents/:id/conversations`, async ({ request, params }) => {
      const body = OpenConversation.parse(await note(request))
      const made: AgentConversationSummary = {
        id: body.draft ? TEST_CHAT : CHAT,
        agentId: AgentId.parse(params.id),
        draft: body.draft === true,
        title: '',
        updatedAt: '2026-11-02T12:00:00.000Z',
      }
      held.conversations = [made, ...(held.conversations ?? [])]
      return HttpResponse.json({ conversation: made }, { status: 201 })
    }),
    http.get(
      `${PROJECT_API}/tools`,
      () =>
        held.answers?.tools?.() ??
        HttpResponse.json({ tools: held.tools ?? [], ready: held.ready ?? [] }),
    ),
    http.post(`${PROJECT_API}/tools`, async ({ request }) => {
      const body = ToolInput.parse(await note(request))
      const replaced = held.answers?.createTool?.()
      if (replaced) return replaced
      const { connectionId, operation, slug, description } = body
      const made = {
        ...toolSummary({ slug, connectionId, operation, description }),
        versions: [
          {
            kind: 'PRESET',
            id: TOOL_V1,
            number: 1,
            description,
            bound: body.bound,
            open: body.open,
          },
        ],
      }
      held.tools = [
        ...(held.tools ?? []),
        toolSummary({ slug, connectionId, operation, description }),
      ]
      return HttpResponse.json({ tool: made }, { status: 201 })
    }),
    ...toolRoutes(held, PROJECT_API, note),
    http.get(`${PROJECT_API}/construtor/conversations`, () =>
      HttpResponse.json({ conversations: held.construtor ?? [] }),
    ),
    http.post(`${PROJECT_API}/construtor/conversations`, async ({ request }) => {
      await note(request)
      const replaced = held.answers?.openConstrutor?.()
      if (replaced) return replaced
      const made = { id: BUILDER_CHAT, title: '', updatedAt: '2026-11-02T12:00:00.000Z' }
      held.construtor = [made, ...(held.construtor ?? [])]
      return HttpResponse.json({ conversation: made }, { status: 201 })
    }),
    modelWrite(`${PROJECT_API}/construtor`, { chosen, answers: held.answers ?? {} }, note),
  ]
}

function sessionRoutes(
  chosen: ChosenModels,
  note: Note,
  lines: ReturnType<typeof openLine>['line'][],
) {
  return [AGENTS_CONTROLLER, CONSTRUTOR_CONTROLLER].flatMap((controller) => [
    http.get(`${SESSION(controller)}/stream`, ({ request }) => {
      const { line, response } = openLine(displayOf())
      lines.push(line)
      request.signal.addEventListener('abort', () => lines.splice(lines.indexOf(line), 1), {
        once: true,
      })
      return response
    }),
    http.get(SESSION(controller), ({ params }) => {
      const kept = chosen.get(String(params.id))
      return HttpResponse.json({
        controllerId: controller,
        sessionId: params.id,
        resourceId: 'company:c1:person:p1',
        threadId: params.id,
        modeId: 'ask',
        modelId: kept?.model ?? 'anthropic/claude-sonnet-4',
        running: false,
        tasks: [],
        settings: { thinkingLevel: kept?.effort ?? 'off' },
      })
    }),
    http.get(`${SESSION(controller)}/threads/:threadId/messages`, () =>
      HttpResponse.json({ messages: [] }),
    ),
    http.post(`${SESSION(controller)}/messages`, async ({ request }) => {
      await note(request)
      return HttpResponse.json({ ok: true })
    }),
  ])
}

/** A member's read of any route of the area: the Hub does not find it (S10). */
function memberRoutes() {
  function refused() {
    return refusal('NOT_FOUND')
  }
  return [
    http.all(`${PROJECT_API}/agents*`, refused),
    http.all(`${PROJECT_API}/construtor*`, refused),
    http.all(`${PROJECT_API}/tools*`, refused),
    http.all(`*/api/companies/${COMPANY.id}/agents`, refused),
  ]
}

/** The company's catalog with the Sankhya, where the screens read the connectors' names and logos. */
function catalogRoute() {
  return http.get('*/api/companies/:companyId/connections', () =>
    HttpResponse.json({ connectors: [SANKHYA], connections: [], mayManage: true }),
  )
}

/**
 * The Hub's Agentes routes of one Projeto on `server`, with the sessions of the Construtor and of an
 * agent. `held` changes as the writes land; `sent` holds every write.
 */
function agentsHub(server: ReturnType<typeof setupServer>, held: Held) {
  const sent: Sent[] = []
  const chosen: ChosenModels = new Map()
  const lines: ReturnType<typeof openLine>['line'][] = []
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
  server.use(
    ...(held.member
      ? memberRoutes()
      : [
          catalogRoute(),
          ...draftRoutes(held, note),
          ...conversationRoutes(held, chosen, note),
          ...sessionRoutes(chosen, note, lines),
        ]),
  )
  return { sent, writes: () => sent.filter((one) => one.method !== 'GET'), lines, held }
}

/** The Agentes screens: the Projeto's frame of the conversation tests, and the agents' routes. */
export function agentScreens(server: ReturnType<typeof setupServer>) {
  const { open } = screens(server)
  function at(path: string, held: Held, shown: Partial<View> = {}) {
    const hub = agentsHub(server, held)
    const conexus = open(view({ start: START, ...shown }), path)
    return { ...conexus, ...hub }
  }
  return { at }
}
