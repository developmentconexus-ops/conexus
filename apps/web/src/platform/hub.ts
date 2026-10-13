import type { FailureCode, Operation } from '@conexus/hub-api'
import { Problem } from '@conexus/hub-api'
import { queryOptions } from '@tanstack/react-query'
import type { z } from 'zod'

const DEADLINE_MS = 10_000

/** The one failure a screen sees: the code of the failure table, whatever went wrong. */
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

type Reading<S extends z.ZodType> = Operation & { success: { status: 200; body: S } }

async function call<S extends z.ZodType>(
  operation: Reading<S>,
  cancel: AbortSignal,
): Promise<z.output<S>> {
  const url = new URL(operation.path, globalThis.location.origin)
  const response = await fetch(url, {
    method: operation.method,
    credentials: 'same-origin',
    signal: AbortSignal.any([cancel, AbortSignal.timeout(DEADLINE_MS)]),
  }).catch((cause: unknown) => {
    throw new HubFailure('INTERNAL_UNEXPECTED', { cause })
  })
  if (!response.ok) throw await failureOf(response)
  const parsed = operation.success.body.safeParse(await response.json().catch(() => undefined))
  if (!parsed.success) throw new HubFailure('INTERNAL_UNEXPECTED', { cause: parsed.error })
  return parsed.data
}

/** The only door to the Hub: the address comes from the operation and the reply is parsed with its schema. */
export function hubQuery<S extends z.ZodType>(operation: Reading<S>) {
  return queryOptions({
    queryKey: [operation.id],
    queryFn: ({ signal }) => call(operation, signal),
  })
}
