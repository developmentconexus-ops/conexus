import type { Owner, ProviderId, ProviderOrder } from '@conexus/hub-api'
import { ModelFallback } from '@conexus/hub-api'
import { and, asc, eq } from 'drizzle-orm'
import { transactionLock } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { Credential } from '../../platform/seal.ts'
import type { Context, Deps, Viewer } from './accounts.ts'
import {
  AccountRow,
  accountView,
  admitFor,
  columns,
  contextOf,
  credentialOf,
  HINT_LENGTH,
  insertAccount,
  labelOf,
  ownerOf,
  partOf,
  scopeOf,
  usableInOrder,
  viewOf,
} from './accounts.ts'
import type { Change } from './changes.ts'
import {
  assign,
  change,
  clearMine,
  order,
  remove,
  setDefault,
  setFallback,
  setMine,
} from './changes.ts'
import { choicesOf } from './choices.ts'
import { savedDefaults, startsOf } from './defaults.ts'
import { keyProviderOf } from './providers.ts'
import { keepServed } from './served.ts'
import { companyModelFallback, modelAccount } from './tables.ts'

/**
 * The person's order for each provider (P2): their own, then the company's given to them, then the
 * company's for everyone, each part in its owner's order.
 */
function ordersOf(viewer: Viewer, rows: AccountRow[], context: Context): ProviderOrder[] {
  const byProvider = new Map<ProviderId, AccountRow[][]>()
  for (const row of rows) {
    const part = partOf(row, context, viewer.person.id)
    if (part === undefined) continue
    const parts = byProvider.get(row.provider) ?? [[], [], []]
    parts[part]?.push(row)
    byProvider.set(row.provider, parts)
  }
  return [...byProvider.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([provider, parts]) => ({
      provider,
      accounts: parts.flatMap((part) =>
        part.sort((a, b) => a.position - b.position).map(({ id }) => id),
      ),
    }))
}

/** The providers the viewer may converse with now: those with an account the queue would call. */
function usableProviders(viewer: Viewer, rows: AccountRow[], context: Context): ProviderId[] {
  const usable = usableInOrder(rows, context, viewer.person.id).map((row) => row.provider)
  return [...new Set(usable)].sort()
}

/** What the viewer reads of the company's accounts and their own; no one reads another's (D4). */
function list(deps: Deps, viewer: Viewer) {
  return deps.database.read(scopeOf(viewer), async (tx) => {
    const admitted = await deps.identity.admitMember({
      tx,
      personId: viewer.person.id,
      companyId: viewer.companyId,
      action: 'readModelAccounts',
    })
    const rows = (
      await tx
        .select(columns)
        .from(modelAccount)
        .where(eq(modelAccount.companyId, viewer.companyId))
        .orderBy(asc(modelAccount.provider), asc(modelAccount.position))
    ).map((row) => AccountRow.parse(row))
    const context = await contextOf(tx, viewer.companyId)
    const who = { companyId: viewer.companyId, personId: viewer.person.id }
    const { mine, company } = await savedDefaults(tx, who)
    const [switched] = await tx
      .select({
        enabled: companyModelFallback.enabled,
        chain: companyModelFallback.chain,
        revision: companyModelFallback.revision,
      })
      .from(companyModelFallback)
      .where(eq(companyModelFallback.companyId, viewer.companyId))
    return {
      company: rows.filter((row) => row.personId === null).map((row) => viewOf(row, context)),
      mine: rows.filter((row) => row.personId !== null).map((row) => viewOf(row, context)),
      order: ordersOf(viewer, rows, context),
      usableProviders: usableProviders(viewer, rows, context),
      kinds: [...context.open].sort(),
      defaults: { company, mine, ...(await startsOf(tx, who)) },
      choices: {
        mine: choicesOf(rows, context, 'me', viewer.person.id),
        company: choicesOf(rows, context, 'company', viewer.person.id),
      },
      fallback: ModelFallback.parse(switched ?? { enabled: false, chain: [], revision: 0 }),
      mayManage: deps.identity.allows(admitted.role, 'manageModelAccounts'),
    }
  })
}

type Connection = Viewer & {
  owner: Owner
  provider: string
  label: string
  key: string
  attemptKey: string
}

function parsedConnection(input: Connection) {
  const provider = keyProviderOf(input.provider)
  if (provider === undefined) throw new Failure('MODEL_PROVIDER_UNKNOWN')
  const key = input.key.trim()
  if (key.length < HINT_LENGTH) throw new Failure('MODEL_ACCOUNT_INVALID')
  return { provider: provider.id, label: labelOf(input.label), key }
}

/**
 * Links an account by its key (criterion 10). The attempt's lock, then the admission, then a replay:
 * the same key with another body is another request (code C37), compared with the sealed key.
 */
async function connect(deps: Deps, input: Connection) {
  const made = await linked(deps, input)
  // The list is read once the account is committed, never inside its transaction (data D22).
  if (made.created) {
    const { id, kind, provider } = made.account
    const account = { id, kind, provider, companyId: input.companyId }
    await keepServed(deps, scopeOf(input), account, input.key.trim())
  }
  return made
}

async function linked(deps: Deps, input: Connection) {
  return deps.database.command(scopeOf(input), async (tx) => {
    await transactionLock(tx, `conexus.model-account:${input.companyId}:${input.attemptKey}`)
    await admitFor(deps, tx, input, input.owner)
    const parsed = parsedConnection(input)
    const [found] = await tx
      .select(columns)
      .from(modelAccount)
      .where(
        and(
          eq(modelAccount.companyId, input.companyId),
          eq(modelAccount.attemptKey, input.attemptKey),
        ),
      )
    if (found !== undefined) {
      const row = AccountRow.parse(found)
      const same =
        ownerOf(row) === input.owner &&
        row.kind === 'api_key' &&
        row.provider === parsed.provider &&
        row.label === parsed.label &&
        (await credentialOf(deps, tx, { ...row, companyId: input.companyId })).reveal() ===
          parsed.key
      if (!same) throw new Failure('IDEMPOTENCY_CONFLICT')
      return { account: await accountView(tx, input, row.id), created: false }
    }
    const id = await insertAccount(deps, tx, input, {
      owner: input.owner,
      kind: 'api_key',
      provider: parsed.provider,
      label: parsed.label,
      credential: Credential.parse(parsed.key),
      hint: parsed.key.slice(-HINT_LENGTH),
      attemptKey: input.attemptKey,
    })
    return { account: await accountView(tx, input, id), created: true }
  })
}

export function createModelAccountStore(deps: Deps) {
  return Object.freeze({
    list: (viewer: Viewer) => list(deps, viewer),
    connect: (input: Connection) => connect(deps, input),
    change: (input: Change) => change(deps, input),
    assign: (input: Parameters<typeof assign>[1]) => assign(deps, input),
    setDefault: (input: Parameters<typeof setDefault>[1]) => setDefault(deps, input),
    setMine: (input: Parameters<typeof setMine>[1]) => setMine(deps, input),
    clearMine: (input: Parameters<typeof clearMine>[1]) => clearMine(deps, input),
    setFallback: (input: Parameters<typeof setFallback>[1]) => setFallback(deps, input),
    order: (input: Parameters<typeof order>[1]) => order(deps, input),
    remove: (input: Parameters<typeof remove>[1]) => remove(deps, input),
  })
}

export type ModelAccountStore = ReturnType<typeof createModelAccountStore>
