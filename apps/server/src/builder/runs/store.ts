import { randomUUID } from 'node:crypto'
import {
  CompanyId,
  ConversationEvent,
  ConversationId,
  PersonId,
  ProjectId,
  RunId,
} from '@conexus/hub-api'
import { and, asc, desc, eq, gt, inArray, isNotNull, isNull, lt, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Database } from '../../platform/database.ts'
import { Sha } from '../git/public.ts'
import { LEASE_MS } from './lease.ts'
import { run, runEvent } from './tables.ts'

const Row = z.object({
  id: RunId,
  companyId: CompanyId,
  projectId: ProjectId,
  personId: PersonId,
  conversationId: ConversationId,
  state: z.enum(['open', 'saving', 'saved', 'unchanged', 'stopped', 'interrupted', 'failed']),
  baseSha: Sha.nullable(),
  candidateSha: Sha.nullable(),
  deadlineAt: z.date(),
})
export type Run = z.infer<typeof Row>
export type RunState = Run['state']

const columns = {
  id: run.id,
  companyId: run.companyId,
  projectId: run.projectId,
  personId: run.personId,
  conversationId: run.conversationId,
  state: run.state,
  baseSha: run.baseSha,
  candidateSha: run.candidateSha,
  deadlineAt: run.deadlineAt,
}
const LIVE = ['open', 'saving']

function leaseEnd() {
  return new Date(Date.now() + LEASE_MS)
}

function inCompany(companyId: CompanyId) {
  return { kind: 'COMPANY', companyId, personId: null } as const
}

/** The `builder.run` rows, each call in the company's own scope (data D25). */
export class RunStore {
  readonly #database: Database
  readonly #owner: string

  constructor(database: Database, owner: string) {
    this.#database = database
    this.#owner = owner
  }

  /** Opens a run for the Projeto, or answers `undefined` when one is open (the unique index). */
  async admit(input: {
    companyId: CompanyId
    projectId: ProjectId
    personId: PersonId
    conversationId: ConversationId
    deadlineAt: Date
  }): Promise<RunId | undefined> {
    const id = RunId.parse(randomUUID())
    const rows = await this.#database.command(inCompany(input.companyId), (tx) =>
      tx
        .insert(run)
        .values({ id, ...input, state: 'open', leaseUntil: leaseEnd(), owner: this.#owner })
        .onConflictDoNothing()
        .returning({ id: run.id }),
    )
    return rows.length === 0 ? undefined : id
  }

  async get(companyId: CompanyId, id: RunId): Promise<Run | undefined> {
    const [row] = await this.#database.read(inCompany(companyId), (tx) =>
      tx.select(columns).from(run).where(eq(run.id, id)),
    )
    return row === undefined ? undefined : Row.parse(row)
  }

  /** Moves the run from one state to another; false when it was not in `from`. */
  async move(input: {
    companyId: CompanyId
    id: RunId
    from: RunState
    to: RunState
    /** Only if this copy of the program still holds the run (data D25). */
    mine?: true
  }) {
    const rows = await this.#database.command(inCompany(input.companyId), (tx) =>
      tx
        .update(run)
        .set({ state: input.to })
        .where(
          and(
            eq(run.id, input.id),
            eq(run.state, input.from),
            input.mine === undefined ? undefined : eq(run.owner, this.#owner),
          ),
        )
        .returning({ id: run.id }),
    )
    return rows.length > 0
  }

