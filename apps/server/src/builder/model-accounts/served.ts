import type { CompanyId, ModelAccountId, ModelId } from '@conexus/hub-api'
import { CompanyId as CompanyIdSchema } from '@conexus/hub-api'
import { parseModelString } from '@mastra/core/llm'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Database, ReadTx, Scope } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { SealKeys } from '../../platform/seal.ts'
import { AccountRow, columns, credentialOf } from './accounts.ts'
import type { GoogleCalls } from './google/port.ts'
import { isChoosable, isListed } from './providers.ts'
import { modelAccount } from './tables.ts'

// The models each provider says a credential can call, read when the credential changes (card
// 12.3, review 1b): the router's registry is one global catalog and knows no entitlement, so
// Anthropic's key lists no `claude-sonnet-4-5` that the registry still offers. A Claude subscription
// has no list to read: `/v1/models` answers its bearer 404, and Mastra Code offers it the registry's
// Anthropic models whole, leaving a model it does not serve to the call's 404 (`mastracode/sdk/src/index.ts:1444-1450`,
// `onboarding/packs.ts:70-80`, commit 6a465f9d); here the queue reads that 404 as `missing`.
const READ_TIMEOUT_MS = 10_000
const MAX_BYTES = 2_000_000
const MAX_PAGES = 10
const PAGE_SIZE = '1000'

export const AnthropicPage = z.object({
  data: z.array(z.object({ id: z.string() })),
  has_more: z.boolean(),
  last_id: z.string().nullable(),
})
export const OpenAiList = z.object({ data: z.array(z.object({ id: z.string() })) })
export const GooglePage = z.object({
  models: z.array(z.object({ name: z.string() })),
  nextPageToken: z.string().optional(),
})

/** The body as text, stopped at `MAX_BYTES` (code C59). */
async function cappedText(response: Response): Promise<string> {
  const reader = response.body?.getReader()
  if (reader === undefined) return ''
  const decoder = new TextDecoder()
  let text = ''
  let bytes = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) return text + decoder.decode()
    bytes += value.byteLength
    if (bytes > MAX_BYTES) {
      await reader.cancel()
      throw new Failure('MODEL_ACCOUNT_UNAVAILABLE', { details: { reason: 'LIST_TOO_LARGE' } })
    }
    text += decoder.decode(value, { stream: true })
  }
}

async function getJson<T>(url: URL, headers: Headers, schema: z.ZodType<T>): Promise<T> {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(READ_TIMEOUT_MS) })
  if (!response.ok) {
    throw new Failure('MODEL_ACCOUNT_UNAVAILABLE', { details: { status: response.status } })
  }
  return schema.parse(JSON.parse(await cappedText(response)))
}

export type ServedTarget = { kind: AccountRow['kind']; provider: string }
export type ListRequest = {
  reader: 'anthropic' | 'openai' | 'google'
  url: URL
  headers: Headers
}

/** The provider's list as one request for its first page, or none for a kind with no reader here. */
export function listRequest(
  target: ServedTarget,
  secret: string,
  via?: string,
): ListRequest | undefined {
  if (target.kind === 'google_cliproxy') {
    // CLIProxyAPI lists the names it calls the models by, which are not always the registry's
    // (`servesModel`).
    if (via === undefined) return undefined
    return {
      reader: 'openai',
      url: new URL(`${via}/models`),
      headers: new Headers({ authorization: `Bearer ${secret}` }),
    }
  }
  if (target.kind !== 'api_key') return undefined
  switch (target.provider) {
    case 'anthropic':
      return {
        reader: 'anthropic',
        url: anthropicUrl(),
        headers: new Headers({ 'x-api-key': secret, 'anthropic-version': '2023-06-01' }),
      }
    case 'openai':
      return {
        reader: 'openai',
        url: new URL('https://api.openai.com/v1/models'),
        headers: new Headers({ authorization: `Bearer ${secret}` }),
      }
    case 'google': {
      const url = new URL('https://generativelanguage.googleapis.com/v1beta/models')
      url.searchParams.set('pageSize', PAGE_SIZE)
      return { reader: 'google', url, headers: new Headers({ 'x-goog-api-key': secret }) }
    }
    default:
      return undefined
  }
}

