import { randomUUID } from 'node:crypto'
import type { ConnectionId } from '@conexus/hub-api'
import { CatalogSystem, CompanyId, ConversationId, PersonId, ProjectId } from '@conexus/hub-api'
import type { ToolsInput } from '@mastra/core/agent'
import { RequestContext } from '@mastra/core/request-context'
import { z } from 'zod'
import { listing } from '../../../hub/access/test-view.ts'
import type { RunScope } from '../../spec/public.ts'
import { granted, LOJA, QUIET, SANKHYA } from '../connectors/test-access.ts'
import type { CompanyToolDeps } from './factory.ts'
import { companyTools } from './factory.ts'
import type { CompanyToolSeat } from './names.ts'
import { companyToolScope } from './scope.ts'

export const SEATS: readonly CompanyToolSeat[] = [
  'assistant',
  'research',
  'builder',
  'construtor',
  'agents',
]

export const MATRIZ = granted('sankhya', SANKHYA, 'Matriz')

/** Received by the run and out of its view: the role reaches none of its operations (`clientes`). */
export const FILIAL = {
  ...granted('sankhya', LOJA, 'Filial'),
  reads: [{ operation: 'clientes', label: 'Clientes', summary: 'clientes', list: null }],
}

const OWNER = {
  companyId: CompanyId.parse(randomUUID().replaceAll('-', '')),
  personId: PersonId.parse(randomUUID()),
}

export const VIEW = listing([
  CatalogSystem.parse({
    connection: SANKHYA,
    connector: 'sankhya',
    name: 'Matriz',
    reads: [{ operation: 'consultar', label: 'Consultas', summary: 'consulta' }],
    actions: [],
  }),
])

export function runOf(
  seat: CompanyToolSeat,
  choice: RunScope['choice'] = { kind: 'ANY' },
): RunScope {
  const kind = seat === 'research' ? 'assistant' : seat
  const place =
    kind === 'assistant'
      ? ({ kind: 'COMPANY' } as const)
      : ({ kind: 'PROJECT', projectId: ProjectId.parse(randomUUID().replaceAll('-', '')) } as const)
  return {
    ...{ kind, owner: OWNER, place, choice, attended: true },
    conversation: { kind: 'THREAD', id: ConversationId.parse(randomUUID()) },
    ceiling: { kind: 'PERSON' },
  }
}

/**
 * Every call the tools make through the door, by connection; the out-of-view one never gets one.
 * `notebooks` are the connections whose notebook the role of who runs a saved agent may use.
 */
export function recorded(notebooks: readonly ConnectionId[] = [SANKHYA]) {
  const runs: RunScope[] = []
  const reads: ConnectionId[] = []
  const notes: ConnectionId[] = []
  const saved: ConnectionId[] = []
  const called = { runs, reads, notes, saved }
  const deps: CompanyToolDeps = {
    log: QUIET,
    connector: {
      read: async (run, read) => {
        runs.push(run)
        reads.push(read.connectionId)
        return { kind: 'OK', value: { linhas: [] }, complete: true, rows: 0, bytes: 14 }
      },
      notes: async (run, connectionId) => {
        runs.push(run)
        notes.push(connectionId)
        return {}
      },
      notebooks: async () => notebooks,
      saveNote: async (_run, note) => {
        saved.push(note.connectionId)
        throw new Error('a note is never saved in this test')
      },
    },
    projects: async () => ({ projects: [], moreProjects: false }),
  }
  return { called, deps }
}

/** A saved agent's run reads the connections its version selected, the Filial among them; every other seat, its place's. */
export function chosenBy(seat: CompanyToolSeat): RunScope['choice'] {
  return seat === 'agents' ? { kind: 'CHOSEN', connections: [SANKHYA, LOJA] } : { kind: 'ANY' }
}

export async function seatOf(
  seat: CompanyToolSeat,
  run = runOf(seat, chosenBy(seat)),
  notebooks?: readonly ConnectionId[],
) {
  const { called, deps } = recorded(notebooks)
  const scope = await companyToolScope(
    run,
    { access: { viewOf: async () => VIEW }, connections: async () => [MATRIZ, FILIAL] },
    { noteSave: true, appData: { kind: 'NONE' } },
  )
  return { called, scope, tools: await companyTools(scope, seat, deps) }
}

export function textOf(tools: ToolsInput, name: string): string {
  const tool = Object(tools[name])
  return `${tool.description} ${JSON.stringify(z.toJSONSchema(tool.inputSchema))}`
}

/** A call the tool refuses: its schema names only the view's connections, and its door finds none else. */
export function refusedBy(answer: unknown): boolean {
  const told = Object(answer)
  return told.kind === 'NOT_GRANTED' || told.error === true
}

export function runOn(
  tools: ToolsInput,
  name: string,
  input: object,
  requestContext = new RequestContext(),
) {
  return Object(tools[name]).execute(input, { requestContext })
}
