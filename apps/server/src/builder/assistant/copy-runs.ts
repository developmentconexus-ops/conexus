import type {
  CompanyId,
  CopyInterval,
  CopyRun,
  CopyRunFailureCode,
  CopySchedule,
  CopySystemMessage,
  PersonId,
} from '@conexus/hub-api'
import { ASSISTANT_TOOL, FAILURES } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'
import type { AssistantCopies } from './ports.ts'

/** The most runs the model reads of one copy, the newest first. */
const RUNS_SHOWN = 5

type ToolRun = {
  startedAt: string
  endedAt: string | null
  outcome: CopyRun['outcome']['kind']
  failure: { code: CopyRunFailureCode; phrase: string; action: string } | null
  whole: boolean
  system: CopySystemMessage | null
}

type CopyRunsAnswer = {
  kind: 'RUNS'
  copy: {
    name: string
    connections: string[]
    schedule: CopySchedule
    interval: CopyInterval | null
  }
  runs: ToolRun[]
}

/**
 * The failure the tool throws when the table is not one the asker reads (code C79): Mastra hands the
 * model its message, the JSON `{ kind, status, code, message, body, reason }`, as the data tools'
 * refusals do. A table outside the role answers as one that does not exist (S10).
 */
class CopyRunsRefused extends Error {
  override readonly name = 'CopyRunsRefused'
}

const NOT_FOUND_REASON = 'No copy has this table name. Call data_describe to list the tables.'

function notFound(): never {
  throw new CopyRunsRefused(
    JSON.stringify({
      ...{ kind: 'NOT_FOUND', status: null, code: null, message: null, body: null },
      reason: NOT_FOUND_REASON,
    }),
  )
}

function toolRunOf(run: CopyRun): ToolRun {
  const { outcome } = run
  const failed = outcome.kind === 'ERROR'
  return {
    startedAt: run.startedAt,
    endedAt: run.endedAt,
    outcome: outcome.kind,
    failure: failed
      ? {
          code: outcome.code,
          phrase: FAILURES[outcome.code].phrase,
          action: FAILURES[outcome.code].action,
        }
      : null,
    whole: run.whole,
    system: failed ? outcome.system : null,
  }
}

/**
 * `copy_runs`: the latest runs of one of the company's copies, by its table name, for "why did this
 * copy stop?". Reads through the copies' own admission, so a table the asker's role does not read
 * is the `NOT_FOUND` of a name that does not exist.
 */
export function copyRunsTool(deps: {
  scopeOf: (
    requestContext: RequestContext,
  ) => Promise<{ companyId: CompanyId; personId: PersonId } | undefined>
  copies: () => AssistantCopies
}) {
  return createTool({
    id: ASSISTANT_TOOL.copyRuns,
    description:
      "The latest runs of one of the company's copies, by its table name in sync: when each ran, how it ended, the Conexus sentence and what to do, whether it reread everything, and what the source system said when it refused. Use it when someone asks why a copy failed or stopped.",
    inputSchema: z.object({ table: z.string().min(1).max(63) }),
    execute: async ({ table }, { requestContext }) => {
      const scope = requestContext === undefined ? undefined : await deps.scopeOf(requestContext)
      if (scope === undefined) {
        throw new Failure('INTERNAL_UNEXPECTED', {
          details: { reason: 'COPY_RUNS_WITHOUT_CONVERSATION' },
        })
      }
      const { companyId, personId } = scope
      const { copies } = await deps.copies().list({ companyId, personId, named: [] })
      const found = copies.find((each) => each.name === table)
      if (found === undefined) return notFound()
      const read = await deps
        .copies()
        .runs({ companyId, personId, copyId: found.id, page: undefined })
        .catch((cause: unknown) => {
          if (cause instanceof Failure && cause.code === 'COPY_NOT_FOUND') return notFound()
          throw cause
        })
      return {
        kind: 'RUNS',
        copy: {
          name: read.copy.name,
          connections: read.copy.sources.map((source) => source.connection.name),
          schedule: read.copy.schedule,
          interval: read.copy.interval,
        },
        runs: read.runs.slice(0, RUNS_SHOWN).map(toolRunOf),
      } satisfies CopyRunsAnswer
    },
  })
}
