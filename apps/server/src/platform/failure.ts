import type { FailureCode } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'

export type Scalar = string | number | boolean

export type FailureLog = {
  info(fields: Record<string, Scalar>, message: string): void
  error(fields: Record<string, Scalar>, message: string): void
}

const CAUSE_DEPTH = 5
const FRAME_COUNT = 3

export class Failure extends Error {
  readonly code: FailureCode
  readonly details: Readonly<Record<string, Scalar>>

  constructor(
    code: FailureCode,
    options: { details?: Record<string, Scalar>; cause?: unknown } = {},
  ) {
    const details = options.details ?? {}
    const named = Object.entries(details).map(([key, value]) => `${key}=${value}`)
    super([code, ...named].join(' '), { cause: options.cause })
    this.name = 'Failure'
    this.code = code
    this.details = details
  }
}

/** `error` and the causes it carries, outermost first, at most `CAUSE_DEPTH` of them. */
export function causeChain(error: unknown): unknown[] {
  const chain: unknown[] = []
  for (let cause = error; cause !== undefined && chain.length < CAUSE_DEPTH; ) {
    chain.push(cause)
    cause = cause instanceof Error ? cause.cause : undefined
  }
  return chain
}

function frames(error: unknown): string {
  if (!(error instanceof Error) || error.stack === undefined) return ''
  return error.stack
    .split('\n')
    .filter((line) => line.trimStart().startsWith('at '))
    .slice(0, FRAME_COUNT)
    .map((line) => line.trim())
    .join(' | ')
}

function systemCode(chain: unknown[]): string | undefined {
  for (const cause of chain) {
    if (typeof cause === 'object' && cause !== null && 'code' in cause) {
      if (typeof cause.code === 'string') return cause.code
    }
  }
  return undefined
}

/**
 * Logs only scalar fields: the types and frames of the cause, never its text (S41). `about` names
 * what the failure happened to, such as the account a queue skipped.
 */
export function logFailure(
  log: FailureLog,
  failure: Failure,
  about: Record<string, Scalar> = {},
): void {
  const row = FAILURES[failure.code]
  const chain = causeChain(failure.cause)
  const fields: Record<string, Scalar> = {
    ...about,
    category: row.category,
    status: row.status,
    ...failure.details,
  }
  if (chain.length > 0) {
    fields.causes = chain
      .map((cause) => (cause instanceof Error ? cause.name : typeof cause))
      .join(' <- ')
    fields.frames = frames(chain.at(-1))
    const code = systemCode(chain)
    if (code !== undefined) fields.code = code
  }
  if (row.category === 'USER') log.info(fields, failure.code)
  else log.error(fields, failure.code)
}
