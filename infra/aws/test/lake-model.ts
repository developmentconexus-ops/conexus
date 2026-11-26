import { readFileSync } from 'node:fs'
import type { Statement } from './policies.ts'
import { find, readableResources, statementsOf } from './policies.ts'

export const stored = readFileSync(new URL('../lake.template.json', import.meta.url), 'utf8')
export const lake = readableResources(JSON.parse(stored))

export const CHANGE = ['glue:CreateTable', 'glue:DeleteTable', 'glue:UpdateTable']

export function roleOf(
  role: 'Writer' | 'Treater',
  lakeId: string,
  company = '{CompanyId}',
): Statement[] {
  return JSON.parse(
    JSON.stringify(statementsOf(find(lake, role)))
      .replaceAll('{LakeId}', lakeId)
      .replaceAll('{CompanyId}', company),
  )
}
