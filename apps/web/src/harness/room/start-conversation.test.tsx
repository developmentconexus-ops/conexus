import { AgentId, ATTEMPT_KEY_HEADER, CompanyId, ModelId, ProjectId } from '@conexus/hub-api'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router'
import { cleanup, render, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { z } from 'zod'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS, refusal } from '../../platform/test-hub.tsx'
import type { DataUrl, Outgoing } from './attachments.ts'
import { useHandoff } from './handoff.ts'
import type { ConversationKind } from './start-conversation.ts'
import { useStartConversation } from './start-conversation.ts'
import { conversationOf, SECOND } from './test-hub.tsx'

const server = hubServer()

const COMPANY_ID = CompanyId.parse(COMPANY.id)
const PROJECT_ID = ProjectId.parse(PEDIDOS.id)
const AGENT = AgentId.parse('33333333-3333-4333-8333-333333333333')
const PICKED = { model: ModelId.parse('anthropic/claude-sonnet-4'), effort: 'high' } as const
const AT = '2026-11-24T12:00:00.000Z'
const PROJECT = `/companies/${COMPANY.id}/projects/${PEDIDOS.id}`

const InProject = z.object({ projectId: z.string().optional() })

type Sent = { path: string; body: unknown; attemptKey: string | null }

function creations(answer?: () => Response) {
  const sent: Sent[] = []
  async function note(request: Request): Promise<unknown> {
    const body: unknown = await request.json()
    sent.push({
      path: new URL(request.url).pathname,
      body,
      attemptKey: request.headers.get(ATTEMPT_KEY_HEADER),
    })
    return body
  }
  const head = { id: SECOND, title: null, createdAt: AT, updatedAt: AT }
  server.use(
    http.post(`*${PROJECT}/conversations`, async ({ request }) => {
      await note(request)
      return (
        answer?.() ??
        HttpResponse.json({ conversation: conversationOf({ id: SECOND }) }, { status: 201 })
      )
    }),
    http.post(`*/companies/${COMPANY.id}/assistant/conversations`, async ({ request }) => {
      const { projectId } = InProject.parse(await note(request))
      const conversation = {
        ...head,
        projectId: projectId ?? null,
        automation: null,
        connections: [],
        model: PICKED.model,
      }
      return answer?.() ?? HttpResponse.json({ conversation }, { status: 201 })
    }),
    http.post(`*${PROJECT}/construtor/conversations`, async ({ request }) => {
      await note(request)
      return answer?.() ?? HttpResponse.json({ conversation: head }, { status: 201 })
    }),
    http.post(`*${PROJECT}/agents/:agentId/conversations`, async ({ request }) => {
      await note(request)
      const conversation = { ...head, agentId: AGENT, draft: true }
      return answer?.() ?? HttpResponse.json({ conversation }, { status: 201 })
    }),
  )
  return sent
}

/**
 * The piece mounted under a router of its own, which goes wherever it is sent; with `hears`, also
 * the conversation's own screen, which takes the request handed over to SECOND.
 */
function mounted<K extends ConversationKind>(kind: K, hears = false, at = '/') {
  const held: { start?: ReturnType<typeof useStartConversation<K>>['start'] } = {}
  const heard: Outgoing[] = []
  const conversation = {
    send: async (outgoing: Outgoing) => void heard.push(outgoing),
    recover: () => undefined,
  }
  function Conversation() {
    useHandoff(SECOND, conversation)
    return null
  }
  function Probe() {
    held.start = useStartConversation(kind).start
    return hears ? <Conversation /> : null
  }
  const router = createRouter({
    routeTree: createRootRoute({ component: Probe }),
    history: createMemoryHistory({ initialEntries: [at] }),
  })
  render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  async function start(...args: Parameters<NonNullable<typeof held.start>>) {
    await waitFor(() => expect(held.start).toBeDefined())
    const begin = held.start
    if (begin === undefined) throw new Error('the piece did not mount')
    return begin(...args)
  }
  return { router, start, heard }
}

function isDataUrl(text: string): text is DataUrl {
  return text.startsWith('data:')
}

const HANDOFF = { content: 'Um app de encomendas', files: [] }

test('o Construtor de apps cria pela rota das conversas do Projeto e abre a conversa com o pedido', async () => {
  const sent = creations()
  const { router, start } = mounted('APP_BUILDER')
  const started = await start(
    { companyId: COMPANY_ID, projectId: PROJECT_ID, picked: PICKED },
    HANDOFF,
  )
  expect(started).toEqual({ opened: true })
  expect(sent).toEqual([
    { path: `/api${PROJECT}/conversations`, body: PICKED, attemptKey: expect.any(String) },
  ])
  expect(router.state.location.pathname).toBe(`${PROJECT}/conversations/${SECOND}`)
  expect(router.state.location.state).toMatchObject({
    handoff: { conversationId: SECOND, content: HANDOFF.content },
  })
})

