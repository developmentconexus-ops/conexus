import type { FailureCode } from '@conexus/hub-api'
import { FAILURES, Problem } from '@conexus/hub-api'

export const ANA = { id: 'person-ana', name: 'Ana Lima', email: 'ana@example.test' }
export const COMPANY = {
  id: 'a'.repeat(32),
  name: 'Empresa Teste',
  nickname: 'empresa-teste',
  appsDomain: 'apps.example.test',
}

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

/** What the Hub says the role may do (`may` of `getCompany`): the roles that build, and the member, who does not. */
export function mayOf(role: string) {
  const builds = role !== 'member'
  return { manageAgents: builds, manageAutomations: builds }
}
