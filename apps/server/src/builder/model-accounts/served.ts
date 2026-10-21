import type { CompanyId, ModelId } from '@conexus/hub-api'
import { parseModelString } from '@mastra/core/llm'
import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { Database, Scope } from '../../platform/database.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { AccountRow } from './accounts.ts'
import { subscriptionHeaders } from './claude/subscription-model.ts'
import { isChoosable } from './providers.ts'
import { modelAccount } from './tables.ts'

// The models each provider says a credential can call, read when the credential changes (card
// 12.3, review 1b): the router's registry is one global catalog and knows no entitlement, so
// Anthropic's subscription lists no `claude-sonnet-4-5` that the registry still offers.
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
    // The ids CLIProxyAPI lists are the provider's own; the ones the registry has are the ones
    // that serve, with no renaming, so the others leave the list when it is read against it.
    if (via === undefined) return undefined
    return {
      reader: 'openai',
      url: new URL(`${via}/models`),
      headers: new Headers({ authorization: `Bearer ${secret}` }),
    }
  }
  if (target.kind === 'claude_subscription') {
    return {
      reader: 'anthropic',
      url: anthropicUrl(),
      headers: subscriptionHeaders(new Headers(), secret),
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
export function hasReader(target: ServedTarget): boolean {
  return listRequest(target, '', 'http://127.0.0.1') !== undefined
}

/**
 * The model ids the provider lists for this credential, or none when the kind has no reader here.
 * `secret` is the API key, or a subscription's access token; for a Google sign-in it is the key of
 * the CLIProxyAPI process at `via`. A failed read throws.
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
  return (await getJson(url, headers, OpenAiList)).data.map((one) => one.id)
}

/**
 * Whether the account serves the model: a model the picker offers, and, once the provider's list
 * was read, one of its ids. An account never read serves what the registry offers.
 */
export function servesModel(row: Pick<AccountRow, 'served'>, model: ModelId): boolean {
  if (!isChoosable(model)) return false
  return row.served === null || row.served.includes(parseModelString(model).modelId)
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
