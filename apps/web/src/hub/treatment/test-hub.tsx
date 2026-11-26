import type { FailureCode } from '@conexus/hub-api'
import type { LakeTableSummary } from '@conexus/hub-api'
import {
  FAILURES,
  PROBLEM_MEDIA_TYPE,
  ProposedTreatment,
  TreatedTable,
  TreatedTables,
  TreatmentModel,
  VersionView,
} from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { render } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY, problemOf } from '../../platform/fixtures.ts'
import type { hubServer } from '../../platform/test-hub.tsx'
import { PEDIDOS, projectsRead } from '../../platform/test-hub.tsx'
import { connection, lakeTable } from '../copies/test-hub.tsx'
import { CATALOG } from '../copies/test-sources.ts'

export const LIST = `/companies/${COMPANY.id}/data`
export const MODEL_ID = '33333333-3333-4333-8333-333333333333'
export const NEW_ID = '44444444-4444-4444-8444-444444444444'
const HASH = 'a'.repeat(64)

export function version(fields: Record<string, unknown> = {}): VersionView {
  return VersionView.parse({
    number: 1,
    sql: 'select nunota\nfrom current.sankhya_notas',
    inputs: [{ layer: 'current', table: 'sankhya_notas' }],
    hash: HASH,
    proposedBy: 'Ana Lima',
    proposedAt: '2026-11-25T17:00:00.000Z',
    approvedBy: null,
    approvedAt: null,
    ...fields,
  })
}

/** A version someone said yes to. */
export function bound(fields: Record<string, unknown> = {}): VersionView {
  return version({ approvedBy: 'Ana Lima', approvedAt: '2026-11-25T17:30:00.000Z', ...fields })
}

export function built(rows = 128_402, at = '2026-11-26T17:05:00.000Z') {
  return { status: 'BUILT', rows, at }
}

export function failed(failure: string, line: number | null = 3) {
  return { status: 'FAILED', failure, line, at: '2026-11-26T17:05:00.000Z' }
}

/** A table treated from the Sankhya's: Notas, with its columns and nothing read it yet. */
export function notas(fields: Record<string, unknown> = {}): TreatedTable {
  return TreatedTable.parse({
    layer: 'tratado',
    name: 'sankhya_notas',
    label: 'Notas',
    connectionId: connection().id,
    description: 'Notas fiscais do Sankhya',
    columns: [
      { name: 'nunota', type: 'bigint', description: 'Chave da nota' },
      { name: 'dtalter', type: 'timestamp(6)', description: null },
    ],
    readBy: [],
    lastRun: null,
    ...fields,
  })
}

/** A treatment of the company: Venda, with nothing bound and no proposal until `fields` say so. */
export function venda(fields: Record<string, unknown> = {}): TreatedTable {
  return TreatedTable.parse({
    layer: 'negocio',
    id: MODEL_ID,
    name: 'venda',
    description: 'O que conta como venda',
    active: null,
    proposal: null,
    readBy: [],
    lastRun: null,
    ...fields,
  })
}

export function listOf(fields: Record<string, unknown> = {}): TreatedTables {
  return TreatedTables.parse({ lake: 'CURRENT', lastRun: null, tables: [], ...fields })
}

export function modelOf(fields: Record<string, unknown> = {}): TreatmentModel {
  return TreatmentModel.parse({
    id: MODEL_ID,
    name: 'venda',
    description: 'O que conta como venda',
    versions: [],
    runs: [],
    ...fields,
  })
}

type Sent = { method: string; path: string; body: unknown }
type Answer = () => Response | undefined | Promise<Response | undefined>
type Answers = Partial<
  Record<'run' | 'stop' | 'propose' | 'version' | 'approve' | 'model' | 'list', Answer>
>

/** What a test holds on the Hub of the treatments, and changes while it runs. */
type View = {
  list: TreatedTables
  models: Record<string, TreatmentModel>
  copied: LakeTableSummary[]
}

/** The Hub's refusal for a treatment failure, with the table or the place in the SQL it names. */
export function refused(code: FailureCode, extra: Record<string, unknown> = {}) {
  return HttpResponse.json(
    { ...problemOf(code), ...extra },
    { status: FAILURES[code].status, headers: { 'content-type': PROBLEM_MEDIA_TYPE } },
  )
}

const ROOT = `*/api/companies/${COMPANY.id}/data/treated`

function handlers(view: View, answers: Answers, sent: Sent[]) {
  async function record(request: Request, withBody: boolean) {
    sent.push({
      method: request.method,
      path: new URL(request.url).pathname,
      body: withBody ? await request.json() : undefined,
    })
  }
  return [
    http.get(ROOT, async () => (await answers.list?.()) ?? HttpResponse.json(view.list)),
    http.get(
      `${ROOT}/models/:modelId`,
      async ({ params }) =>
        (await answers.model?.()) ??
        (view.models[String(params.modelId)] === undefined
          ? refused('NOT_FOUND')
          : HttpResponse.json(view.models[String(params.modelId)])),
    ),
    http.post(`${ROOT}/models`, async ({ request }) => {
      await record(request, true)
      return (
        (await answers.propose?.()) ??
        HttpResponse.json(
          ProposedTreatment.parse({
            id: NEW_ID,
            name: 'venda',
            description: '',
            version: version(),
          }),
          { status: 201 },
        )
      )
    }),
    http.post(`${ROOT}/models/:modelId/versions`, async ({ request }) => {
      await record(request, true)
      return (
        (await answers.version?.()) ?? HttpResponse.json(version({ number: 2 }), { status: 201 })
      )
    }),
    http.post(`${ROOT}/models/:modelId/versions/:number/approve`, async ({ request }) => {
      await record(request, true)
      return (await answers.approve?.()) ?? HttpResponse.json(bound())
    }),
    http.post(`${ROOT}/run`, async ({ request }) => {
      await record(request, false)
      return (
        (await answers.run?.()) ??
        HttpResponse.json({ run: '55555555-5555-4555-8555-555555555555' }, { status: 202 })
      )
    }),
    http.post(`${ROOT}/run/stop`, async ({ request }) => {
      await record(request, false)
      return (await answers.stop?.()) ?? HttpResponse.json({ stopping: true }, { status: 202 })
    }),
  ]
}

function viewOf(fields: Partial<View> = {}): View {
  return { list: listOf(), models: {}, copied: [lakeTable()], ...fields }
}

/** Opens `path` as a person of `role`, on a Hub that holds `view`; `sent` lists the writes it received. */
export function openTreatment(
  server: ReturnType<typeof hubServer>,
  held: { view?: Partial<View>; answers?: Answers; path?: string; role?: string } = {},
) {
  const view = viewOf(held.view)
  const sent: Sent[] = []
  server.use(
    ...handlers(view, held.answers ?? {}, sent),
    http.get(`*/api/companies/${COMPANY.id}/connections`, () =>
      HttpResponse.json({ connectors: CATALOG, connections: [connection()], mayManage: true }),
    ),
    http.get(`*/api/companies/${COMPANY.id}/lake-tables`, () => HttpResponse.json(view.copied)),
    ...projectsRead({
      projects: [PEDIDOS],
      databaseReady: true,
      mayDelete: false,
      role: held.role ?? 'owner',
    }),
  )
  render(
    <Conexus
      conexus={createConexus(
        createMemoryHistory({ initialEntries: [held.path ?? `${LIST}?layer=treated`] }),
      )}
    />,
  )
  return { view, sent }
}
