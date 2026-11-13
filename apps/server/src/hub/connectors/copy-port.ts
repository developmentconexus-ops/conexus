import type {
  ConnectorId,
  CopyDefinition,
  CopyDefinitionV1,
  CopyDefinitionV2,
  CopyModel,
  CopyPage,
  CopyPosition,
  ListRead,
  Operation,
  PageInput,
} from '@conexus/connectors'
import { CopyPageSchema, listInputOf, listPageOf, Rows } from '@conexus/connectors'
import type { CompanyId, ConnectionId, PersonId } from '@conexus/hub-api'
import { OperationId } from '@conexus/hub-api'
import type { SQL } from 'drizzle-orm'
import { and, eq } from 'drizzle-orm'
import { Failure } from '../../platform/failure.ts'
import { personalColumnsIn } from './copy-personal.ts'
import type { OpenedConnection } from './executor.ts'
import { listIssuesOf, listReadOf, sourceIssuesOf } from './list-read.ts'
import type { NotInRole, ReadAnswer } from './read.ts'
import { readThrough } from './read.ts'
import type { Deps } from './rows.ts'
import { connectorIn, usable } from './rows.ts'
import { connection } from './tables.ts'
import { openedIn } from './testing.ts'

type CopySourceFailure =
  | 'COPY_SOURCE_REFUSED'
  | 'COPY_SOURCE_NEEDS_REAUTH'
  | 'COPY_SOURCE_UNREACHABLE'
  | 'COPY_SOURCE_UNREADABLE'

/** The read's refusal whole, as `readThrough` gave it: the Builder's proof gives it all to the model (C79). */
export type CopyRefusal = Exclude<ReadAnswer, { kind: 'OK' }> | NotInRole

/** One page of a version 1 copy through the connector's paged read, for the run and the Builder's proof. */
type PagedRead =
  | Readonly<{ kind: 'PAGE'; page: CopyPage }>
  | Readonly<{ kind: 'REFUSED'; refusal: CopyRefusal }>
  /** The connection is gone, not ACTIVE, or of a connector that offers no copies. */
  | Readonly<{ kind: 'NO_CONNECTION' }>
  | InLine

/** One page of a copy's source as the run reads it. */
export type CopyRead =
  | Readonly<{ kind: 'PAGE'; page: CopyPage; next: CopyPosition | null; total: number | null }>
  /** The provider answered 429 (decision 0058), or the connector's lane passed its deadline (`waitMs` null). */
  | Readonly<{ kind: 'WAIT'; waitMs: number | null }>
  /** The cursor is older than the read's declared validity: nothing was called, the pass starts again. */
  | Readonly<{ kind: 'STALE' }>
  | Readonly<{ kind: 'FAILED'; code: CopySourceFailure | 'COPY_SOURCE_CEILING' }>
  | Readonly<{ kind: 'NO_CONNECTION' }>

export type OfConnection = Readonly<{ companyId: CompanyId; connectionId: ConnectionId }>

function connectorOfRow(deps: Deps, input: OfConnection, personId: PersonId | null) {
  const scope = { kind: 'COMPANY', companyId: input.companyId, personId } as const
  return deps.database.read(scope, async (tx) => {
    const [row] = await tx
      .select({ connector: connection.connectorId })
      .from(connection)
      .where(and(eq(connection.id, input.connectionId), eq(connection.companyId, input.companyId)))
    return row === undefined ? undefined : connectorIn(deps, row.connector)
  })
}

/**
 * The connection opened for one page when it is ACTIVE; none otherwise. The inventory reads a
 * connection just linked, which no test has made ACTIVE yet, and passes no state.
 */
export function openedForCopy(
  deps: Deps,
  input: OfConnection & { enabledBy: PersonId },
  state: SQL | null = usable,
) {
  const scope = { kind: 'COMPANY', companyId: input.companyId, personId: input.enabledBy } as const
  return deps.database.read(scope, async (tx): Promise<OpenedConnection | undefined> => {
    const [row] = await tx
      .select({ id: connection.id })
      .from(connection)
      .where(
        and(
          eq(connection.id, input.connectionId),
          eq(connection.companyId, input.companyId),
          state ?? undefined,
        ),
      )
    if (row === undefined) return undefined
    try {
      return await openedIn(deps, tx, input)
    } catch (error) {
      if (error instanceof Failure && error.code === 'CONNECTION_NOT_FOUND') return undefined
      throw error
    }
  })
}

type ReadOf = Readonly<{
  input: OfConnection & { enabledBy: PersonId; signal: AbortSignal }
  opened: OpenedConnection
  operation: Operation<unknown, unknown, 'read'>
  value: unknown
}>

/** The connector's copy lane passed its deadline before the call: nothing was asked. */
export type InLine = Readonly<{ kind: 'IN_LINE' }>

/**
 * The read every other reader takes, the connection's turn, its token, the deadline and the log
 * line, speaking as a version that declares only the operation; in the connector's copy lane first
 * when its provider counts the limit by the app.
 */
