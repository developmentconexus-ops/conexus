import type { CompanyId, DataReadFilters, Next, PersonId } from '@conexus/hub-api'
import {
  DATA_READS_EXPORT_MAX,
  DataReadEntry,
  PAGE_SIZE,
  PersonId as PersonIdSchema,
  ProjectId as ProjectIdSchema,
} from '@conexus/hub-api'
import { z } from 'zod'
import type { ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { pageKey, pageOf } from '../../platform/pages.ts'
import type { DataDeps } from './deps.ts'
import type { StoredRead } from './record.ts'
import { pageOfReads, periodOfReads } from './record.ts'

export type ReadsDeps = Pick<DataDeps, 'database' | 'identity' | 'projects'>

type InCompany = { companyId: CompanyId; personId: PersonId }

const DataReadId = z.uuid()

/** Only an owner or an administrator reads the Registro; anyone else gets the not-found of S10. */
async function admitted(deps: ReadsDeps, tx: ReadTx, input: InCompany) {
  const { companyId, personId } = input
  await deps.identity.admitMember({ tx, companyId, personId, action: 'readDataReads' })
}

/**
 * The page's rows as the contract says them, with the names of their people and Projetos read in
 * one batch each (criterion 73). Identity deletes no account, so every person has a name; a
 * Projeto deleted since keeps its id without one.
 */
async function entriesOf(deps: ReadsDeps, tx: ReadTx, companyId: CompanyId, rows: StoredRead[]) {
  const people = [...new Set(rows.map((row) => PersonIdSchema.parse(row.personId)))]
  const projects = [
    ...new Set(
      rows.flatMap((row) => (row.projectId ? [ProjectIdSchema.parse(row.projectId)] : [])),
    ),
  ]
  const named = await deps.identity.peopleNamed(tx, people)
  const projectNames = await deps.projects.liveProjectNamesOf(tx, { companyId, ids: projects })
  return rows.map((row) => {
    const person = named.get(PersonIdSchema.parse(row.personId))
    if (person === undefined) {
      throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'READER' } })
    }
    const projectId = row.projectId === null ? null : ProjectIdSchema.parse(row.projectId)
    return DataReadEntry.parse({
      ...{
        id: row.id,
        at: row.at.toISOString(),
        person: { id: person.personId, name: person.name },
      },
      agent: row.agent,
      project:
        projectId === null ? null : { id: projectId, name: projectNames.get(projectId) ?? null },
      ...{ agentId: row.agentId, threadId: row.threadId, verb: row.verb, tables: row.tables },
      ...{ connection: row.connectionId, operation: row.operation, query: row.query },
      ...{ outcome: row.outcome, rows: row.rows, ms: row.ms },
    })
  })
}

/** One page of the company's reads, newest first, 50 at most. */
export async function listDataReads(
  deps: ReadsDeps,
  input: InCompany & { filters: DataReadFilters; page: string | undefined },
): Promise<{ reads: DataReadEntry[]; next: Next }> {
  const { companyId, personId, filters } = input
  return deps.database.read({ kind: 'COMPANY', companyId, personId }, async (tx) => {
    await admitted(deps, tx, input)
    const after = pageKey(input.page, DataReadId)
    const rows = await pageOfReads(tx, { companyId, filters, after, limit: PAGE_SIZE + 1 })
    const page = pageOf(rows, (row) => row.id)
    return { reads: await entriesOf(deps, tx, companyId, page.rows), next: page.next }
  })
}

/** The reads of the filter in `[from, to)`, newest first, up to 5,000; `complete` is false when more were left out. */
export async function exportDataReads(
  deps: ReadsDeps,
  input: InCompany & { filters: DataReadFilters; from: string; to: string },
): Promise<{ reads: DataReadEntry[]; complete: boolean }> {
  const { companyId, personId, filters } = input
  return deps.database.read({ kind: 'COMPANY', companyId, personId }, async (tx) => {
    await admitted(deps, tx, input)
    const period = { from: new Date(input.from), to: new Date(input.to) }
    const limit = DATA_READS_EXPORT_MAX + 1
    const rows = await periodOfReads(tx, { companyId, filters, ...period, limit })
    const shown = rows.slice(0, DATA_READS_EXPORT_MAX)
    return {
      reads: await entriesOf(deps, tx, companyId, shown),
      complete: rows.length <= DATA_READS_EXPORT_MAX,
    }
  })
}
