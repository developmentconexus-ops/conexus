import type {
  CompanyId,
  OfferedConnection as Offered,
  PersonId,
  ProjectId,
  ToolTarget,
  ToolVersionConfig,
} from '@conexus/hub-api'
import { ToolId, ToolSlug } from '@conexus/hub-api'
import type { z } from 'zod'
import type { KitRead, SessionScope } from '../../hub/connectors/public.ts'
import type { Named } from '../../platform/failure.ts'
import { Failure } from '../../platform/failure.ts'
import { derivedUuid } from './derived.ts'

/** Who acts, in which Projeto: the session's person, the route's ids (security S8). */
export type InProject = { companyId: CompanyId; projectId: ProjectId; personId: PersonId }

/** Who wrote a change, for the record: the person at a screen, or the Construtor for them. */
export type Writer = 'PERSON' | 'CONSTRUTOR'

/** The database scope of the person acting in the company. */
export function databaseScopeOf(scope: InProject) {
  return { kind: 'COMPANY', companyId: scope.companyId, personId: scope.personId } as const
}

export function sessionScopeOf(scope: InProject): SessionScope {
  const { companyId, personId, projectId } = scope
  return { companyId, personId, place: { kind: 'PROJECT', projectId }, chosen: [] }
}

/** A connection the Projeto received, with its reads, as the connectors' door describes it. */
export type OfferedConnection = Readonly<
  Omit<Offered, 'reads'> & { reads: readonly Readonly<Offered['reads'][number]>[] }
>

/** What the tools read of the connectors' door: what the Projeto offers, and one read's input. */
export type ToolConnectors = {
  connections(scope: SessionScope): Promise<readonly OfferedConnection[]>
  operationOf(scope: SessionScope, target: ToolTarget): Promise<z.ZodObject | undefined>
  kitReads(scope: SessionScope): Promise<readonly KitRead[]>
}

/** A tool's read as the Projeto may use it now: its input, or why not (`TOOL_REFUSED`). */
export type Target = { kind: 'OK'; input: z.ZodObject } | { kind: 'REFUSED'; named: Named }

/**
 * Whether the Projeto received the connection and the operation is one of its reads, by the kit's
 * definition behind the connectors' door, which alone reads the kit (security S36).
 */
export async function targetOf(
  connectors: ToolConnectors,
  scope: SessionScope,
  target: ToolTarget,
  known?: readonly OfferedConnection[],
): Promise<Target> {
  const offered = known ?? (await connectors.connections(scope))
  if (!offered.some((each) => each.connectionId === target.connectionId)) {
    return { kind: 'REFUSED', named: { field: 'connectionId', reason: 'NOT_OFFERED' } }
  }
  const input = await connectors.operationOf(scope, target)
  if (input === undefined) {
    return { kind: 'REFUSED', named: { field: 'operation', reason: 'NOT_A_READ' } }
  }
  return { kind: 'OK', input }
}

/**
 * Why a version's fixed values and open fields do not fit the operation's input, or nothing: each
 * field is one of the input's top-level ones, in one side only, each fixed value passes its field's
 * schema, and the two sides cover every required field.
 */
function misfitOf(input: z.ZodObject, config: ToolVersionConfig): Named | undefined {
  const { shape } = input
  const fields = new Set(Object.keys(shape))
  const bound = Object.keys(config.bound)
  if (bound.some((field) => !fields.has(field))) return { field: 'bound', reason: 'UNKNOWN_FIELD' }
  if (config.open.some((field) => !fields.has(field))) {
    return { field: 'open', reason: 'UNKNOWN_FIELD' }
  }
  const open = new Set(config.open)
  if (open.size !== config.open.length || bound.some((field) => open.has(field))) {
    return { field: 'open', reason: 'FIELD_TWICE' }
  }
  if (
    Object.entries(config.bound).some(([field, value]) => !shape[field]?.safeParse(value).success)
  ) {
    return { field: 'bound', reason: 'VALUE_REFUSED' }
  }
  const required = [...fields].filter((field) => !shape[field]?.safeParse(undefined).success)
  if (required.some((field) => !(field in config.bound) && !open.has(field))) {
    return { field: 'open', reason: 'REQUIRED_MISSING' }
  }
  return undefined
}

/** The version, refused with its field when it does not fit the operation (`TOOL_REFUSED`). */
export function fitting(target: Target, config: ToolVersionConfig): void {
  if (target.kind === 'REFUSED') throw new Failure('TOOL_REFUSED', { named: target.named })
  const misfit = misfitOf(target.input, config)
  if (misfit !== undefined) throw new Failure('TOOL_REFUSED', { named: misfit })
}

/** A ready read as it is: nothing fixed, every field left to the model. */
export function readyConfig(input: z.ZodObject, summary: string): ToolVersionConfig {
  return { description: summary, bound: {}, open: Object.keys(input.shape) }
}

/**
 * The name of a ready read: its operation, then the start of its connection's id, so the same read
 * of two connections (Matriz and Filial) gets two.
 */
export function readySlug(target: ToolTarget): ToolSlug {
  const operation = target.operation.toLowerCase().replaceAll(/[.-]/g, '_').slice(0, 33)
  return ToolSlug.parse(`${operation}_${target.connectionId.slice(0, 6)}`)
}

/** The id of a ready read in the library: the company's, the connection's and the operation's, never the person's. */
export function readyIdOf(companyId: CompanyId, target: ToolTarget): ToolId {
  return ToolId.parse(derivedUuid('ready', companyId, target.connectionId, target.operation))
}
