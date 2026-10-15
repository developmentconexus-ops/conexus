import type { FailureCode, Operation } from '@conexus/hub-api'
import { FAILURES, Problem } from '@conexus/hub-api'
import { mutationOptions, queryOptions } from '@tanstack/react-query'
import type { z } from 'zod'

const DEADLINE_MS = 10_000

export class HubFailure extends Error {
  readonly code: FailureCode

  constructor(code: FailureCode, options: { cause?: unknown } = {}) {
    super(code, options)
    this.name = 'HubFailure'
    this.code = code
  }
}

async function failureOf(response: Response): Promise<HubFailure> {
  const problem = Problem.safeParse(await response.json().catch(() => undefined))
  return new HubFailure(problem.success ? problem.data.code : 'INTERNAL_UNEXPECTED')
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

type Reading<S extends z.ZodType> = Operation & { success: { status: 200; body: S } }
type Body<O extends Operation> = O['input'] extends { body: infer B extends z.ZodType }
  ? z.input<B>
  : undefined

async function send(operation: Operation, body: unknown, signal?: AbortSignal) {
  const response = await hubFetch(operation.path, {
    method: operation.method,
    ...(body === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
    ...(signal ? { signal } : {}),
  })
  if (!response.ok) throw await failureOf(response)
  return response
}

async function parsed<S extends z.ZodType>(schema: S, response: Response): Promise<z.output<S>> {
  const result = schema.safeParse(await response.json().catch(() => undefined))
  if (!result.success) throw new HubFailure('INTERNAL_UNEXPECTED', { cause: result.error })
  return result.data
}

/** `answers` turns a refusal into data, as when no session is the answer "nobody", not a failure. */
export function hubQuery<S extends z.ZodType, A = never>(
  operation: Reading<S>,
  answers: Partial<Record<FailureCode, A>> = {},
) {
  return queryOptions({
    queryKey: [operation.id],
    queryFn: async ({ signal }): Promise<z.output<S> | A> => {
      const response = await send(operation, undefined, signal).catch((error: unknown) => {
        const answer = error instanceof HubFailure ? answers[error.code] : undefined
        if (answer === undefined) throw error
        return { answer }
      })
      if ('answer' in response) return response.answer
      return parsed(operation.success.body, response)
    },
  })
}

/** A write's reply is checked against the contract; the screens of step 3 need none of its data. */
export function hubMutation<O extends Operation>(operation: O) {
  return mutationOptions({
    mutationKey: [operation.id],
    mutationFn: async (body: Body<O>): Promise<void> => {
      const response = await send(operation, body)
      if (operation.success.status === 200) await parsed(operation.success.body, response)
    },
  })
}

/** What a person reads for a failure: its phrase and what to do, from the failure table (V43). */
export function sentenceOf(error: unknown): string {
  const row = FAILURES[error instanceof HubFailure ? error.code : 'INTERNAL_UNEXPECTED']
  return `${row.phrase} ${row.action}`
}
