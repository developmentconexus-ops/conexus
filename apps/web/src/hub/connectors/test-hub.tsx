import type { Connection, ConnectorEntry, KeptCheck, TestResult } from '@conexus/hub-api'
import {
  ATTEMPT_KEY_HEADER,
  ConnectionDetail,
  ConnectionList,
  KeptCheck as KeptCheckShape,
} from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import type { HttpHandler } from 'msw'
import { HttpResponse, http } from 'msw'
import { z } from 'zod'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import type { hubServer } from '../../platform/test-hub.tsx'
import { companyRead, memberView, refusal, sessionRead } from '../../platform/test-hub.tsx'
import { connectionOf, SANKHYA, workingOf } from './fixtures.ts'

const BASE = `*/api/companies/${COMPANY.id}`

/** What the Hub holds of the company's connections; a write changes it, a read shows it. */
export type View = {
  connections: Connection[]
  mayManage: boolean
  role?: 'owner' | 'admin' | 'member'
  // The items of each connection's last working test, as the Hub keeps them.
  lastTests?: Record<string, KeptCheck[]>
  connectors?: ConnectorEntry[]
}

type Sent = { method: string; path: string; body: unknown; attemptKey: string | null }

/** A reply that replaces the Hub's usual answer to a write; nothing is kept when it is a failure. */
export type Answers = Partial<Record<'link' | 'test' | 'unlink', () => Response | undefined>>

function reads(view: View): HttpHandler[] {
  return [
    sessionRead(() => ANA),
    ...companyRead({
      role: view.role ?? (view.mayManage ? 'owner' : 'member'),
      members: [memberView({ ...ANA, personId: ANA.id, role: 'owner' })],
    }),
    http.get(`${BASE}/connections`, () =>
      HttpResponse.json(
        ConnectionList.parse({
          connectors: view.connectors ?? [SANKHYA],
          connections: view.connections,
          mayManage: view.mayManage,
        }),
      ),
    ),
    http.get(`${BASE}/connections/:connectionId`, ({ params }) => {
      const connection = view.connections.find((one) => one.id === params.connectionId)
      if (!connection) return refusal('CONNECTION_NOT_FOUND')
      return HttpResponse.json(
        ConnectionDetail.parse({
          connection,
          lastTest: view.lastTests?.[connection.id] ?? null,
        }),
      )
    }),
  ]
}

function writes(
  view: View,
  sent: Sent[],
  answers: Answers,
  result: (connection: Connection) => TestResult,
): HttpHandler[] {
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
    http.post(`${BASE}/connections`, async ({ request }) => {
      const body = await note(request)
      const replaced = answers.link?.()
      if (replaced) return replaced
      const { name } = z.object({ name: z.string() }).parse(body)
      const connection = connectionOf({ name })
      view.connections.push(connection)
      return HttpResponse.json({ connection }, { status: 201 })
    }),
    http.post(`${BASE}/connections/:connectionId/test`, async ({ request, params }) => {
      await note(request)
      const replaced = answers.test?.()
      if (replaced) return replaced
      const tested = result(
        view.connections.find((one) => one.id === params.connectionId) ?? connectionOf(),
      )
      view.connections = view.connections.map((one) =>
        one.id === params.connectionId ? { ...one, ...tested.connection } : one,
      )
      if (tested.result === 'WORKING') {
        view.lastTests = {
          ...view.lastTests,
          [String(params.connectionId)]: tested.checks.map((one) => KeptCheckShape.parse(one)),
        }
      }
      return HttpResponse.json(tested)
    }),
    http.delete(`${BASE}/connections/:connectionId`, async ({ request, params }) => {
      await note(request)
      const replaced = answers.unlink?.()
      if (replaced) return replaced
      view.connections = view.connections.filter((one) => one.id !== params.connectionId)
      return new HttpResponse(null, { status: 204 })
    }),
  ]
}

/**
 * The Hub as Ana sees the company's connections; `sent` lists the writes it received. A Testar
 * answers with `result(connection)`, every part reading unless the test says otherwise.
 */
export function connectionsHub(
  view: View,
  answers: Answers = {},
  result: (connection: Connection) => TestResult = workingOf,
) {
  const sent: Sent[] = []
  return { sent, handlers: [...reads(view), ...writes(view, sent, answers, result)] }
}

export const PAGE = `/companies/${COMPANY.id}/integrations`
export function pageOf(connection: Connection) {
  return `${PAGE}/${connection.id}`
}
export const SECRETS = {
  'Client ID': 'id-plantado-1',
  'Client Secret': 'segredo-plantado-2',
  'X-Token': 'token-plantado-3',
}

export function viewOf(fields: Partial<View> = {}): View {
  return { connections: [], mayManage: true, ...fields }
}

/** Shows the app at `path`. */
export function mount(path: string) {
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [path] }))} />)
}

/** Opens `path` (the list unless told) on the Hub of `view`; returns the writes it received. */
export function openIntegrations(
  server: ReturnType<typeof hubServer>,
  view: View = viewOf(),
  answers: Answers = {},
  path: string = PAGE,
) {
  const hub = connectionsHub(view, answers)
  server.use(...hub.handlers)
  mount(path)
  return hub.sent
}

export function fill(name?: string) {
  for (const [label, value] of Object.entries(SECRETS)) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
  }
  if (name !== undefined) {
    fireEvent.change(screen.getByLabelText('Nome da ligação'), { target: { value: name } })
  }
}

/** Opens the window "Ligar" of the first connector (the catalog's Sankhya). */
export async function openForm() {
  fireEvent.click(await screen.findByRole('button', { name: 'Ligar Sankhya' }))
  return screen.findByRole('dialog', { name: 'Ligar Sankhya' })
}