  async setBase(companyId: CompanyId, id: RunId, base: Sha) {
    await this.#database.command(inCompany(companyId), (tx) =>
      tx.update(run).set({ baseSha: base }).where(eq(run.id, id)),
    )
  }

  async setCandidate(companyId: CompanyId, id: RunId, candidate: Sha) {
    await this.#database.command(inCompany(companyId), (tx) =>
      tx.update(run).set({ candidateSha: candidate }).where(eq(run.id, id)),
    )
  }

  async markCopied(companyId: CompanyId, id: RunId) {
    await this.#database.command(inCompany(companyId), (tx) =>
      tx.update(run).set({ copiedAt: new Date() }).where(eq(run.id, id)),
    )
  }

  /** Renews the lease of a run this copy drives, saving included; false once the row is not this copy's. */
  async renew(companyId: CompanyId, id: RunId) {
    const rows = await this.#database.command(inCompany(companyId), (tx) =>
      tx
        .update(run)
        .set({ leaseUntil: leaseEnd() })
        .where(and(eq(run.id, id), eq(run.owner, this.#owner), inArray(run.state, LIVE)))
        .returning({ id: run.id }),
    )
    return rows.length > 0
  }

  /** Lets go of the leases this copy holds, so another copy can take them at once (code C62). */
  async yieldLeases(companyIds: CompanyId[]) {
    for (const companyId of companyIds) {
      await this.#database.command(inCompany(companyId), (tx) =>
        tx
          .update(run)
          .set({ leaseUntil: new Date(0) })
          .where(and(eq(run.owner, this.#owner), eq(run.state, 'open'))),
      )
    }
  }

  /** The company's runs not over whose lease has ended, for one Projeto or for all. */
  async expired(companyId: CompanyId, projectId?: ProjectId): Promise<Run[]> {
    const rows = await this.#database.read(inCompany(companyId), (tx) =>
      tx
        .select(columns)
        .from(run)
        .where(
          and(
            inArray(run.state, LIVE),
            lt(run.leaseUntil, sql`now()`),
            projectId === undefined ? undefined : eq(run.projectId, projectId),
          ),
        ),
    )
    return rows.map((row) => Row.parse(row))
  }

  /** The company's runs in any of `states`, narrowed by Projeto or person. */
  async inStates(input: {
    companyId: CompanyId
    states: RunState[]
    projectId?: ProjectId
    personId?: PersonId
  }): Promise<Run[]> {
    const rows = await this.#database.read(inCompany(input.companyId), (tx) =>
      tx
        .select(columns)
        .from(run)
        .where(
          and(
            inArray(run.state, input.states),
            input.projectId === undefined ? undefined : eq(run.projectId, input.projectId),
            input.personId === undefined ? undefined : eq(run.personId, input.personId),
          ),
        ),
    )
    return rows.map((row) => Row.parse(row))
  }

  /** The saved versions of the company whose copy is not made. */
  async uncopied(companyId: CompanyId): Promise<Run[]> {
    const rows = await this.#database.read(inCompany(companyId), (tx) =>
      tx
        .select(columns)
        .from(run)
        .where(and(eq(run.state, 'saved'), isNotNull(run.candidateSha), isNull(run.copiedAt))),
    )
    return rows.map((row) => Row.parse(row))
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

  /** Keeps one event of the run's turn, numbered after the last, if the run is still this copy's. */
  async appendEvent(input: {
    companyId: CompanyId
    runId: RunId
    event: ConversationEvent
  }): Promise<number | undefined> {
    const { companyId, runId, event } = input
    const written = await this.#database.command(inCompany(companyId), (tx) =>
      tx.execute(sql`
        insert into builder.run_event (run_id, company_id, n, event)
        select r.id, r.company_id,
          coalesce((select max(e.n) from builder.run_event e where e.run_id = r.id), 0) + 1,
          ${JSON.stringify(event)}::jsonb
        from builder.run r
        where r.id = ${runId}::uuid and r.owner = ${this.#owner}::uuid
        returning n`),
    )
    const [row] = written.rows
    return row === undefined ? undefined : Number(Object(row).n)
  }

  /** At most `limit` events of a run after `after`, in order. */
  async readEvents(input: { companyId: CompanyId; runId: RunId; after: number; limit: number }) {
    const rows = await this.#database.read(inCompany(input.companyId), (tx) =>
      tx
        .select({ n: runEvent.n, event: runEvent.event })
        .from(runEvent)
        .where(and(eq(runEvent.runId, input.runId), gt(runEvent.n, input.after)))
        .orderBy(asc(runEvent.n))
        .limit(input.limit),
    )
    return rows.map((row) => ({ n: row.n, event: ConversationEvent.parse(row.event) }))
  }

  /** The conversation's latest run, or none. */
  async lastRunOf(companyId: CompanyId, conversationId: ConversationId) {
    const [row] = await this.#database.read(inCompany(companyId), (tx) =>
      tx
        .select({ id: run.id, state: run.state })
        .from(run)
        .where(eq(run.conversationId, conversationId))
        .orderBy(desc(run.deadlineAt))
        .limit(1),
    )
    return row === undefined ? undefined : { id: RunId.parse(row.id), state: row.state }
  }

  /**
   * Takes the runs of the company whose lease ended while `open`: this copy drives them now, or
   * saves them as they stand when their hour is over.
   */
  async takeOver(companyId: CompanyId): Promise<Run[]> {
    const rows = await this.#database.command(inCompany(companyId), (tx) =>
      tx
        .update(run)
        .set({ owner: this.#owner, leaseUntil: leaseEnd() })
        .where(and(eq(run.state, 'open'), lt(run.leaseUntil, sql`now()`)))
        .returning(columns),
    )
    return rows.map((row) => Row.parse(row))
  }
}
