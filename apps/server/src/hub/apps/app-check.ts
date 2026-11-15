import type { RowCount } from '@conexus/hub-api'
import { ROW_COUNT_CAP } from '@conexus/hub-api'
import { z } from 'zod'
import type { SqlStatement } from '../../platform/company-postgres.ts'
import { columnTypeName } from '../../platform/company-postgres.ts'
import type { AppDatabaseDeps } from './app-database.ts'
import { askApp } from './app-database.ts'
import type { AppReadInput } from './app-tables.ts'

/**
 * What a check of a read says of it: how many rows it gives, its columns with their types and the
 * time it took, never a row or a value. A refusal carries the database's SQLSTATE and nothing of its
 * message, which can hold a cell (`AppRead` does the same).
 */
export type AppCheck =
  | {
      kind: 'COUNTED'
      rows: Exclude<RowCount, { kind: 'UNKNOWN' }>
      columns: { name: string; type: string }[]
      ms: number
    }
  | { kind: 'REFUSED'; code: 'APP_DATA_REFUSED'; sqlstate: string }
  | { kind: 'NOT_A_COUNT' }
  | { kind: 'FAILED'; code: 'APP_DATA_NO_APP' | 'APP_DATA_UNAVAILABLE' | 'APP_DATA_TIMEOUT' }

/** The count's answer, one row of one integer: the text that closed the wrapper early gives more, or less. */
const Counted = z.tuple([z.tuple([z.coerce.number().int().min(0)])])

/** The read counted past the cap by one row, so that "over" is known without reading the rest. */
function countOf(statement: SqlStatement): SqlStatement {
  return {
    ...statement,
    text: `select count(*) from (select 1 from (\n${statement.text}\n) leitura limit ${ROW_COUNT_CAP + 1}) contada`,
  }
}

/**
 * The same read with no row: its columns, which PostgreSQL names whatever the rows. It nests as
 * deep as the count does, so text that closes both parentheses of the count is still one text to
 * PostgreSQL here, and reaches `NOT_A_COUNT` rather than a syntax error of this statement.
 */
function columnsOf(statement: SqlStatement): SqlStatement {
  return {
    ...statement,
    text: `select * from (select * from (\n${statement.text}\n) leitura limit 0) contada`,
  }
}

/**
 * One read of the Projeto's app checked on its real data (step Capacidade 3, U1): the count and the
 * columns in one read-only transaction as the read login, with the values bound in both statements.
 * It goes the way of `readAppData`: the login, `ensureReadLogin` when the app has none, the deadline.
 * The log carries ids, the kind of answer, the time and, as `readAppData` does, why a read failed
 * or was refused (code C50, security S41).
 */
export async function checkAppRead(
  deps: AppDatabaseDeps,
  input: AppReadInput & { statement: SqlStatement },
): Promise<AppCheck> {
  const { projectId } = input
  const { companyId } = input.scope
  const started = performance.now()
  const answer = await askApp(deps, {
    ...input,
    statements: [countOf(input.statement), columnsOf(input.statement)],
  })
  const ms = Math.round(performance.now() - started)
  const checked = checkedOf(answer, ms)
  deps.log.info(
    { companyId, projectId, answer: checked.kind, ms, ...whyOf(answer) },
    'APP_DATA_CHECKED',
  )
  return checked
}

/** Why a read did not come back with rows, as `readAppData` logs it: the SQLSTATE of a refusal, the code and cause of a failure. */
function whyOf(answer: Awaited<ReturnType<typeof askApp>>): Record<string, string> {
  switch (answer.kind) {
    case 'ROWS':
      return {}
    case 'REFUSED':
      return { sqlstate: answer.sqlstate }
    case 'FAILED':
      return { code: answer.code, cause: answer.cause ?? 'none' }
    default:
      return answer satisfies never
  }
}

function checkedOf(answer: Awaited<ReturnType<typeof askApp>>, ms: number): AppCheck {
  switch (answer.kind) {
    case 'ROWS': {
      const [counted, listed] = answer.results
      const count = Counted.safeParse(counted?.rows)
      if (!count.success || listed === undefined) return { kind: 'NOT_A_COUNT' }
      const [[total]] = count.data
      return {
        kind: 'COUNTED',
        rows: total > ROW_COUNT_CAP ? { kind: 'OVER' } : { kind: 'EXACT', rows: total },
        columns: listed.columns.map(({ name, typeId }) => ({ name, type: columnTypeName(typeId) })),
        ms,
      }
    }
    case 'REFUSED':
      return answer
    case 'FAILED':
      // The count and the columns read no row, so a reply past the cap is the database's silence.
      return {
        kind: 'FAILED',
        code: answer.code === 'APP_DATA_TOO_LARGE' ? 'APP_DATA_UNAVAILABLE' : answer.code,
      }
    default:
      return answer satisfies never
  }
}