export async function readAsCopy(deps: Deps, a: ReadOf): Promise<ReadAnswer | NotInRole | InLine> {
  const { input, opened, operation } = a
  function read() {
    return readThrough(deps, {
      by: 'copy',
      ids: { companyId: input.companyId },
      viewer: { person: { id: input.enabledBy }, companyId: input.companyId },
      speaker: {
        kind: 'VERSION',
        declared: [
          { connectionId: input.connectionId, operation: OperationId.parse(operation.id) },
        ],
      },
      opened,
      operation,
      input: a.value,
      deadlineMs: deps.callDeadlineMs,
      signal: input.signal,
    })
  }
  if (opened.connector.callLimit?.countedBy !== 'APP') return read()
  const turn = await deps.limits.inCopyTurn(
    opened.connector.id,
    deps.callDeadlineMs,
    async () => ({ kind: 'READ', answer: await read() }) as const,
    input.signal,
  )
  return turn.kind === 'READ' ? turn.answer : { kind: 'IN_LINE' }
}

/**
 * One page of a version 1 copy through the connector's paged read. The one way to `readThrough`
 * for a version 1 copy's run and for the Builder's proof of a proposal (C26).
 */
export async function copyPage(
  deps: Deps,
  input: OfConnection & { enabledBy: PersonId; input: PageInput; signal: AbortSignal },
): Promise<PagedRead> {
  const opened = await openedForCopy(deps, input)
  const read = opened?.connector.copy?.read
  if (opened === undefined || read === undefined) return { kind: 'NO_CONNECTION' }
  const answer = await readAsCopy(deps, { input, opened, operation: read, value: input.input })
  if (answer.kind === 'IN_LINE') return answer
  if (answer.kind === 'OK') return { kind: 'PAGE', page: CopyPageSchema.parse(answer.value) }
  return { kind: 'REFUSED', refusal: answer }
}

function sourceFailureOf(answer: Exclude<CopyRefusal, { kind: 'BUSY' }>): CopySourceFailure {
  switch (answer.kind) {
    case 'REFUSED':
    case 'NOT_IN_ROLE':
      return 'COPY_SOURCE_REFUSED'
    case 'AUTH_REFUSED':
      return 'COPY_SOURCE_NEEDS_REAUTH'
    case 'UNREACHABLE':
    case 'DEADLINE':
      return 'COPY_SOURCE_UNREACHABLE'
    case 'UNREADABLE':
      return 'COPY_SOURCE_UNREADABLE'
    default:
      return answer satisfies never
  }
}

/** A refusal as the run keeps it: 429 is a wait, every other its code. */
function refusedRead(refusal: CopyRefusal): CopyRead {
  return refusal.kind === 'BUSY'
    ? { kind: 'WAIT', waitMs: refusal.waitMs }
    : { kind: 'FAILED', code: sourceFailureOf(refusal) }
}

export type SourcePage = OfConnection & {
  enabledBy: PersonId
  definition: CopyDefinition
  position: CopyPosition | null
  /** The watermark less a day: a day in version 1, an instant in version 2; null on a source's first pass (#940). */
  since: string | null
  windowFrom: string | null
  limit: number
  signal: AbortSignal
}

/** The key of the page's last row, the next page's start; the same position when the page had no row. */
function lastKey(definition: CopyDefinitionV1, page: CopyPage, position: CopyPosition | null) {
  const last = page.rows.at(-1)
  if (last === undefined) return position
  const { columns, key } = definition
  const after = key.map((name) => Number(last[columns.findIndex((column) => column.name === name)]))
  return { kind: 'KEY', after } as const
}

async function pageV1(deps: Deps, a: SourcePage & { definition: CopyDefinitionV1 }) {
  const after = a.position?.kind === 'KEY' ? a.position.after : null
  const { definition, since, windowFrom, limit } = a
  const read = await copyPage(deps, {
    ...a,
    input: { definition, after, since, windowFrom, limit },
  })
  if (read.kind === 'NO_CONNECTION') return read
  if (read.kind === 'IN_LINE') return { kind: 'WAIT', waitMs: null } as const
  if (read.kind === 'REFUSED') return refusedRead(read.refusal)
  const next = lastKey(definition, read.page, a.position)
  return { kind: 'PAGE', page: read.page, next, total: null } as const
}

type ListAsked = Readonly<{
  input: OfConnection & { enabledBy: PersonId; signal: AbortSignal }
  definition: CopyDefinitionV2
  position: CopyPosition | null
  since: string | null
  /** The page's rows at most, below the read's own size; null asks the read's size. */
  rows: number | null
}>

/** What one page of a list read answered, before the copy reads it: the run's page and the Builder's proof share it (C26). */
export type ListAnswer =
  | Readonly<{ kind: 'ROWS'; rows: Rows; list: ListRead; at: Date }>
  | Readonly<{ kind: 'REFUSED'; refusal: CopyRefusal }>
  /** A 2xx whose body is not the kit's rows. */
  | Readonly<{ kind: 'NOT_ROWS' }>
  | Readonly<{ kind: 'STALE' }>
  | Readonly<{ kind: 'NO_CONNECTION' }>
  | InLine

