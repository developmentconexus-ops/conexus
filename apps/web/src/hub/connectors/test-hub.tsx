import type { Connection, ConnectorEntry, TestResult } from '@conexus/hub-api'
import { ATTEMPT_KEY_HEADER, ConnectionDetail, ConnectionList } from '@conexus/hub-api'
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
/** Where the Hub sends the person to authorize: the provider's address. */
export const AUTHORIZE_URL = 'https://auth.example.test/authorize?state=x'

/** What the Hub holds of the company's connections; a write changes it, a read shows it. */
export type View = {
  connections: Connection[]
  mayManage: boolean
  role?: 'owner' | 'admin' | 'member'
  connectors?: ConnectorEntry[]
}

type Sent = { method: string; path: string; body: unknown; attemptKey: string | null }

/** A reply that replaces the Hub's usual answer to a write; nothing is kept when it is a failure. */
export type Answers = Partial<
  Record<'link' | 'test' | 'unlink' | 'start' | 'end' | 'reconnect', () => Response | undefined>
>

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
      return HttpResponse.json(ConnectionDetail.parse({ connection }))
    }),
  ]
}

function signInWrites(
  view: View,
  note: (request: Request) => Promise<unknown>,
  answers: Answers,
): HttpHandler[] {
  return [
    http.post(`${BASE}/connection-sign-ins`, async ({ request }) => {
      await note(request)
      return answers.start?.() ?? HttpResponse.json({ url: AUTHORIZE_URL }, { status: 201 })
    }),
    http.post(`${BASE}/connection-sign-ins/:signInId`, async ({ request }) => {
      await note(request)
      const replaced = answers.end?.()
      if (replaced) return replaced
      const connection = connectionOf({
        connector: 'mercado-livre',
        account: { label: 'PADARIASOL' },
      })
      view.connections.push(connection)
      return HttpResponse.json({ result: 'LINKED', connection })
    }),
    http.put(`${BASE}/connections/:connectionId/credential`, async ({ request, params }) => {
      await note(request)
      const replaced = answers.reconnect?.()
      if (replaced) return replaced
      const found = view.connections.find((one) => one.id === params.connectionId) ?? connectionOf()
      const connection = { ...found, state: 'NEW' as const, testedAt: null, testedBy: null }
      view.connections = view.connections.map((one) =>
        one.id === connection.id ? connection : one,
      )
      return HttpResponse.json({ connection })
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
      return HttpResponse.json(tested)
    }),
    ...signInWrites(view, note, answers),
    http.delete(`${BASE}/connections/:connectionId`, async ({ request, params }) => {
      await note(request)
      const replaced = answers.unlink?.()
      if (replaced) return replaced
      view.connections = view.connections.filter((one) => one.id !== params.connectionId)
      return HttpResponse.json({ revocation: 'NONE' })
    }),
  ]
}

/**
 * The Hub as Ana sees the company's connections; `sent` lists the writes it received. A Testar
 * answers with `result(connection)`, working unless the test says otherwise.
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
