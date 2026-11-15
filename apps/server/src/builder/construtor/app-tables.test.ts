import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { CompanyId, PersonId, ProjectId, AppTableName as TableName } from '@conexus/hub-api'
import type { AppTablesRead } from '../../hub/apps/public.ts'
import type { AppDataPort } from '../app-data/public.ts'
import { tablesWithColumnNamesOf } from './public.ts'

const scope = {
  companyId: CompanyId.parse(randomUUID().replaceAll('-', '')),
  projectId: ProjectId.parse(randomUUID().replaceAll('-', '')),
  personId: PersonId.parse(randomUUID().replaceAll('-', '')),
}

function readingAs(read: AppTablesRead) {
  const appData: AppDataPort = {
    hasApp: async () => true,
    tables: async () => read,
    read: async () => ({ kind: 'FAILED', code: 'APP_DATA_UNAVAILABLE' }),
  }
  return tablesWithColumnNamesOf(appData)(scope)
}

test('as tabelas do app: o banco do app que não responde ou estoura o prazo é DATABASE_UNAVAILABLE, não INTERNAL_UNEXPECTED', async () => {
  for (const code of ['APP_DATA_UNAVAILABLE', 'APP_DATA_TIMEOUT'] as const) {
    await assert.rejects(readingAs({ kind: 'FAILED', code }), {
      code: 'DATABASE_UNAVAILABLE',
      details: { reason: 'APP_TABLES_UNREADABLE', answer: code },
    })
  }
})

test('as tabelas do app: o Construtor lê a lista do Hub, e o que a leitura não devia dar segue INTERNAL_UNEXPECTED', async () => {
  await assert.rejects(readingAs({ kind: 'FAILED', code: 'APP_DATA_TOO_LARGE' }), {
    code: 'INTERNAL_UNEXPECTED',
  })
  assert.equal(await readingAs({ kind: 'NO_APP' }), null)
  const table = TableName.parse('recado')
  const columns = [{ name: 'id' }, { name: 'texto' }]
  const read: AppTablesRead = {
    kind: 'TABLES',
    tables: [{ schema: 'public', name: table, columns, key: ['id'] }],
  }
  assert.deepEqual(await readingAs(read), [{ name: 'recado', columns: ['id', 'texto'] }])
})
