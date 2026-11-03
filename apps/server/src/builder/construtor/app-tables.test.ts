import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import type { AppRead } from '../../hub/apps/public.ts'
import type { AppDataPort } from '../agents/public.ts'
import { appTablesOf } from './public.ts'

const scope = {
  companyId: CompanyId.parse(randomUUID().replaceAll('-', '')),
  projectId: ProjectId.parse(randomUUID().replaceAll('-', '')),
  personId: PersonId.parse(randomUUID().replaceAll('-', '')),
}

function readingAs(read: AppRead) {
  const appData: AppDataPort = { hasApp: async () => true, read: async () => read }
  return appTablesOf(appData)(scope)
}

test('as tabelas do app: o banco do app que não responde ou estoura o prazo é DATABASE_UNAVAILABLE, não INTERNAL_UNEXPECTED', async () => {
  for (const code of ['APP_DATA_UNAVAILABLE', 'APP_DATA_TIMEOUT'] as const) {
    await assert.rejects(readingAs({ kind: 'FAILED', code }), {
      code: 'DATABASE_UNAVAILABLE',
      details: { reason: 'APP_TABLES_UNREADABLE', answer: code },
    })
  }
})

test('as tabelas do app: o que a leitura não devia dar segue INTERNAL_UNEXPECTED, e as linhas viram tabelas com colunas', async () => {
  await assert.rejects(readingAs({ kind: 'FAILED', code: 'APP_DATA_TOO_LARGE' }), {
    code: 'INTERNAL_UNEXPECTED',
  })
  const rows = [
    ['recado', 'id'],
    ['recado', 'texto'],
  ]
  const read = { kind: 'ROWS', columns: ['table_name', 'column_name'], rows } as const
  assert.deepEqual(await readingAs(read), [{ name: 'recado', columns: ['id', 'texto'] }])
})
