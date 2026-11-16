import { APP_CALL_LIMITS } from '@conexus/app-contract'
import type { CopyId, CopySample } from '@conexus/hub-api'
import { COPY_SAMPLE_ROWS } from '@conexus/hub-api'
import { Failure } from '../../platform/failure.ts'
import { readCopyTable } from './read-table.ts'
import { marksOf, readerOf } from './readers.ts'
import type { CopiesDeps, InCompany } from './store.ts'
import { personScope, storedCopy } from './store.ts'

/** The first rows of a copy's table, read as the member's role (S10); a table not made yet is an empty sample. */
export async function sampleOf(
  deps: CopiesDeps,
  input: InCompany & { copyId: CopyId; signal: AbortSignal },
): Promise<CopySample> {
  const { companyId, copyId } = input
  const signal = AbortSignal.any([
    input.signal,
    AbortSignal.timeout(APP_CALL_LIMITS.callDeadlineMs),
  ])
  const { stored, reader } = await deps.database.read(personScope(input), async (tx) => {
    const proof = await deps.identity.admitMember({ tx, ...input, action: 'seeData' })
    const found = await storedCopy(tx, input)
    if (found === undefined) throw new Failure('COPY_NOT_FOUND')
    const asked = await readerOf(deps, tx, { companyId, role: proof.role })
    const marked = asked.kind === 'ROLE' && (await marksOf(tx, companyId, asked.roleId))
    if (asked.kind === 'NONE' || (marked && !marked.includes(copyId))) {
      const manages = deps.identity.allows(proof.role, 'manageCopies')
      throw new Failure(manages ? 'COPY_NOT_IN_ROLE' : 'COPY_NOT_FOUND')
    }
    return { stored: found, reader: asked }
  })
  const read = await readCopyTable(deps, {
    ...{ companyId, personId: input.personId, stored, limit: COPY_SAMPLE_ROWS, signal },
    reader,
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
      throw new Failure('COPY_NOT_IN_ROLE')
    default:
      return read satisfies never
  }
}
