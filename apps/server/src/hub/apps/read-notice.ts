import type { AppHost, recordAppRead } from '@conexus/hub-api'
import type { z } from 'zod'
import { Failure } from '../../platform/failure.ts'
import type { RecordAppRead } from './app-data-record.ts'
import type { AppDoor } from './handoff.ts'

type Notice = z.infer<typeof recordAppRead.input.body>

/**
 * One `db.query` an app made, as the dispatcher told it after answering the app: the session names
 * the person, the company and the Projeto, the body only the query and its outcome. A line the
 * Registro cannot write answers 503, and the dispatcher sends it again under the same id. A
 * conference's query reads only the empty test schema, so it leaves no line.
 */
export async function recordNotice(
  deps: { admitCall: AppDoor['admitCall']; recordRead: RecordAppRead },
  input: { host: AppHost; headers: Headers; notice: Notice },
): Promise<void> {
  const { ids, caller, environment } = await deps.admitCall(input)
  switch (environment) {
    case 'check':
      return
    case 'preview':
    case 'published':
      break
    default:
      return environment satisfies never
  }
  const { id, query, outcome, rows, ms } = input.notice
  const written = await deps.recordRead({
    ...{ id, companyId: ids.companyId, personId: caller.personId, by: 'app' },
    ...{ projectId: ids.projectId, agentId: null, threadId: null },
    ...{ verb: 'QUERY', tables: [], query, connectionId: null, operation: null },
    ...{ outcome, rows, ms },
  })
  if (written === 'UNRECORDED') throw new Failure('DATABASE_UNAVAILABLE', { details: ids })
}
