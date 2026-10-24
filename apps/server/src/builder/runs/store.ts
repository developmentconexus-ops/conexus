import type { ConversationId, PersonId } from '@conexus/hub-api'
import { CompanyId, ProjectId, RunId } from '@conexus/hub-api'
import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'
import { personNameColumn } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import { Sha } from '../git/public.ts'
import { run } from './tables.ts'

const Saved = z.object({
  id: RunId,
  companyId: CompanyId,
  projectId: ProjectId,
  candidateSha: Sha,
})
/** A version a turn saved: its run, its Projeto and the commit `main` moved to. */
export type SavedRun = z.infer<typeof Saved>

function inCompany(companyId: CompanyId) {
  return { kind: 'COMPANY', companyId, personId: null } as const
}

/** The `builder.run` rows of the versions saved, each call in the company's own scope (data D25). */
export class RunStore {
  readonly #database: Database

  constructor(database: Database) {
    this.#database = database
  }

  /** The person's name, for the `RUN_BUSY` of whoever holds the Projeto; none once they are gone. */
  async nameOf(companyId: CompanyId, personId: PersonId): Promise<string | undefined> {
    const found = await this.#database.read(inCompany(companyId), (tx) =>
      tx.execute(sql`select ${personNameColumn(sql`${personId}`)} as name`),
    )
    const name: unknown = Object(found.rows[0]).name
    return typeof name === 'string' ? name : undefined
  }

  /** Keeps a saved version, for its copy to the bucket and the removal that takes it. */
  async saved(
    input: SavedRun & { personId: PersonId; conversationId: ConversationId; deadlineAt: Date },
  ) {
    await this.#database.command(inCompany(input.companyId), (tx) =>
      tx.insert(run).values({ ...input, state: 'saved', leaseUntil: new Date(), owner: input.id }),
    )
  }

  async markCopied(companyId: CompanyId, id: RunId) {
    await this.#database.command(inCompany(companyId), (tx) =>
      tx.update(run).set({ copiedAt: new Date() }).where(eq(run.id, id)),
    )
  }

  /** The saved versions of the company whose copy is not made. */
  async uncopied(companyId: CompanyId): Promise<SavedRun[]> {
    const rows = await this.#database.read(inCompany(companyId), (tx) =>
      tx
        .select({
          id: run.id,
          companyId: run.companyId,
          projectId: run.projectId,
          candidateSha: run.candidateSha,
        })
        .from(run)
        .where(and(eq(run.state, 'saved'), isNotNull(run.candidateSha), isNull(run.copiedAt))),
    )
    return rows.map((row) => Saved.parse(row))
  }

  async companiesWithRuns(): Promise<CompanyId[]> {
    const found = await this.#database.installationRead((tx) =>
      tx.execute(sql`select company_id from builder.companies_with_runs()`),
    )
    return found.rows.map((row) => CompanyId.parse(Object(row).company_id))
  }

  /** The Projetos of the company that have a run. */
  async projectsOf(companyId: CompanyId): Promise<ProjectId[]> {
    const rows = await this.#database.read(inCompany(companyId), (tx) =>
      tx.selectDistinct({ id: run.projectId }).from(run),
    )
    return rows.map((row) => ProjectId.parse(row.id))
  }

  /** Whether a version of the Projeto was ever saved: only then is there anything in the bucket. */
  async hasVersion(companyId: CompanyId, projectId: ProjectId): Promise<boolean> {
    const found = await this.#database.read(inCompany(companyId), (tx) =>
      tx
        .select({ id: run.id })
        .from(run)
        .where(and(eq(run.projectId, projectId), isNotNull(run.candidateSha)))
        .limit(1),
    )
    return found.length > 0
  }
}
