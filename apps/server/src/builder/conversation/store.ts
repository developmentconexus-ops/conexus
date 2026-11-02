import { createHash } from 'node:crypto'
import type { CompanyId, Person, PersonId } from '@conexus/hub-api'
import { ConversationId, PAGE_SIZE, ProjectId } from '@conexus/hub-api'
import { and, desc, eq, lt, or, sql } from 'drizzle-orm'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import type { ProjectPorts } from '../../hub/projects/public.ts'
import type { Database, Scope } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { pageOf } from '../../platform/pages.ts'
import type { ReleaseScope } from '../controller-kit/public.ts'
import { conversation } from './tables.ts'

type Deps = {
  database: Database
  identity: IdentityPorts
  projects: Pick<ProjectPorts, 'liveProjectOf'>
}
export type InProject = { person: Person; companyId: CompanyId; projectId: ProjectId }
export type OfConversation = InProject & { conversationId: ConversationId }
type Attempt = InProject & { attemptKey: string; bodyHash: string }

type Tx = Parameters<Parameters<Database['command']>[1]>[0]
type ReadTx = Parameters<Parameters<Database['read']>[1]>[0]

function scopeOf(input: InProject): Scope {
  return { kind: 'COMPANY', companyId: input.companyId, personId: input.person.id }
}

/** The hash a repeated Idempotency-Key is compared by (code C37): never the body itself. */
export function bodyHashOf(body: unknown): string {
  return createHash('sha256').update(JSON.stringify(body)).digest('base64url')
}

/** The person may converse in this company, and the Projeto is live; else the same 404 (S10). */
async function admitted(deps: Deps, tx: ReadTx, input: InProject): Promise<void> {
  await deps.identity.admitMember({
    tx,
    personId: input.person.id,
    companyId: input.companyId,
    action: 'useConversations',
  })
  if ((await deps.projects.liveProjectOf(tx, input)) === undefined) {
    throw new Failure('NOT_FOUND', { details: { reason: 'PROJECT' } })
  }
}

/**
 * The person's own conversation of this Projeto, or `CONVERSATION_NOT_FOUND`: another company's,
 * another person's and one that does not exist answer the same (security S10, T10).
 */
async function ownedConversation(deps: Deps, tx: ReadTx, input: OfConversation) {
  await admitted(deps, tx, input)
  const [row] = await tx
    .select({ createdAt: conversation.createdAt })
    .from(conversation)
    .where(
      and(
        eq(conversation.id, input.conversationId),
        eq(conversation.companyId, input.companyId),
        eq(conversation.projectId, input.projectId),
        eq(conversation.personId, input.person.id),
      ),
    )
  if (row === undefined) throw new Failure('CONVERSATION_NOT_FOUND')
  return { id: input.conversationId, createdAt: row.createdAt }
}

/**
 * The index row of a new conversation, written before its thread (data D17), under the id its
 * attempt derives (code C37). With no conflict target, the attempt's unique key holds too: a second
 * attempt waits on the index until the first is written, then writes nothing and reads that row, as
 * does a key a row of random id kept before the controller kit (step 24.3, U1b). The same body and
 * Projeto answer that row's id; another, `IDEMPOTENCY_CONFLICT` (`openSession`).
 */
async function keep(deps: Deps, input: Attempt & { id: ConversationId }) {
  return deps.database.command(scopeOf(input), async (tx: Tx) => {
    const { companyId, person } = input
    await admitted(deps, tx, input)
    const [made] = await tx
      .insert(conversation)
      .values({
        id: input.id,
        companyId,
        projectId: input.projectId,
        personId: person.id,
        attemptKey: input.attemptKey,
        bodyHash: input.bodyHash,
        createdAt: sql`statement_timestamp()`,
      })
      .onConflictDoNothing()
      .returning({ createdAt: conversation.createdAt })
    if (made !== undefined) return { kept: { made: true } as const, createdAt: made.createdAt }
    const [found] = await tx
      .select({
        id: conversation.id,
        projectId: conversation.projectId,
        bodyHash: conversation.bodyHash,
        createdAt: conversation.createdAt,
      })
      .from(conversation)
      .where(
        and(
          eq(conversation.companyId, companyId),
          eq(conversation.personId, person.id),
          eq(conversation.attemptKey, input.attemptKey),
        ),
      )
    if (found === undefined) {
      throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'CONVERSATION_ID_TAKEN' } })
    }
    const same = found.bodyHash === input.bodyHash && found.projectId === input.projectId
    // The column is a uuid; the contract's id narrows it once, here (code C27).
    const kept = { made: false, same, id: ConversationId.parse(found.id) } as const
    return { kept, createdAt: found.createdAt }
  })
}

