import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CopyId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import type { CopyDefinition } from '../connectors/public.ts'
import { filledFrom } from './describe.ts'
import type { CopiesOn } from './test-copies.ts'
import { asSync, copiesOn, plantCopy } from './test-copies.ts'

type DefinitionV1 = Extract<CopyDefinition, { version: 1 }>

const TABLE = 'sankhya_vendas'

/** A copy as one turned on before the descriptions existed: none in the row, none in the table. */
async function undescribed(on: CopiesOn, copyId: CopyId) {
  await plantCopy(on, copyId, "definition = definition - 'description'")
  await plantCopy(
    on,
    copyId,
    `definition = jsonb_set(definition, '{columns}',
       (select jsonb_agg(c - 'description') from jsonb_array_elements(definition->'columns') c))`,
  )
  await asSync(on.owner, async (client) => {
    await client.query(`COMMENT ON TABLE sync.${TABLE} IS NULL`)
    await client.query(`COMMENT ON COLUMN sync.${TABLE}."NUNOTA" IS NULL`)
  })
}

async function storedDefinition(on: CopiesOn, copyId: CopyId): Promise<DefinitionV1> {
  const result = await on.hub.test.database.read(
    { kind: 'COMPANY', companyId: on.companyId, personId: null },
    (tx) => tx.execute(sql`select definition from copies.copy where id = ${copyId}`),
  )
  return Object(result.rows[0]).definition
}

function commentsOf(on: CopiesOn) {
  return asSync(on.owner, async (client) => {
    const read = await client.query(
      `select obj_description('sync.${TABLE}'::regclass) as "table",
              col_description('sync.${TABLE}'::regclass, a.attnum) as "column"
         from pg_attribute a where a.attrelid = 'sync.${TABLE}'::regclass and a.attname = 'NUNOTA'`,
    )
    const [row] = read.rows
    return { table: Object(row).table, column: Object(row).column }
  })
}

function columnOf(definition: DefinitionV1, name: string) {
  return definition.columns.find((column) => column.name === name)
}

test('a rodada preenche a descrição de uma cópia ligada antes', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  const model = on.hub.connectors.copies.catalog().find((each) => each.model.id === 'vendas')
  assert.ok(model)
  await undescribed(on, copyId)
  assert.equal((await storedDefinition(on, copyId)).description, undefined)
  assert.deepEqual(await commentsOf(on), { table: null, column: null })

  const ended = await on.run(copyId)
  assert.deepEqual(ended, { kind: 'ENDED', outcome: { kind: 'COMPLETE' } })

  const filled = await storedDefinition(on, copyId)
  assert.equal(filled.description, model.model.definition.description)
  assert.equal(
    columnOf(filled, 'NUNOTA')?.description,
    columnOf(model.model.definition, 'NUNOTA')?.description,
  )
  assert.deepEqual(await commentsOf(on), {
    table: model.model.definition.description,
    column: columnOf(model.model.definition, 'NUNOTA')?.description,
  })
})

test('preencher não troca uma descrição que existe', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  await undescribed(on, copyId)
  await plantCopy(
    on,
    copyId,
    `definition = jsonb_set(definition, '{columns,0,description}', '"A minha"')`,
  )
  for (let round = 0; round < 2; round++) assert.equal((await on.run(copyId)).kind, 'ENDED')
  const filled = await storedDefinition(on, copyId)
  assert.equal(filled.columns[0]?.description, 'A minha')
  assert.ok(filled.columns[1]?.description)
})

test('o modelo que saiu do kit', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  await plantCopy(on, copyId, "model = 'nao_existe'")
  await undescribed(on, copyId)
  assert.deepEqual(await on.run(copyId), { kind: 'ENDED', outcome: { kind: 'COMPLETE' } })
  const gone = on.hub.lines.filter((line) => line.message === 'COPY_MODEL_GONE')
  assert.equal(gone.length, 1)
  assert.equal(gone[0]?.fields.model, 'nao_existe')
  assert.equal((await storedDefinition(on, copyId)).description, undefined)
})

test('o banco da empresa cai ao preencher', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  await undescribed(on, copyId)
  const silent = t.mock.method(on.hub.postgres.companyPostgres, 'ensureCopyTable', async () => ({
    kind: 'NO_ANSWER' as const,
  }))
  assert.deepEqual(await on.run(copyId), {
    kind: 'ENDED',
    outcome: { kind: 'ERROR', code: 'COPY_DATABASE_UNAVAILABLE' },
  })
  assert.equal((await storedDefinition(on, copyId)).description, undefined)
  assert.ok(on.hub.lines.some((line) => line.message === 'COPY_DATABASE_FAILED'))
  silent.mock.restore()
  assert.equal((await on.run(copyId)).kind, 'ENDED')
  assert.ok((await storedDefinition(on, copyId)).description)
})

test('preencher duas vezes dá o mesmo que preencher uma', () => {
  const model: DefinitionV1 = {
    version: 1,
    source: { kind: 'QUERY', sql: 'SELECT ID FROM T' },
    description: 'A tabela.',
    columns: [{ name: 'ID', type: 'bigint', description: 'O código.' }],
    key: ['ID'],
    changedSince: null,
  }
  const stored: DefinitionV1 = {
    ...model,
    description: undefined,
    columns: [{ name: 'ID', type: 'bigint' }],
  }
  const once = filledFrom(stored, model)
  assert.equal(once?.description, 'A tabela.')
  assert.equal(once?.columns[0]?.description, 'O código.')
  assert.ok(once)
  assert.equal(filledFrom(once, model), undefined)
})
