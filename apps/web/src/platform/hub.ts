import type { FailureCode, Operation } from '@conexus/hub-api'
import { ATTEMPT_KEY_HEADER, FAILURES, Problem, phraseOf } from '@conexus/hub-api'
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
  /** The person the Hub's phrase names, for the rows that do. */
  readonly person: string | undefined

  constructor(
    code: FailureCode,
    options: { cause?: unknown; outcomeUnknown?: boolean; person?: string } = {},
  ) {
    super(code, options)
    this.name = 'HubFailure'
    this.code = code
    this.outcomeUnknown = options.outcomeUnknown ?? true
    this.person = options.person
  }
}

/** The body of a reply, or the failure that says it could not be read whole. */
async function bodyOf(response: Response): Promise<unknown> {
  // biome-ignore lint/plugin: failureOf parses this unknown body with Problem next (C27)
  return response.json().catch((cause: unknown) => {
    throw new HubFailure('INTERNAL_UNEXPECTED', { cause })
  })
}

/**
 * A Hub Problem whose failure row `settles` says what the Hub did, which can be a change that
 * stands, such as an invitation whose e-mail failed; any other leaves the outcome unknown.
 */
export async function failureOf(response: Response): Promise<HubFailure> {
  return failureOfProblem(await bodyOf(response))
}

/** The failure a Problem body says, for a library client that read the Hub's answer itself. */
export function failureOfProblem(body: unknown): HubFailure {
  const problem = Problem.safeParse(body)
  if (!problem.success) return new HubFailure('INTERNAL_UNEXPECTED', { cause: problem.error })
  const { code } = problem.data
  const settled = FAILURES[code].settles
  return new HubFailure(code, { outcomeUnknown: !settled, person: problem.data.person })
}

/** The one fetch to the Hub: same origin, with cookies, under a deadline (web W9). */
async function hubFetch(
  path: string,
  init: RequestInit = {},
  deadlineMs: number | null = DEADLINE_MS,
): Promise<Response> {
  const signals = [
    ...(deadlineMs === null ? [] : [AbortSignal.timeout(deadlineMs)]),
    ...(init.signal ? [init.signal] : []),
  ]
  return fetch(new URL(path, globalThis.location.origin), {
    ...init,
    credentials: 'same-origin',
    signal: AbortSignal.any(signals),
  }).catch((cause: unknown) => {
    throw new HubFailure('INTERNAL_UNEXPECTED', { cause })
  })
}

/**
 * The fetch a library client that calls the Hub receives (web W9), Mastra's `MastraClient` for the
 * Builder's session: same origin, with cookies, and no deadline, since its stream stays open.
 */
export function hubClientFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, { ...init, credentials: 'same-origin' })
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

async function send(
  operation: Operation,
  sent: Sent = {},
  options: { signal?: AbortSignal; deadlineMs?: number | null } = {},
) {
  const headers = {
    ...(sent.body === undefined ? {} : { 'content-type': 'application/json' }),
    ...(sent.attemptKey === undefined ? {} : { [ATTEMPT_KEY_HEADER]: sent.attemptKey }),
  }
  const { signal, deadlineMs } = options
  const response = await hubFetch(
    addressOf(operation, sent),
    {
      method: operation.method,
      headers,
      ...(sent.body === undefined ? {} : { body: JSON.stringify(sent.body) }),
      ...(signal ? { signal } : {}),
    },
    deadlineMs === undefined ? DEADLINE_MS : deadlineMs,
  )
  if (!response.ok) throw await failureOf(response)
  return response
}

async function parsed(operation: Operation, response: Response): Promise<unknown> {
  if (!('body' in operation.success)) return undefined
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
      parsed(operation, await send(operation, sent, { signal })),
  }
}

type WriteOptions<O extends Operation> = {
  mutationKey: readonly string[]
  mutationFn: (variables: WriteVariables<O>) => Promise<Output<O>>
}

export function hubMutation<O extends Operation>(
  operation: O,
  options?: { deadlineMs: number },
): WriteOptions<O>
/** A write's deadline is the Hub's default unless its operation names a longer answer. */
export function hubMutation(operation: Operation, options?: { deadlineMs: number }) {
  return mutationOptions({
    mutationKey: [operation.id],
    mutationFn: async (variables: never) =>
      parsed(operation, await send(operation, variables, { deadlineMs: options?.deadlineMs })),
  })
}

/** What a person reads for a failure code: its phrase and what to do, from the failure table (V43). */
export function sentenceOfCode(code: FailureCode, person?: string): string {
  return [phraseOf(code, person), FAILURES[code].action].filter(Boolean).join(' ')
}

/** What a person reads for a failure: its phrase and what to do, from the failure table (V43). */
export function sentenceOf(error: unknown): string {
  return error instanceof HubFailure
    ? sentenceOfCode(error.code, error.person)
    : sentenceOfCode('INTERNAL_UNEXPECTED')
}

/**
 * What a person reads for a failed write: the row's words when the Hub's whole answer settled it,
 * otherwise `unconfirmed`, since the Hub may have acted (code C37).
 */
export function writeFailureText(error: unknown, unconfirmed: string): string {
  return error instanceof HubFailure && !error.outcomeUnknown ? sentenceOf(error) : unconfirmed
}

const NOT_FOUND_CODES: ReadonlySet<FailureCode> = new Set(['NOT_FOUND', 'CONVERSATION_NOT_FOUND'])

/** A read the Hub answers 404 shows the route's not-found, as an id that cannot exist does. */
export async function readOrNotFound<T>(read: Promise<T>): Promise<T> {
  try {
    return await read
  } catch (error) {
    if (error instanceof HubFailure && NOT_FOUND_CODES.has(error.code)) throw notFound()
    throw error
  }
}

/** A path parameter the contract would never issue names no page: the address is not found. */
export function idOrNotFound<S extends z.ZodType>(schema: S, raw: string): z.output<S> {
  const id = schema.safeParse(raw)
  if (!id.success) throw notFound()
  return id.data
}