/** One page of the list read a version 2 definition names, through the copies' own read (`readAsCopy`). */
export async function listAnswer(deps: Deps, a: ListAsked): Promise<ListAnswer> {
  const opened = await openedForCopy(deps, a.input)
  const found = opened === undefined ? undefined : listReadOf(opened.connector, a.definition)
  if (opened === undefined || found === undefined) return { kind: 'NO_CONNECTION' }
  const { operation, list } = found
  const { position } = a
  const at = deps.now()
  if (
    position?.kind === 'CURSOR' &&
    list.paging.kind === 'CURSOR' &&
    at.getTime() - Date.parse(position.at) > list.paging.ttlMs
  )
    return { kind: 'STALE' }
  const value = listInputOf({ list, definition: a.definition, position, since: a.since })
  if (a.rows !== null && list.paging.kind !== 'NONE')
    value[list.paging.limit] = Math.min(a.rows, list.paging.max)
  const answer = await readAsCopy(deps, { input: a.input, opened, operation, value })
  if (answer.kind === 'IN_LINE') return answer
  if (answer.kind !== 'OK') return { kind: 'REFUSED', refusal: answer }
  const rows = Rows.safeParse(answer.value)
  return rows.success ? { kind: 'ROWS', rows: rows.data, list, at } : { kind: 'NOT_ROWS' }
}

async function pageV2(
  deps: Deps,
  a: SourcePage & { definition: CopyDefinitionV2 },
): Promise<CopyRead> {
  const { definition, position } = a
  const read = await listAnswer(deps, {
    input: a,
    definition,
    position,
    since: a.since,
    rows: null,
  })
  switch (read.kind) {
    case 'NO_CONNECTION':
    case 'STALE':
      return read
    case 'IN_LINE':
      return { kind: 'WAIT', waitMs: null }
    case 'REFUSED':
      return refusedRead(read.refusal)
    case 'NOT_ROWS':
      return { kind: 'FAILED', code: 'COPY_SOURCE_UNREADABLE' }
    case 'ROWS':
      break
    default:
      return read satisfies never
  }
  const page = listPageOf({ list: read.list, definition, position, rows: read.rows, at: read.at })
  switch (page.kind) {
    case 'PAGE': {
      const { rows: cells, more, next, total } = page
      return { kind: 'PAGE', page: { rows: cells, more }, next, total }
    }
    case 'MISFIT':
    case 'UNREADABLE':
      return { kind: 'FAILED', code: 'COPY_SOURCE_UNREADABLE' }
    case 'CEILING':
      return { kind: 'FAILED', code: 'COPY_SOURCE_CEILING' }
    default:
      return page satisfies never
  }
}

/** One page of a copy's source: version 1 through the connector's paged read, version 2 through the list read it names. */
function readPage(deps: Deps, a: SourcePage): Promise<CopyRead> {
  const { definition } = a
  return definition.version === 1
    ? pageV1(deps, { ...a, definition })
    : pageV2(deps, { ...a, definition })
}

/**
 * The copies' door to the outside (decision 0056): the templates of each connector, and one page
 * of a copy's source (`readPage`).
 */
export function createCopyPort(deps: Deps) {
  return Object.freeze({
    async models(input: OfConnection): Promise<readonly CopyModel[] | undefined> {
      return (await connectorOfRow(deps, input, null))?.copy?.models
    },
    catalog(): readonly { connector: ConnectorId; model: CopyModel }[] {
      return deps.catalog.flatMap((connector) =>
        (connector.copy?.models ?? []).map((model) => ({ connector: connector.id, model })),
      )
    },
    readPage: (input: SourcePage): Promise<CopyRead> => readPage(deps, input),
    /** The kind of each column of a version 2 definition, from the connector's declared personal paths; none for a connector the kit lacks. */
    personalColumns: (connector: string, definition: CopyDefinitionV2) =>
      personalColumnsIn(connectorIn(deps, connector), definition),
    /**
     * What a version 2 definition fails against the connector's list read, a path and a message each
     * (none when it fits), and whether its account is `none`: such a connector's copy reads one
     * connection (O Sync de qualquer conector, U4).
     */
    proposable(connector: string, definition: CopyDefinitionV2) {
      const kit = connectorIn(deps, connector)
      if (kit === undefined)
        return { issues: [`connector: ${connector} is not in the kit.`], accountless: true }
      return { issues: listIssuesOf(kit, definition), accountless: kit.account.kind === 'none' }
    },
    /**
     * The read rules a source fails whatever else is wrong with its definition: the same issues
     * `proposable` gives for the operation and the fixed input, so a refusal for the shape carries them too.
     */
    sourceIssues(
      connector: string,
      source: { operation: string; input: Readonly<Record<string, unknown>> },
    ) {
      const kit = connectorIn(deps, connector)
      return kit === undefined ? [] : sourceIssuesOf(kit, source)
    },
    /** Where the connector's provider counts its call limit; none when it declares no list read. */
    countedBy(connector: string): 'APP' | 'ACCOUNT' | null {
      return connectorIn(deps, connector)?.callLimit?.countedBy ?? null
    },
  })
}