test('os arquivos do pedido chegam à conversa criada, com as palavras', async () => {
  creations()
  const { start, heard } = mounted('APP_BUILDER', true)
  const data = 'data:application/pdf;base64,JVBERi0xLjQ='
  if (!isDataUrl(data)) throw new Error('not a data URL')
  const table = { data, mediaType: 'application/pdf', filename: 'tabela.pdf' }
  await start(
    { companyId: COMPANY_ID, projectId: PROJECT_ID, picked: PICKED },
    { content: HANDOFF.content, files: [table] },
  )
  await waitFor(() => expect(heard).toEqual([{ content: HANDOFF.content, files: [table] }]))
})

test('Nova conversa do Construtor de apps manda o corpo vazio e abre sem pedido', async () => {
  const sent = creations()
  const { router, start } = mounted('APP_BUILDER')
  await start({ companyId: COMPANY_ID, projectId: PROJECT_ID, picked: undefined }, undefined)
  expect(sent.map((one) => one.body)).toEqual([{}])
  expect(router.state.location.pathname).toBe(`${PROJECT}/conversations/${SECOND}`)
  expect(router.state.location.state).not.toHaveProperty('handoff')
})

test('Nova conversa mantém a busca da tela, e o pedido abre a conversa sem ela', async () => {
  creations()
  const kept = mounted('APP_BUILDER', false, '/?x=1')
  await kept.start({ companyId: COMPANY_ID, projectId: PROJECT_ID, picked: undefined }, undefined)
  expect(kept.router.state.location.search).toEqual({ x: 1 })
  cleanup()
  const handed = mounted('APP_BUILDER', false, '/?x=1')
  await handed.start({ companyId: COMPANY_ID, projectId: PROJECT_ID, picked: PICKED }, HANDOFF)
  expect(handed.router.state.location.search).toEqual({})
})

test('o Assistente de um Projeto cria pela rota do Assistente e abre no endereço do Projeto', async () => {
  const sent = creations()
  const { router, start } = mounted('ASSISTANT')
  await start(
    { companyId: COMPANY_ID, projectId: PROJECT_ID, picked: PICKED, connections: [] },
    HANDOFF,
  )
  expect(sent).toEqual([
    {
      path: `/api/companies/${COMPANY.id}/assistant/conversations`,
      body: { ...PICKED, projectId: PEDIDOS.id, connections: [] },
      attemptKey: expect.any(String),
    },
  ])
  expect(router.state.location.pathname).toBe(`${PROJECT}/assistant/${SECOND}`)
})

test('o Assistente da empresa abre no endereço da empresa', async () => {
  creations()
  const { router, start } = mounted('ASSISTANT')
  await start(
    { companyId: COMPANY_ID, projectId: undefined, picked: PICKED, connections: [] },
    HANDOFF,
  )
  expect(router.state.location.pathname).toBe(`/companies/${COMPANY.id}/conversations/${SECOND}`)
})

test('o Construtor de agentes cria pela rota dele e abre a conversa na área Agentes', async () => {
  const sent = creations()
  const { router, start } = mounted('AGENT_BUILDER')
  await start({ companyId: COMPANY_ID, projectId: PROJECT_ID, picked: PICKED }, HANDOFF)
  expect(sent).toEqual([
    {
      path: `/api${PROJECT}/construtor/conversations`,
      body: PICKED,
      attemptKey: expect.any(String),
    },
  ])
  expect(router.state.location.pathname).toBe(`${PROJECT}/agents/construtor/${SECOND}`)
})

test('o Testar do agente salvo cria a conversa do rascunho e abre na página do agente', async () => {
  const sent = creations()
  const { router, start } = mounted('SAVED_AGENT')
  let created = 0
  await start(
    { companyId: COMPANY_ID, projectId: PROJECT_ID, agentId: AGENT, draft: true },
    undefined,
    () => {
      created += 1
    },
  )
  expect(sent).toEqual([
    {
      path: `/api${PROJECT}/agents/${AGENT}/conversations`,
      body: { draft: true },
      attemptKey: expect.any(String),
    },
  ])
  expect(created).toBe(1)
  expect(router.state.location.pathname).toBe(`${PROJECT}/agents/${AGENT}/${SECOND}`)
})

test('um começo recusado devolve a recusa e não sai do lugar', async () => {
  creations(() => refusal('MODEL_NO_ACCOUNT'))
  const { router, start } = mounted('AGENT_BUILDER')
  const started = await start(
    { companyId: COMPANY_ID, projectId: PROJECT_ID, picked: PICKED },
    HANDOFF,
  )
  expect(started).toMatchObject({ opened: false, failure: { code: 'MODEL_NO_ACCOUNT' } })
  expect(router.state.location.pathname).toBe('/')
})
