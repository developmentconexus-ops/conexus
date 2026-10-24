import { randomUUID } from 'node:crypto'
import { CompanyId, ConversationId, PersonId, ProjectId, RunId } from '@conexus/hub-api'
import { and, eq, gt, inArray, isNotNull, isNull, lt, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import { personNameColumn } from '../../hub/identity/public.ts'
import type { Database } from '../../platform/database.ts'
import { Sha } from '../git/public.ts'
import { LEASE_MS } from './lease.ts'
import { run } from './tables.ts'

const Row = z.object({
  id: RunId,
  companyId: CompanyId,
  projectId: ProjectId,
  personId: PersonId,
  conversationId: ConversationId,
  state: z.enum([
    'open',
    'waiting',
    'saving',
    'saved',
    'unchanged',
    'stopped',
    'interrupted',
    'failed',
  ]),
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

/** The states of a run whose turn is not over: it runs, waits on the person, or saves. */
export const LIVE = ['open', 'waiting', 'saving'] as const satisfies readonly RunState[]

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

  /** The name of the person whose turn holds the Projeto, if a turn does and the person is still there. */
  async holder(companyId: CompanyId, projectId: ProjectId): Promise<string | undefined> {
    const [row] = await this.#database.read(inCompany(companyId), (tx) =>
      tx
        .select({ name: personNameColumn(run.personId) })
        .from(run)
        .where(and(eq(run.projectId, projectId), inArray(run.state, LIVE))),
    )
    return row?.name ?? undefined
  }

  async get(companyId: CompanyId, id: RunId): Promise<Run | undefined> {
    const [row] = await this.#database.read(inCompany(companyId), (tx) =>
      tx.select(columns).from(run).where(eq(run.id, id)),
    )
    return row === undefined ? undefined : Row.parse(row)
  }

  /**
   * The one change of a run in `from` (code C21): only while this copy of the program holds it (data
   * D25), so a run another copy took, or a removal stopped, is never changed here.
   */
  async #change(
    companyId: CompanyId,
    id: RunId,
    from: RunState | RunState[],
    set: { state: RunState } | { baseSha: Sha } | { candidateSha: Sha },
  ) {
    const rows = await this.#database.command(inCompany(companyId), (tx) =>
      tx
        .update(run)
        .set(set)
        .where(and(eq(run.id, id), inArray(run.state, [from].flat()), eq(run.owner, this.#owner)))
        .returning({ id: run.id }),
    )
    return rows.length > 0
  }

  /** The turn ends and its save begins; false when the run is not this copy's and `open` or `waiting`. */
  claim(companyId: CompanyId, id: RunId) {
    return this.#change(companyId, id, ['open', 'waiting'], { state: 'saving' })
  }

  /** The turn waits on the person's answer, or goes on after it; false when it is not this copy's to change. */
  wait(companyId: CompanyId, id: RunId, waiting: boolean) {
    const [from, to] = waiting ? (['open', 'waiting'] as const) : (['waiting', 'open'] as const)
    return this.#change(companyId, id, from, { state: to })
  }

  /** Whether another copy of the program holds the run now: its machine is that copy's. */
  async heldElsewhere(companyId: CompanyId, id: RunId) {
    const [row] = await this.#database.read(inCompany(companyId), (tx) =>
      tx.select({ owner: run.owner }).from(run).where(eq(run.id, id)),
    )
    return row !== undefined && row.owner !== this.#owner
  }

  /** The save of a run this copy holds ends in `to`; false once it is not this copy's to end. */
  end(companyId: CompanyId, id: RunId, to: RunState) {
    return this.#change(companyId, id, 'saving', { state: to })
  }

  /** The base of a save this copy holds; false once it is not this copy's or not `saving`. */
  setBase(companyId: CompanyId, id: RunId, base: Sha) {
    return this.#change(companyId, id, 'saving', { baseSha: base })
  }

  /** The candidate of a save this copy holds, before `main` moves; false once it is not this copy's or not `saving`. */
  setCandidate(companyId: CompanyId, id: RunId, candidate: Sha) {
    return this.#change(companyId, id, 'saving', { candidateSha: candidate })
  }

  /**
   * A removal stops the runs not over of its scope, whoever holds them (card, criterion 24): the
   * holder's next move finds them `stopped`.
   */
  async stop(input: { companyId: CompanyId; projectId?: ProjectId; personId?: PersonId }) {
    const rows = await this.#database.command(inCompany(input.companyId), (tx) =>
      tx
        .update(run)
        .set({ state: 'stopped' })
        .where(
          and(
            inArray(run.state, LIVE),
            input.projectId === undefined ? undefined : eq(run.projectId, input.projectId),
            input.personId === undefined ? undefined : eq(run.personId, input.personId),
          ),
        )
        .returning({ id: run.id }),
    )
    return rows.map((row) => RunId.parse(row.id))
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
          .where(and(eq(run.owner, this.#owner), inArray(run.state, ['open', 'waiting']))),
      )
    }
  }

  /**
   * Takes the company's runs not over whose lease ended, for one Projeto, one conversation or all:
   * their copy of the program is gone, and this one settles them now (data D25).
   */
  async takeExpired(
    companyId: CompanyId,
    of: { projectId?: ProjectId; conversationId?: ConversationId } = {},
  ): Promise<Run[]> {
    const rows = await this.#database.command(inCompany(companyId), (tx) =>
      tx
        .update(run)
        .set({ owner: this.#owner, leaseUntil: leaseEnd() })
        .where(
          and(
            inArray(run.state, LIVE),
            lt(run.leaseUntil, sql`now()`),
            of.projectId === undefined ? undefined : eq(run.projectId, of.projectId),
            of.conversationId === undefined ? undefined : eq(run.conversationId, of.conversationId),
          ),
        )
        .returning(columns),
    )
    return rows.map((row) => Row.parse(row))
  }

  /** In how many milliseconds the last lease of the company's live runs another copy holds ends, or none. */
  async heldElsewhereFor(companyId: CompanyId): Promise<number | undefined> {
    const [row] = await this.#database.read(inCompany(companyId), (tx) =>
      tx
        .select({
          ms: sql<string | null>`extract(epoch from max(${run.leaseUntil}) - now()) * 1000`,
        })
        .from(run)
        .where(
          and(inArray(run.state, LIVE), ne(run.owner, this.#owner), gt(run.leaseUntil, sql`now()`)),
        ),
    )
    return row?.ms === null || row?.ms === undefined ? undefined : Math.ceil(Number(row.ms))
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
}
