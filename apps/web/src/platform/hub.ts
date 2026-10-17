import type { FailureCode, Operation } from '@conexus/hub-api'
import { ATTEMPT_KEY_HEADER, FAILURES, Problem } from '@conexus/hub-api'
import type { QueryFunctionContext, QueryKey } from '@tanstack/react-query'
import { mutationOptions } from '@tanstack/react-query'
import { notFound } from '@tanstack/react-router'
import { z } from 'zod'

const DEADLINE_MS = 10_000

export class HubFailure extends Error {
  readonly code: FailureCode
  /**
   * True unless the browser read a whole answer from the Hub that settles the outcome. The Hub may
   * have acted, so a retry of a write must carry the same attempt key (code C37, web W24).
   */
  readonly outcomeUnknown: boolean

  constructor(code: FailureCode, options: { cause?: unknown; outcomeUnknown?: boolean } = {}) {
    super(code, options)
    this.name = 'HubFailure'
    this.code = code
    this.outcomeUnknown = options.outcomeUnknown ?? true
  }
}

/** The body of a reply, or the failure that says it could not be read whole. */
async function bodyOf(response: Response): Promise<unknown> {
  return response.json().catch((cause: unknown) => {
    throw new HubFailure('INTERNAL_UNEXPECTED', { cause })
  })
}

/**
 * A Hub Problem whose failure row `settles` says what the Hub did, which can be a change that
 * stands, such as an invitation whose e-mail failed; any other leaves the outcome unknown.
 */
async function failureOf(response: Response): Promise<HubFailure> {
  const problem = Problem.safeParse(await bodyOf(response))
  if (!problem.success) return new HubFailure('INTERNAL_UNEXPECTED', { cause: problem.error })
  const { code } = problem.data
  const settled = FAILURES[code].settles
  return new HubFailure(code, { outcomeUnknown: !settled })
}

/** The one fetch to the Hub: same origin, with cookies, under a deadline (web W9). */
async function hubFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const signals = [AbortSignal.timeout(DEADLINE_MS), ...(init.signal ? [init.signal] : [])]
  return fetch(new URL(path, globalThis.location.origin), {
    ...init,
    credentials: 'same-origin',
    signal: AbortSignal.any(signals),
  }).catch((cause: unknown) => {
    throw new HubFailure('INTERNAL_UNEXPECTED', { cause })
  })
}

type Part = 'params' | 'query' | 'body'
type PartOf<O extends Operation, K extends Part> = O['input'] extends {
  [P in K]: infer S extends z.ZodType
}
  ? z.input<S>
  : never
type Has<O extends Operation, K extends Part> = [PartOf<O, K>] extends [never] ? false : true
type Output<O extends Operation> = O['success'] extends { body: infer S extends z.ZodType }
  ? z.output<S>
  : undefined
type Reading = Operation & { success: { status: 200 } }

type ReadParts<O extends Operation> = (Has<O, 'params'> extends true
  ? { params: PartOf<O, 'params'> }
  : unknown) &
  (Has<O, 'query'> extends true ? { query: PartOf<O, 'query'> } : unknown)
type ReadArgs<O extends Operation> = [keyof ReadParts<O>] extends [never] ? [] : [ReadParts<O>]

/** What a write is given: the address parameters, the body and, for a create, its attempt key. */
type WriteParts<O extends Operation> = (Has<O, 'params'> extends true
  ? { params: PartOf<O, 'params'> }
  : unknown) &
  (Has<O, 'body'> extends true ? { body: PartOf<O, 'body'> } : unknown) &
  (O['attemptKey'] extends true ? { attemptKey: string } : unknown)
type WriteVariables<O extends Operation> = unknown extends WriteParts<O> ? undefined : WriteParts<O>

// The query's implementation signature cannot be related to its overload's rest tuple, so a read
// keeps this parse; a write is typed by its overload and needs none.
const Sent = z.object({
  params: z.record(z.string(), z.string()).optional(),
  query: z.record(z.string(), z.string().optional()).optional(),
  body: z.unknown().optional(),
  attemptKey: z.string().optional(),
})
type Sent = z.infer<typeof Sent>

