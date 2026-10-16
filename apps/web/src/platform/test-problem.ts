import type { FailureCode } from '@conexus/hub-api'
import { FAILURES, Problem } from '@conexus/hub-api'

/** The Problem body the Hub sends for a failure code, built from the failure table. */
export function problemOf(code: FailureCode) {
  const row = FAILURES[code]
  return Problem.parse({
    type: `urn:conexus:problem:${code}`,
    title: row.phrase,
    status: row.status,
    code,
    traceId: 'a1b2c3',
  })
}