/** The person's conversations of a Projeto, newest first, a page at a time (code C44). */
async function list(deps: Deps, input: InProject & { after: ConversationId | undefined }) {
  return deps.database.read(scopeOf(input), async (tx) => {
    await admitted(deps, tx, input)
    const mine = and(
      eq(conversation.companyId, input.companyId),
      eq(conversation.projectId, input.projectId),
      eq(conversation.personId, input.person.id),
    )
    const anchor = input.after
    const [last] =
      anchor === undefined
        ? []
        : await tx
            .select({ id: conversation.id, createdAt: conversation.createdAt })
            .from(conversation)
            .where(and(mine, eq(conversation.id, anchor)))
    const before =
      last === undefined
        ? undefined
        : or(
            lt(conversation.createdAt, last.createdAt),
            and(eq(conversation.createdAt, last.createdAt), lt(conversation.id, last.id)),
          )
    const rows = await tx
      .select({ id: conversation.id, createdAt: conversation.createdAt })
      .from(conversation)
      .where(and(mine, before))
      .orderBy(desc(conversation.createdAt), desc(conversation.id))
      .limit(PAGE_SIZE + 1)
    const page = pageOf(rows, (row) => row.id)
    const shown = page.rows.map((row) => ({ ...row, id: ConversationId.parse(row.id) }))
    return { rows: shown, next: page.next }
  })
}

/**
 * The person's conversation of a company, whichever Projeto holds it, or `CONVERSATION_NOT_FOUND`:
 * what Mastra's routes, which name no Projeto, are checked by (`guard.ts`, security S10).
 */
async function mine(
  deps: Deps,
  input: { person: Person; companyId: CompanyId; conversationId: ConversationId },
) {
  const scope: Scope = { kind: 'COMPANY', companyId: input.companyId, personId: input.person.id }
  await deps.database.read(scope, async (tx) => {
    const [row] = await tx
      .select({ projectId: conversation.projectId })
      .from(conversation)
      .where(
        and(
          eq(conversation.id, input.conversationId),
          eq(conversation.companyId, input.companyId),
          eq(conversation.personId, input.person.id),
        ),
      )
    if (row === undefined) throw new Failure('CONVERSATION_NOT_FOUND')
    await admitted(deps, tx, { ...input, projectId: ProjectId.parse(row.projectId) })
  })
}

/** Drops the index row of a conversation whose thread Mastra does not hold (data D17). */
async function remove(deps: Deps, input: OfConversation) {
  await deps.database.command(scopeOf(input), (tx: Tx) =>
    tx
      .delete(conversation)
      .where(
        and(
          eq(conversation.id, input.conversationId),
          eq(conversation.companyId, input.companyId),
          eq(conversation.personId, input.person.id),
        ),
      ),
  )
}

/** The Projeto of the person's conversation, or none: what a Mastra run of it writes in (`turnOf`). */
async function projectOf(
  deps: Deps,
  input: { companyId: CompanyId; personId: PersonId; conversationId: ConversationId },
): Promise<ProjectId | undefined> {
  const { companyId, personId, conversationId } = input
  const [row] = await deps.database.read({ kind: 'COMPANY', companyId, personId }, (tx) =>
    tx
      .select({ projectId: conversation.projectId })
      .from(conversation)
      .where(
        and(
          eq(conversation.id, conversationId),
          eq(conversation.companyId, companyId),
          eq(conversation.personId, personId),
        ),
      ),
  )
  return row === undefined ? undefined : ProjectId.parse(row.projectId)
}

/** The conversations a release deletes the threads of, read with the Hub's own company scope. */
async function releasedIds(deps: Deps, scope: ReleaseScope): Promise<ConversationId[]> {
  const hub: Scope = { kind: 'COMPANY', companyId: scope.companyId, personId: null }
  const rows = await deps.database.read(hub, (tx) =>
    tx
      .select({ id: conversation.id })
      .from(conversation)
      .where(
        and(
          eq(conversation.companyId, scope.companyId),
          scope.projectId === undefined ? undefined : eq(conversation.projectId, scope.projectId),
          scope.personId === undefined ? undefined : eq(conversation.personId, scope.personId),
        ),
      ),
  )
  return rows.map((row) => ConversationId.parse(row.id))
}

export function createConversationStore(deps: Deps) {
  return Object.freeze({
    /** The person may converse in this company, and the Projeto is live; else the same 404. */
    admit: (input: InProject) =>
      deps.database.read(scopeOf(input), (tx) => admitted(deps, tx, input)),
    keep: (input: Parameters<typeof keep>[1]) => keep(deps, input),
    list: (input: Parameters<typeof list>[1]) => list(deps, input),
    owned: (input: OfConversation) =>
      deps.database.read(scopeOf(input), (tx) => ownedConversation(deps, tx, input)),
    mine: (input: Parameters<typeof mine>[1]) => mine(deps, input),
    remove: (input: OfConversation) => remove(deps, input),
    releasedIds: (scope: ReleaseScope) => releasedIds(deps, scope),
    projectOf: (input: Parameters<typeof projectOf>[1]) => projectOf(deps, input),
  })
}

export type ConversationStore = ReturnType<typeof createConversationStore>
