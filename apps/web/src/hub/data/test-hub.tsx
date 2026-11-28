import type { DataReadEntry } from '@conexus/hub-api'
import { DataReadEntry as Entry, getCompany, listConnections, listMembers } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import type { z } from 'zod'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { hubServer, memberView, sessionRead } from '../../platform/test-hub.tsx'
import { mayOf } from '../../platform/test-may.ts'

export const server = hubServer()

const BASE = `*/api/companies/${COMPANY.id}`
export const BRUNO = { personId: 'person-bruno', name: 'Bruno Reis', email: 'bruno@example.test' }
/** The Matriz, the company's one connection: what a live read's row names. */
export const MATRIZ = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const LINKED = listConnections.success.body.shape.connections.element.parse({
  ...{ id: MATRIZ, name: 'Matriz', connector: 'sankhya', connectorVersion: '1', state: 'ACTIVE' },
  ...{ account: null, linkedAt: '2026-11-01T12:00:00.000Z', linkedBy: null },
  ...{ testedAt: null, testedBy: null },
})
export const THREAD = '88888888-8888-4888-8888-888888888888'

/** A read as the Hub lists it: Bruno's sample of `sankhya_vendas` through the Assistant in Início, one row. */
export function read(fields: Partial<z.input<typeof Entry>> = {}): DataReadEntry {
  return Entry.parse({
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    person: { id: BRUNO.personId, name: BRUNO.name },
    agent: 'ASSISTANT',
    project: null,
    agentId: null,
    threadId: null,
    verb: 'SAMPLE',
    tables: ['sankhya_vendas'],
    connection: null,
    operation: null,
    query: null,
    outcome: 'TABLE',
    rows: 1,
    ms: 12,
    ...fields,
  })
}

type View = {
  as: string
  reads?: () => Response | readonly DataReadEntry[]
  /** Every query string the list was asked with. */
  asked?: string[]
}

/** The Hub of the Registro: Ana in Empresa Teste as `as`, Bruno a member, the Matriz. */
export function readsHub(view: View) {
  server.use(
    sessionRead(() => ANA),
    http.get(`${BASE}`, () =>
      HttpResponse.json(
        getCompany.success.body.parse({
          company: COMPANY,
          role: view.as,
          mayInviteAs: [],
          may: mayOf(view.as),
        }),
      ),
    ),
    http.get(`${BASE}/members`, () =>
      HttpResponse.json(
        listMembers.success.body.parse({
          members: [
            memberView({ personId: ANA.id, name: ANA.name, email: ANA.email, role: 'owner' }),
            memberView({ ...BRUNO, role: 'member' }),
          ],
          next: { kind: 'END' },
        }),
      ),
    ),
    http.get(`${BASE}/connections`, () =>
      HttpResponse.json(
        listConnections.success.body.parse({
          connectors: [],
          connections: [LINKED],
          mayManage: true,
        }),
      ),
    ),
    http.get(`${BASE}/data-reads`, ({ request }) => {
      view.asked?.push(new URL(request.url).search)
      const answer = view.reads?.() ?? []
      if (answer instanceof Response) return answer
      return HttpResponse.json({ reads: answer, next: { kind: 'END' } })
    }),
  )
}

export function openReads(search = '') {
  const path = `/companies/${COMPANY.id}/settings/data-reads${search}`
  const conexus = createConexus(createMemoryHistory({ initialEntries: [path] }))
  return { ...render(<Conexus conexus={conexus} />), router: conexus.router }
}