function anthropicUrl(): URL {
  const url = new URL('https://api.anthropic.com/v1/models')
  url.searchParams.set('limit', PAGE_SIZE)
  return url
}

async function anthropicList(first: URL, headers: Headers): Promise<string[]> {
  const ids: string[] = []
  const url = new URL(first)
  for (let page = 0; page < MAX_PAGES; page++) {
    const read = await getJson(url, headers, AnthropicPage)
    ids.push(...read.data.map((one) => one.id))
    if (!read.has_more || read.last_id === null) return ids
    url.searchParams.set('after_id', read.last_id)
  }
  return ids
}

async function googleList(first: URL, headers: Headers): Promise<string[]> {
  const ids: string[] = []
  const url = new URL(first)
  for (let page = 0; page < MAX_PAGES; page++) {
    const read = await getJson(url, headers, GooglePage)
    ids.push(...read.models.map((one) => one.name.replace(/^models\//, '')))
    if (read.nextPageToken === undefined) return ids
    url.searchParams.set('pageToken', read.nextPageToken)
  }
  return ids
}

/** Whether a list of this kind of account can be read here. */
function hasReader(target: ServedTarget): boolean {
  return listRequest(target, '', 'http://127.0.0.1') !== undefined
}

/**
 * The model ids the provider lists for this credential, or none when the kind has no reader here.
 * `secret` is the API key; for a Google sign-in it is the key of the CLIProxyAPI process at `via`. A failed read throws.
 */
async function readServed(
  target: ServedTarget,
  secret: string,
  via?: string,
): Promise<string[] | undefined> {
  const request = listRequest(target, secret, via)
  if (request === undefined) return undefined
  const { reader, url, headers } = request
  if (reader === 'anthropic') return anthropicList(url, headers)
  if (reader === 'google') return googleList(url, headers)
  if (target.kind === 'google_cliproxy') return cliProxyList(url, headers)
  return (await getJson(url, headers, OpenAiList)).data.map((one) => one.id)
}

/**
 * CLIProxyAPI answers its list empty until it has fetched the login's models from Google (v8.0.33),
 * which the process's start waits for (`launch`): an empty list is one not loaded, never kept.
 */
async function cliProxyList(url: URL, headers: Headers): Promise<string[]> {
  const ids = (await getJson(url, headers, OpenAiList)).data.map((one) => one.id)
  if (ids.length === 0) {
    throw new Failure('MODEL_ACCOUNT_UNAVAILABLE', { details: { reason: 'LIST_EMPTY' } })
  }
  return ids
}

/**
 * Whether the account serves the model, under the name the account calls it by: one of the ids its
 * list holds once read, among the registry's chat models, or for a Google sign-in, among the Google
 * chat models CLIProxy names its own way (`gemini-3.8-flash-high`). An account never read serves
 * what the registry offers.
 */
export function servesModel(row: Pick<AccountRow, 'kind' | 'served'>, model: ModelId): boolean {
  if (row.served === null) return isListed(model)
  const offered = row.kind === 'google_cliproxy' ? isChoosable(model) : isListed(model)
  return offered && row.served.includes(parseModelString(model).modelId)
}

type Keeping = {
  database: Database
  log: FailureLog
}

/**
 * Reads the provider's list with the credential and keeps it on the account. Network, so never in
 * a transaction (data D22); a failed read leaves the list as it was and is logged, and never fails
 * what the caller is doing.
 */
export async function keepServed(
  deps: Keeping,
  scope: Scope,
  account: ServedTarget & { id: AccountRow['id']; companyId: CompanyId },
  secret: string,
  via?: string,
): Promise<void> {
  try {
    const ids = await readServed(account, secret, via)
    if (ids === undefined) return
    await deps.database.command(scope, (tx) =>
      tx
        .update(modelAccount)
        .set({ servedModels: ids, servedAt: sql`statement_timestamp()` })
        .where(and(eq(modelAccount.id, account.id), eq(modelAccount.companyId, account.companyId))),
    )
  } catch (error) {
    const failure =
      error instanceof Failure
        ? error
        : new Failure('MODEL_ACCOUNT_UNAVAILABLE', {
            details: { reason: 'LIST_UNREAD' },
            cause: error,
          })
    logFailure(deps.log, failure, { companyId: account.companyId, accountId: account.id })
  }
}

export type ReadingDeps = {
  database: Database
  sealKeys: SealKeys
  googleCalls: GoogleCalls
  log: FailureLog
}

async function readThrowing(
  deps: ReadingDeps,
  scope: Scope,
  companyId: CompanyId,
  accountId: ModelAccountId,
  before?: (tx: ReadTx) => Promise<unknown>,
): Promise<void> {
  const found = await deps.database.read(scope, async (tx) => {
    await before?.(tx)
    const [row] = await tx
      .select(columns)
      .from(modelAccount)
      .where(and(eq(modelAccount.id, accountId), eq(modelAccount.companyId, companyId)))
    if (row === undefined) return undefined
    const account = AccountRow.parse(row)
    return { account, credential: await credentialOf(deps, tx, { ...account, companyId }) }
  })
  if (found === undefined || !hasReader(found.account)) return
  const { account, credential } = found
  const target = { id: account.id, kind: account.kind, provider: account.provider, companyId }
  if (account.kind === 'google_cliproxy') {
    const { url, apiKey, hold } = await deps.googleCalls(
      { ...account, companyId, credential },
      scope,
    )
    const release = hold()
    try {
      await keepServed(deps, scope, target, apiKey, url)
    } finally {
      release()
    }
    return
  }
  await keepServed(deps, scope, target, credential.reveal())
}

/**
 * Reads one account's list now with its own credential, whatever its kind, and keeps it (card
 * 12.3). `before` runs in the transaction that reads the row, for the caller's admission. A kind
 * with no reader, or an account gone, is left as it is, and a read that fails is logged and leaves
 * the list as it was: it never fails what the caller is doing.
 */
export async function readServedOf(
  deps: ReadingDeps,
  scope: Scope,
  companyId: CompanyId,
  accountId: ModelAccountId,
  before?: (tx: ReadTx) => Promise<unknown>,
): Promise<void> {
  try {
    await readThrowing(deps, scope, companyId, accountId, before)
  } catch (error) {
    const failure =
      error instanceof Failure ? error : new Failure('INTERNAL_UNEXPECTED', { cause: error })
    logFailure(deps.log, failure, { companyId, accountId })
  }
}

/**
 * The accounts of every company whose list was never read, which are the ones linked before the
 * list was read at link, or was kept empty, as a Google sign-in's was while CLIProxy still loaded
 * it, read now one by one, outside any transaction. A read that fails leaves
 * the account unread, as before, and the next start tries it again.
 */
export async function readUnserved(deps: ReadingDeps): Promise<number> {
  const companies = await deps.database.installationRead((tx) =>
    tx.execute(sql`select company_id from builder.companies_with_seals()`),
  )
  let tried = 0
  for (const found of companies.rows) {
    const companyId = CompanyIdSchema.parse(Object(found).company_id)
    const scope = { kind: 'COMPANY', companyId, personId: null } as const
    const unread = await deps.database.read(scope, (tx) =>
      tx
        .select(columns)
        .from(modelAccount)
        .where(
          and(
            eq(modelAccount.companyId, companyId),
            sql`coalesce(cardinality(${modelAccount.servedModels}), 0) = 0`,
          ),
        ),
    )
    for (const row of unread.map((each) => AccountRow.parse(each)).filter(hasReader)) {
      await readServedOf(deps, scope, companyId, row.id)
      tried += 1
    }
  }
  return tried
}
