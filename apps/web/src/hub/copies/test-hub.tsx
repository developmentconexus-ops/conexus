import type {
  Connection,
  CopyModelSummary,
  CopyProposalSummary,
  CopyRun,
  CopySummary,
} from '@conexus/hub-api'
import {
  ATTEMPT_KEY_HEADER,
  ConnectionId,
  ConnectorId,
  CopyId,
  CopyProposalId,
  CopyRunId,
  changeCopyInterval,
  EnableCopy,
  listConnections,
  listCopies,
  listCopyRuns,
  PersonId,
} from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { vi } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import type { hubServer } from '../../platform/test-hub.tsx'
import { PEDIDOS, projectsRead, refusal } from '../../platform/test-hub.tsx'
import { CATALOG } from './test-sources.ts'

export const VENDAS = CopyId.parse('11111111-1111-4111-8111-111111111111')
export const CLIENTES = CopyId.parse('22222222-2222-4222-8222-222222222222')
export const PRODUTOS = CopyId.parse('44444444-4444-4444-8444-444444444444')
export const DEVOLUCOES = CopyProposalId.parse('55555555-5555-4555-8555-555555555555')
const DEVOLUCOES_COPY = CopyId.parse('66666666-6666-4666-8666-666666666666')
const MATRIZ = ConnectionId.parse('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
const SANKHYA = ConnectorId.parse('sankhya')
const RUN_ID = CopyRunId.parse('33333333-3333-4333-8333-333333333333')

const BASE = `*/api/companies/${COMPANY.id}`

/** A run as the Hub lists it: complete, 42 s, 1.204 rows read and written. */
export function copyRun(fields: Partial<CopyRun> = {}): CopyRun {
  return listCopyRuns.success.body.shape.runs.element.parse({
    id: RUN_ID,
    startedAt: '2026-11-02T10:00:00.000Z',
    endedAt: '2026-11-02T10:00:42.000Z',
    outcome: { kind: 'COMPLETE' },
    read: 1204,
    written: 1204,
    ...fields,
  })
}

/** A copy as the Hub lists it: Vendas of the Matriz, every 30 minutes, last pass complete. */
export function copy(fields: Partial<CopySummary> = {}): CopySummary {
  return listCopies.success.body.shape.copies.element.parse({
    id: VENDAS,
    name: 'vendas',
    label: 'Vendas',
    sources: [{ connection: { id: MATRIZ, name: 'Matriz', connector: SANKHYA } }],
    interval: '30m',
    schedule: { kind: 'ACTIVE', nextRunAt: '2026-11-02T10:30:00.000Z' },
    run: copyRun(),
    rows: 118402,
    mode: { kind: 'WINDOW', days: 30 },
    projects: [{ id: PEDIDOS.id, name: 'Vendedores' }],
    shown: {
      source: { kind: 'QUERY', query: 'SELECT NUNOTA, CODPARC\nFROM TGFCAB' },
      key: ['NUNOTA'],
      changedSince: { column: 'DTALTER' },
      window: { column: 'DTNEG', days: 30 },
      description: null,
      columns: [],
    },
    ...fields,
  })
}

/** A proposal as the Hub lists it: the Builder's `devolucoes` of the Matriz, a whole copy, more than 50 rows in its proof. */
export function proposal(fields: Partial<CopyProposalSummary> = {}): CopyProposalSummary {
  return listCopies.success.body.shape.proposals.element.parse({
    id: DEVOLUCOES,
    name: 'devolucoes',
    label: 'Devoluções',
    sources: [{ connection: { id: MATRIZ, name: 'Matriz', connector: SANKHYA } }],
    project: { id: PEDIDOS.id, name: 'Vendedores' },
    shown: {
      source: { kind: 'QUERY', query: 'SELECT ID_DEVOLUCAO\nFROM DEVOLUCOES' },
      key: ['ID_DEVOLUCAO'],
      changedSince: null,
      window: null,
      description: null,
      columns: [],
    },
    mode: { kind: 'WHOLE' },
    proved: { rows: 50, more: true, calls: null },
    proposedBy: { id: PersonId.parse('person-ana'), name: 'Ana Lima' },
    state: 'OPEN',
    ...fields,
  })
}

const MODELS: CopyModelSummary[] = [
  { connector: SANKHYA, id: 'vendas', label: 'Vendas' },
  { connector: SANKHYA, id: 'clientes', label: 'Clientes' },
]

/** A connection of the company, as the connections list shows it. */
export function connection(fields: Partial<Connection> = {}): Connection {
  return listConnections.success.body.shape.connections.element.parse({
    id: MATRIZ,
    connector: 'sankhya',
    name: 'Matriz',
    connectorVersion: '1',
    state: 'ACTIVE',
    linkedBy: null,
    linkedAt: '2026-11-01T12:00:00.000Z',
    testedAt: null,
    testedBy: null,
    account: null,
    ...fields,
  })
}

export type Answers = {
  /** What a write answers instead of the Hub's success. */
  write?: () => Response | undefined
  /** What the list of copies answers instead of its rows. */
  list?: () => Response | undefined
  /** What a proposal's Ligar or Dispensar answers instead of the Hub's success. */
  decide?: () => Response | undefined
}

type Sent = { method: string; path: string; body: unknown; key: string | null }

type Held = Parameters<typeof copiesHub>[1]

/** Apagar: the copy leaves the list, and no table is left in the company's database. */
function removed(copies: CopySummary[], id: unknown) {
  const at = copies.findIndex((one) => one.id === id)
  if (at !== -1) copies.splice(at, 1)
  return HttpResponse.json({ tablesLeft: [] })
}

/** The runs of one copy: the first page, with a MORE when `later` is held, or that later page when asked for. */
function runsOf(held: Held, id: unknown, request: Request) {
  const found = held.copies.find((one) => one.id === id)
  if (found === undefined) return refusal('COPY_NOT_FOUND')
  if (new URL(request.url).searchParams.has('page')) {
    return HttpResponse.json({ copy: found, runs: held.later ?? [], next: { kind: 'END' } })
  }
  const next = held.later === undefined ? { kind: 'END' } : { kind: 'MORE', page: 'NTA' }
  return HttpResponse.json({ copy: found, runs: held.runs ?? [], next })
}

/** The Builder's proposals of `held`: the list with those open or named, Ligar and Dispensar, each changing its state. */
function proposalsOf(held: Held, note: (request: Request) => Promise<unknown>) {
  const proposals = held.proposals ?? []
  const answers = held.answers ?? {}
  function listed(request: Request) {
    const named = new URL(request.url).searchParams.get('proposalId')?.split(',') ?? []
    const shown = proposals.filter((one) => one.state === 'OPEN' || named.includes(one.id))
    return HttpResponse.json({ copies: held.copies, proposals: shown })
  }
  /** Ligar a proposal: the copy it becomes, released to its Projeto, and the proposal ACCEPTED. */
  function accepted(proposalId: string) {
    const found = proposals.find((one) => one.id === proposalId)
    if (found === undefined) return refusal('NOT_FOUND')
    if (found.state !== 'OPEN') return refusal('COPY_PROPOSAL_DECIDED')
    found.state = 'ACCEPTED'
    const made = copy({
      ...{ id: DEVOLUCOES_COPY, name: found.name, label: found.label, run: null, rows: null },
      ...{ mode: found.mode, shown: found.shown, projects: [found.project] },
    })
    held.copies.push(made)
    return HttpResponse.json({ copy: made }, { status: 201 })
  }
  const dismiss = http.post(`${BASE}/copy-proposals/:id/dismiss`, async ({ request, params }) => {
    await note(request)
    const replaced = answers.decide?.()
    if (replaced) return replaced
    const found = proposals.find((one) => one.id === params.id)
    if (found === undefined) return refusal('NOT_FOUND')
    if (found.state === 'ACCEPTED') return refusal('COPY_PROPOSAL_DECIDED')
    found.state = 'DISMISSED'
    return HttpResponse.json({})
  })
  return { listed, accepted, dismiss }
}

/**
 * The Hub's copies on `server`: a list that changes as the writes land, the models, the connections
 * and the runs of each copy. `sent` holds every request, with its attempt key.
 */
function copiesHub(
  server: ReturnType<typeof hubServer>,
  held: {
    copies: CopySummary[]
    runs?: CopyRun[]
    /** The runs of the page `NTA` that a `MORE` after the first points to. */
    later?: CopyRun[]
    models?: CopyModelSummary[]
    connections?: Connection[]
    proposals?: CopyProposalSummary[]
    answers?: Answers
  },
) {
  const sent: Sent[] = []
  const { answers = {} } = held
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
  function change(id: unknown, fields: Partial<CopySummary>) {
    const found = held.copies.find((one) => one.id === id)
    if (found === undefined) return refusal('COPY_NOT_FOUND')
    Object.assign(found, fields)
    return HttpResponse.json({ copy: found })
  }
  const proposals = proposalsOf(held, note)
  server.use(
    http.get(`${BASE}/copies`, ({ request }) => answers.list?.() ?? proposals.listed(request)),
    proposals.dismiss,
    http.get(`${BASE}/copy-models`, () => HttpResponse.json({ models: held.models ?? MODELS })),
    http.get(`${BASE}/connections`, () =>
      HttpResponse.json({
        connectors: CATALOG,
        connections: held.connections ?? [connection()],
        mayManage: true,
      }),
    ),
    http.post(`${BASE}/copies`, async ({ request }) => {
      const body = EnableCopy.parse(await note(request))
      if (body.from === 'PROPOSAL') return answers.decide?.() ?? proposals.accepted(body.proposalId)
      const replaced = answers.write?.()
      if (replaced) return replaced
      const made = copy({ id: CLIENTES, name: 'clientes', label: 'Clientes', run: null })
      held.copies.push(made)
      return HttpResponse.json({ copy: made }, { status: 201 })
    }),
    http.post(`${BASE}/copies/:id/pause`, async ({ request, params }) => {
      await note(request)
      return answers.write?.() ?? change(params.id, { schedule: { kind: 'PAUSED' } })
    }),
    http.post(`${BASE}/copies/:id/resume`, async ({ request, params }) => {
      await note(request)
      return (
        answers.write?.() ??
        change(params.id, {
          schedule: { kind: 'ACTIVE', nextRunAt: '2026-11-02T10:30:00.000Z' },
          interval: '30m',
        })
      )
    }),
    http.patch(`${BASE}/copies/:id`, async ({ request, params }) => {
      const { interval } = changeCopyInterval.input.body.parse(await note(request))
      return answers.write?.() ?? change(params.id, { interval })
    }),
    http.post(`${BASE}/copies/:id/run`, async ({ request }) => {
      await note(request)
      return answers.write?.() ?? HttpResponse.json({}, { status: 202 })
    }),
    http.delete(`${BASE}/copies/:id`, async ({ request, params }) => {
      await note(request)
      return answers.write?.() ?? removed(held.copies, params.id)
    }),
    http.get(`${BASE}/copies/:id/runs`, ({ params, request }) => runsOf(held, params.id, request)),
  )
  return {
    sent,
    writes: () => sent.filter((one) => one.method !== 'GET'),
  }
}

const COMPANY_ROOT = `/companies/${COMPANY.id}`
export const LIST = `${COMPANY_ROOT}/copies`
export function detailOf(copyId: string) {
  return `${LIST}/${copyId}`
}

/** Opens `path` as a person of `role` on the Hub of `held`: the session, the company and the Projetos, then the copies. */
export function openCopies(
  server: ReturnType<typeof hubServer>,
  held: Parameters<typeof copiesHub>[1],
  path: string,
  role = 'owner',
) {
  const hub = copiesHub(server, held)
  server.use(...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: false, role }))
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [path] }))} />)
  return hub
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
