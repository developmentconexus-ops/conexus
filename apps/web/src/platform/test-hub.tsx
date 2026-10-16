import type { FailureCode } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import { HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { problemOf } from './test-problem.ts'

export const ANA = { id: 'person-ana', name: 'Ana Lima', email: 'ana@example.test' }
export const STATUS = {
  version: 'v0.1.0',
  lastStart: { state: 'NONE' },
  previousStart: { state: 'NONE' },
} as const

/** The Hub as a test sees it: no request goes unanswered, and each test starts with no handler. */
export function hubServer() {
  const server = setupServer()
  beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())
  return server
}

/** The Hub's refusal for a failure code, as the server sends it. */
export function refusal(code: FailureCode) {
  return HttpResponse.json(problemOf(code), {
    status: FAILURES[code].status,
    headers: { 'content-type': 'application/problem+json' },
  })
}

function edgePage(status: number) {
  return new HttpResponse('<html><body>Gateway</body></html>', {
    status,
    headers: { 'content-type': 'text/html' },
  })
}

/**
 * Replies after which the browser cannot tell whether the Hub acted: the key stays (code C37, web
 * W24). `cut` is the start of a write's success body, cut off.
 */
export function undecided(cut: string): [string, () => Response][] {
  return [
    ['resposta cortada', () => new HttpResponse(cut, { status: 201 })],
    ['502 da borda', () => edgePage(502)],
    ['504 da borda', () => edgePage(504)],
    ['banco sem resposta', () => refusal('DATABASE_UNAVAILABLE')],
  ]
}
