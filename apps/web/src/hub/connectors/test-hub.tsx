import type { Connection, TestResult } from '@conexus/hub-api'
import {
  ATTEMPT_KEY_HEADER,
  ConnectionList,
  Connection as ConnectionShape,
  ConnectorEntry,
  TestResult as TestResultShape,
} from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import type { HttpHandler } from 'msw'
import { HttpResponse, http } from 'msw'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import type { hubServer } from '../../platform/test-hub.tsx'
import { companyRead, memberView, sessionRead } from '../../platform/test-hub.tsx'

const BASE = `*/api/companies/${COMPANY.id}`

const SANKHYA = ConnectorEntry.parse({
  id: 'sankhya',
  name: 'Sankhya',
  version: '1.0.0',
  fields: [
    { name: 'clientId', label: 'Client ID', maxLength: 200 },
    { name: 'clientSecret', label: 'Client Secret', maxLength: 200 },
    { name: 'xToken', label: 'X-Token', maxLength: 4096 },
  ],
})

/** What the Hub holds of the company's connections; a write changes it, a read shows it. */
export type View = {
  connections: Connection[]
  mayManage: boolean
  role?: 'owner' | 'admin' | 'member'
}

type Sent = { method: string; path: string; body: unknown; attemptKey: string | null }

/** A reply that replaces the Hub's usual answer to a write; nothing is kept when it is a failure. */
export type Answers = Partial<Record<'link' | 'test' | 'unlink', () => Response | undefined>>

let made = 0

/** A connection of the company to the Sankhya, linked by Ana and not yet tested, unless `fields` say otherwise. */
export function connectionOf(fields: Partial<Connection> = {}): Connection {
  made += 1
  return ConnectionShape.parse({
    id: `00000000-0000-4000-8000-${String(made).padStart(12, '0')}`,
    connector: 'sankhya',
    connectorVersion: '1.0.0',
    state: 'NEW',
    linkedBy: { id: ANA.id, name: 'Ana' },
    linkedAt: '2026-10-29T12:00:00.000Z',
    testedAt: null,
    ...fields,
  })
}

const CHECKS = [
  ['gateway', 'Consulta livre', 'Porta de leitura'],
  ['load', 'Leitura genérica', 'Porta de leitura'],
  ['companies', 'Empresas', 'Cadastros'],
  ['partners', 'Clientes', 'Cadastros'],
  ['products', 'Produtos', 'Produtos'],
  ['orders', 'Pedidos', 'Vendas'],
  ['taxes', 'Impostos dos pedidos', 'Vendas'],
] as const

/** The test's answer: every part reads, unless `outcomes` name another for a part by its label. */
export function workingOf(
  connection: Connection,
  outcomes: Record<string, string> = {},
): TestResult {
  return TestResultShape.parse({
    result: 'WORKING',
    checks: CHECKS.map(([id, label, subject]) => ({
      id,
      label,
      subject,
      outcome: outcomes[label] ?? 'READS',
    })),
    connection: { ...connection, state: 'ACTIVE', testedAt: '2026-10-29T14:02:00.000Z' },
  })
}

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
          connectors: [SANKHYA],
          connections: view.connections,
          mayManage: view.mayManage,
        }),
      ),
    ),
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
      await note(request)
      const replaced = answers.link?.()
      if (replaced) return replaced
      const connection = connectionOf()
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
export const SECRETS = {
  'Client ID': 'id-plantado-1',
  'Client Secret': 'segredo-plantado-2',
  'X-Token': 'token-plantado-3',
}

export function viewOf(fields: Partial<View> = {}): View {
  return { connections: [], mayManage: true, ...fields }
}

/** Opens Integrações on the Hub of `view`; returns the writes it received. */
export function openIntegrations(
  server: ReturnType<typeof hubServer>,
  view: View = viewOf(),
  answers: Answers = {},
) {
  const hub = connectionsHub(view, answers)
  server.use(...hub.handlers)
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [PAGE] }))} />)
  return hub.sent
}

export function fill() {
  for (const [label, value] of Object.entries(SECRETS)) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } })
  }
}

export async function openForm() {
  fireEvent.click(await screen.findByRole('button', { name: 'Ligar' }))
  return screen.findByRole('dialog', { name: 'Ligar Sankhya' })
}
