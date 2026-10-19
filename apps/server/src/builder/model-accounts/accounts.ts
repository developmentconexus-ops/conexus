import { randomUUID } from 'node:crypto'
import type { CompanyId, ModelAccount, Owner, Person, SignInKind } from '@conexus/hub-api'
import {
  ACCOUNT_LABEL_MAX_LENGTH,
  AccountKind,
  AccountState,
  ModelAccountId,
  PersonId,
  ProviderId,
} from '@conexus/hub-api'
import { and, asc, eq, isNull, max, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import { personNameColumn } from '../../hub/identity/public.ts'
import type { CommandTx, Database, ReadTx, Scope } from '../../platform/database.ts'
import { transactionLock } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { Credential, SealKeys } from '../../platform/seal.ts'
import { open, seal } from '../../platform/seal.ts'
import { openKindsOf } from './kinds.ts'
import { modelAccount, modelAccountAssignee } from './tables.ts'

export type Deps = { database: Database; identity: IdentityPorts; sealKeys: SealKeys }
export type Viewer = { person: Person; companyId: CompanyId }

export const HINT_LENGTH = 4

export const AccountRow = z.object({
  id: ModelAccountId,
  personId: PersonId.nullable(),
  kind: AccountKind,
  provider: ProviderId,
  label: z.string().min(1),
  position: z.number().int().nonnegative(),
  state: AccountState,
  hint: z.string().length(HINT_LENGTH).nullable(),
  linkedBy: z.string().nullable(),
  linkedAt: z.date(),
  revision: z.number().int().nonnegative(),
  attemptKey: z.string(),
})
export type AccountRow = z.infer<typeof AccountRow>

// Every column but `sealed`, which the company's role cannot read (Grant A).
export const columns = {
  id: modelAccount.id,
  personId: modelAccount.personId,
  kind: modelAccount.kind,
  provider: modelAccount.provider,
  label: modelAccount.label,
  position: modelAccount.position,
  state: modelAccount.state,
  hint: modelAccount.hint,
  linkedBy: personNameColumn(modelAccount.linkedBy),
  linkedAt: modelAccount.linkedAt,
  revision: modelAccount.revision,
  attemptKey: modelAccount.attemptKey,
}

export function scopeOf(viewer: Viewer): Scope {
  return { kind: 'COMPANY', companyId: viewer.companyId, personId: viewer.person.id }
}

/** A name as stored: trimmed, in normal form C, 1 to 60 characters, or the form's 422. */
export function labelOf(typed: string): string {
  const label = typed.trim().normalize('NFC')
  if (label.length < 1 || label.length > ACCOUNT_LABEL_MAX_LENGTH)
    throw new Failure('MODEL_ACCOUNT_INVALID', { details: { reason: 'LABEL' } })
  return label
}

/**
 * Admits the viewer for an account of this owner: every member for their own, an owner or an
 * administrator for the company's; anyone else gets the same not-found (security S10).
 */
export function admitFor(deps: Deps, tx: ReadTx, viewer: Viewer, owner: Owner) {
  return deps.identity.admitMember({
    tx,
    personId: viewer.person.id,
    companyId: viewer.companyId,
    action: owner === 'company' ? 'manageModelAccounts' : 'manageOwnModelAccounts',
  })
}

export function ownerOf(row: { personId: string | null }): Owner {
  return row.personId === null ? 'company' : 'me'
}

export type Context = { assignees: Map<string, PersonId[]>; open: Set<SignInKind> }

export function viewOf(row: AccountRow, context: Context): ModelAccount {
  const { attemptKey: _attemptKey, personId: _personId, ...shown } = row
  return {
    ...shown,
    owner: ownerOf(row),
    kindOff: row.kind !== 'api_key' && !context.open.has(row.kind),
    linkedAt: row.linkedAt.toISOString(),
    assignees: context.assignees.get(row.id) ?? [],
  }
}

export async function contextOf(tx: ReadTx, companyId: CompanyId): Promise<Context> {
  const given = await tx
    .select({ accountId: modelAccountAssignee.accountId, personId: modelAccountAssignee.personId })
    .from(modelAccountAssignee)
    .where(eq(modelAccountAssignee.companyId, companyId))
    .orderBy(asc(modelAccountAssignee.personId))
  const assignees = new Map<string, PersonId[]>()
  for (const { accountId, personId } of given) {
    assignees.set(accountId, [...(assignees.get(accountId) ?? []), PersonId.parse(personId)])
  }
  return { assignees, open: await openKindsOf(tx, companyId) }
}

/** One account the viewer may see, as they see it now. */
export async function accountView(tx: ReadTx, viewer: Viewer, id: string): Promise<ModelAccount> {
  const [row] = await tx.select(columns).from(modelAccount).where(ofCompany(viewer, id))
  if (row === undefined) throw new Failure('NOT_FOUND')
  return viewOf(AccountRow.parse(row), await contextOf(tx, viewer.companyId))
}

export function ofCompany(viewer: Viewer, id: string) {
  return and(eq(modelAccount.id, id), eq(modelAccount.companyId, viewer.companyId))
}

/** The row, held until commit: a change, a gift and a removal of one account meet here (C65). */
export async function lockedRow(
  tx: CommandTx,
  viewer: Viewer,
  id: string,
): Promise<AccountRow | undefined> {
  const [row] = await tx
    .select(columns)
    .from(modelAccount)
    .where(ofCompany(viewer, id))
    .for('update')
  return row === undefined ? undefined : AccountRow.parse(row)
}

/** Makes a second write on one queue wait for the first (code C65): its positions are counted here. */
export async function lockQueue(
  tx: CommandTx,
  queue: { companyId: CompanyId; personId: string | null; provider: string },
) {
  await transactionLock(
    tx,
    `conexus.model-queue:${queue.companyId}:${queue.personId ?? ''}:${queue.provider}`,
  )
}

export function ofQueue(queue: {
  companyId: CompanyId
  personId: string | null
  provider: string
}) {
  return and(
    eq(modelAccount.companyId, queue.companyId),
    queue.personId === null
      ? isNull(modelAccount.personId)
      : eq(modelAccount.personId, queue.personId),
    eq(modelAccount.provider, queue.provider),
  )
}

export type NewAccount = {
  owner: Owner
  kind: AccountKind
  provider: ProviderId
  label: string
  credential: Credential
  hint: string | null
  attemptKey: string
}

/**
 * Seals the credential to its new row and writes it at the end of its queue, under the queue's lock
 * the caller holds (decision 0049): nothing is called, linking only seals and keeps (founder, C3).
 */
export async function insertAccount(
  deps: Deps,
  tx: CommandTx,
  viewer: Viewer,
  account: NewAccount,
): Promise<string> {
  const personId = account.owner === 'company' ? null : viewer.person.id
  const queue = { companyId: viewer.companyId, personId, provider: account.provider }
  await lockQueue(tx, queue)
  const [last] = await tx
    .select({ position: max(modelAccount.position) })
    .from(modelAccount)
    .where(ofQueue(queue))
  const id = randomUUID()
  const sealed = seal(
    deps.sealKeys,
    sealContext({ ...queue, id, kind: account.kind }),
    account.credential,
  )
  await tx.insert(modelAccount).values({
    id,
    ...queue,
    kind: account.kind,
    label: account.label,
    position: last?.position === null || last === undefined ? 0 : last.position + 1,
    state: 'ready',
    sealed: Buffer.from(sealed.blob),
    keyId: sealed.keyId,
    hint: account.hint,
    linkedBy: viewer.person.id,
    linkedAt: sql`statement_timestamp()`,
    revision: 1,
    attemptKey: account.attemptKey,
  })
  return id
}

export function sealContext(row: {
  id: string
  companyId: string
  personId: string | null
  kind: string
  provider: string
}) {
  return {
    purpose: 'model-account',
    rowId: row.id,
    companyId: row.companyId,
    personId: row.personId,
    kind: row.kind,
    provider: row.provider,
  } as const
}

/** The credential sealed in an account, through the one function that hands it out (Grant A). */
export async function credentialOf(
  deps: Deps,
  tx: ReadTx,
  row: AccountRow & { companyId: string },
) {
  const result = await tx.execute(sql`select sealed, key_id from builder.sealed_of(${row.id})`)
  const found = z.object({ sealed: z.instanceof(Buffer), key_id: z.string() }).parse(result.rows[0])
  return open(deps.sealKeys, sealContext(row), { keyId: found.key_id, blob: found.sealed })
}

/**
 * The visible account, held, and the admission for its owner: a member asking for the company's, or
 * anyone for an account that is not there or not theirs, gets the same not-found (security S10).
 */
export async function heldFor(deps: Deps, tx: CommandTx, viewer: Viewer, id: string) {
  await deps.identity.admitMember({
    tx,
    personId: viewer.person.id,
    companyId: viewer.companyId,
    action: 'readModelAccounts',
  })
  const row = await lockedRow(tx, viewer, id)
  if (row === undefined) return undefined
  await admitFor(deps, tx, viewer, ownerOf(row))
  return row
}
