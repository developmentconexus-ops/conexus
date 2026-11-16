import { APP_CALL_LIMITS } from '@conexus/app-contract'
import type { CopyId, CopySample } from '@conexus/hub-api'
import { COPY_SAMPLE_ROWS } from '@conexus/hub-api'
import { Failure } from '../../platform/failure.ts'
import { readCopyTable } from './read-table.ts'
import type { CopiesDeps, InCompany } from './store.ts'
import { personScope, storedCopy } from './store.ts'

/** The first rows of a copy's table for whoever reads its rows (`readCopyRows`); a table not made yet is an empty sample. */
export async function sampleOf(
  deps: CopiesDeps,
  input: InCompany & { copyId: CopyId; signal: AbortSignal },
): Promise<CopySample> {
  const { companyId, copyId } = input
  const signal = AbortSignal.any([
    input.signal,
    AbortSignal.timeout(APP_CALL_LIMITS.callDeadlineMs),
  ])
  const stored = await deps.database.read(personScope(input), async (tx) => {
    await deps.identity.admitMember({ tx, ...input, action: 'readCopyRows' })
    return storedCopy(tx, input)
  })
  if (stored === undefined) throw new Failure('COPY_NOT_FOUND')
  const read = await readCopyTable(deps, {
    ...{ companyId, personId: input.personId, stored, limit: COPY_SAMPLE_ROWS, signal },
    reader: { kind: 'ALL' },
  })
  switch (read.kind) {
    case 'ROWS':
      return { columns: read.columns, rows: read.rows, complete: read.complete }
    case 'NO_TABLE':
      return {
        columns: stored.definition.columns.map(({ name }) => name),
        rows: [],
        complete: true,
      }
    case 'UNAVAILABLE':
      deps.log.error({ companyId, copyId, reason: read.reason }, 'COPY_SAMPLE_FAILED')
      throw new Failure('COPY_DATABASE_UNAVAILABLE')
    case 'NOT_IN_ROLE':
      throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'NOT_IN_ROLE' } })
    default:
      return read satisfies never
  }
}