function addressOf(operation: Operation, sent: Sent): string {
  const path = operation.path.replaceAll(/\{(\w+)\}/g, (_, name: string) =>
    encodeURIComponent(sent.params?.[name] ?? ''),
  )
  const query = new URLSearchParams()
  for (const [name, value] of Object.entries(sent.query ?? {})) {
    if (value !== undefined) query.set(name, value)
  }
  return query.size === 0 ? path : `${path}?${query}`
}

async function send(operation: Operation, sent: Sent = {}, signal?: AbortSignal) {
  const headers = {
    ...(sent.body === undefined ? {} : { 'content-type': 'application/json' }),
    ...(sent.attemptKey === undefined ? {} : { [ATTEMPT_KEY_HEADER]: sent.attemptKey }),
  }
  const response = await hubFetch(addressOf(operation, sent), {
    method: operation.method,
    headers,
    ...(sent.body === undefined ? {} : { body: JSON.stringify(sent.body) }),
    ...(signal ? { signal } : {}),
  })
  if (!response.ok) throw await failureOf(response)
  return response
}

async function parsed(operation: Operation, response: Response): Promise<unknown> {
  if (operation.success.status === 204) return undefined
  const result = operation.success.body.safeParse(await bodyOf(response))
  if (!result.success) throw new HubFailure('INTERNAL_UNEXPECTED', { cause: result.error })
  return result.data
}

type ReadOptions<O extends Operation> = {
  queryKey: QueryKey
  queryFn: (context: QueryFunctionContext) => Promise<Output<O>>
}

type PrefixArgs<O extends Operation> =
  Has<O, 'params'> extends true ? [params?: PartOf<O, 'params'>] : []

/**
 * The key every read of `operation` starts with, whatever its query, or only the reads of the
 * address `params` name: for an invalidation or a removal.
 */
export function hubQueryPrefix<O extends Reading>(operation: O, ...args: PrefixArgs<O>): QueryKey {
  const [params] = args
  return params === undefined ? [operation.id] : [operation.id, { params }]
}

/** The key derives from the operation and its parameters, never written by a screen (web W11). */
export function hubQuery<O extends Reading>(operation: O, ...args: ReadArgs<O>): ReadOptions<O>
export function hubQuery(operation: Operation, ...args: unknown[]) {
  const sent = Sent.parse(args[0] ?? {})
  return {
    queryKey: [operation.id, ...(Object.keys(sent).length === 0 ? [] : [sent])],
    queryFn: async ({ signal }: QueryFunctionContext) =>
      parsed(operation, await send(operation, sent, signal)),
  }
}

type WriteOptions<O extends Operation> = {
  mutationKey: readonly string[]
  mutationFn: (variables: WriteVariables<O>) => Promise<Output<O>>
}

export function hubMutation<O extends Operation>(operation: O): WriteOptions<O>
export function hubMutation(operation: Operation) {
  return mutationOptions({
    mutationKey: [operation.id],
    mutationFn: async (variables: never) => parsed(operation, await send(operation, variables)),
  })
}

/** What a person reads for a failure: its phrase and what to do, from the failure table (V43). */
export function sentenceOf(error: unknown): string {
  const row = FAILURES[error instanceof HubFailure ? error.code : 'INTERNAL_UNEXPECTED']
  return [row.phrase, row.action].filter(Boolean).join(' ')
}

/** A read the Hub answers 404 shows the route's not-found, as an id that cannot exist does. */
export async function readOrNotFound<T>(read: Promise<T>): Promise<T> {
  try {
    return await read
  } catch (error) {
    if (error instanceof HubFailure && error.code === 'NOT_FOUND') throw notFound()
    throw error
  }
}

/** A path parameter the contract would never issue names no page: the address is not found. */
export function idOrNotFound<S extends z.ZodType>(schema: S, raw: string): z.output<S> {
  const id = schema.safeParse(raw)
  if (!id.success) throw notFound()
  return id.data
}
