import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CopyId } from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import type { CopyDefinition } from '../connectors/public.ts'
import type { CopiesOn } from './test-copies.ts'
import { asSync, copiesOn, plantCopy } from './test-copies.ts'

type DefinitionV1 = Extract<CopyDefinition, { version: 1 }>

const TABLE = 'sankhya_clientes'
const OLD_QUERY =
  'SELECT CODPARC, NOMEPARC, RAZAOSOCIAL, CGC_CPF, TIPPESSOA, ATIVO, CLIENTE, FORNECEDOR, DTALTER FROM TGFPAR'

/** A `clientes` copy as it was ligada before: CGC_CPF in the stored definition, its query and its table. */
async function oldClientes(on: CopiesOn) {
  const copyId = await on.enable('clientes')
  const column = { name: 'CGC_CPF', type: 'text', description: 'CPF ou CNPJ do parceiro.' }
  await plantCopy(
    on,
    copyId,
    `definition = jsonb_set(jsonb_set(definition, '{columns}', definition->'columns' || $2::jsonb), '{source,sql}', to_jsonb($3::text))`,
    [JSON.stringify([column]), OLD_QUERY],
  )
  await asSync(on.owner, (client) =>
    client.query(`ALTER TABLE sync.${TABLE} ADD COLUMN "CGC_CPF" text`),
  )
  return copyId
}

async function storedDefinition(on: CopiesOn, copyId: CopyId): Promise<DefinitionV1> {
  const result = await on.hub.test.database.read(
    { kind: 'COMPANY', companyId: on.companyId, personId: null },
    (tx) => tx.execute(sql`select definition from copies.copy where id = ${copyId}`),
  )
  return Object(result.rows[0]).definition
}

function tableColumns(on: CopiesOn) {
  return asSync(on.owner, async (client) => {
    const read = await client.query(
      `select column_name from information_schema.columns where table_schema = 'sync' and table_name = '${TABLE}'`,
    )
    return read.rows.map((row) => String(Object(row).column_name))
  })
}

test('a rodada tira CGC_CPF da tabela e da definição antes de copiar', async (t) => {
  const on = await copiesOn(t)
  const copyId = await oldClientes(on)
  assert.ok((await tableColumns(on)).includes('CGC_CPF'))
  const ended = await on.run(copyId)
  assert.deepEqual(ended, { kind: 'ENDED', outcome: { kind: 'COMPLETE' } })
  const definition = await storedDefinition(on, copyId)
  assert.ok(!definition.columns.some((column) => column.name === 'CGC_CPF'))
  assert.ok(!definition.source.sql.includes('CGC_CPF'))
  assert.ok(!(await tableColumns(on)).includes('CGC_CPF'))
  const retired = on.hub.lines.filter((line) => line.message === 'COPY_COLUMN_RETIRED')
  assert.equal(retired.length, 1)
  assert.equal(retired[0]?.fields.columns, 1)
})

test('uma segunda rodada não faz nada', async (t) => {
  const on = await copiesOn(t)
  const copyId = await oldClientes(on)
  assert.equal((await on.run(copyId)).kind, 'ENDED')
  const after = await storedDefinition(on, copyId)
  assert.equal((await on.run(copyId)).kind, 'ENDED')
  assert.deepEqual(await storedDefinition(on, copyId), after)
  assert.equal(on.hub.lines.filter((line) => line.message === 'COPY_COLUMN_RETIRED').length, 1)
})

test('o ALTER TABLE recusado termina a rodada em ERROR sem copiar e diz COPY_RETIRE_FAILED', async (t) => {
  const on = await copiesOn(t)
  const copyId = await oldClientes(on)
  const silent = t.mock.method(on.hub.postgres.companyPostgres, 'dropCopyColumns', async () => ({
    kind: 'NO_ANSWER' as const,
  }))
  assert.deepEqual(await on.run(copyId), {
    kind: 'ENDED',
    outcome: { kind: 'ERROR', code: 'COPY_DATABASE_UNAVAILABLE' },
  })
  assert.ok(on.hub.lines.some((line) => line.message === 'COPY_RETIRE_FAILED'))
  assert.equal(on.gate.pages, 0, 'the run ends before it reads a page')
  const definition = await storedDefinition(on, copyId)
  assert.ok(definition.columns.some((column) => column.name === 'CGC_CPF'))
  assert.ok((await tableColumns(on)).includes('CGC_CPF'))
  silent.mock.restore()
  assert.equal((await on.run(copyId)).kind, 'ENDED')
  assert.ok(!(await tableColumns(on)).includes('CGC_CPF'))
})

test('a posse que outra rodada tomou ao tirar a coluna', async (t) => {
  const on = await copiesOn(t)
  const copyId = await oldClientes(on)
  const { companyPostgres } = on.hub.postgres
  const drop = companyPostgres.dropCopyColumns.bind(companyPostgres)
  t.mock.method(companyPostgres, 'dropCopyColumns', async (...args: Parameters<typeof drop>) => {
    const answer = await drop(...args)
    await plantCopy(on, copyId, 'claim_token = gen_random_uuid()')
    return answer
  })
  assert.deepEqual(await on.run(copyId), { kind: 'ENDED', outcome: { kind: 'INTERRUPTED' } })
  assert.ok(on.hub.lines.some((line) => line.message === 'COPY_CLAIM_LOST'))
  assert.equal(on.gate.pages, 0, 'the run ends before it reads a page')
  const definition = await storedDefinition(on, copyId)
  assert.ok(definition.columns.some((column) => column.name === 'CGC_CPF'))
})

test('nenhuma célula de CGC_CPF chega a sync.clientes depois da rodada', async (t) => {
  const on = await copiesOn(t)
  const copyId = await oldClientes(on)
  await asSync(on.owner, (client) =>
    client.query(`UPDATE sync.${TABLE} SET "CGC_CPF" = '52998224725'`),
  )
  assert.equal((await on.run(copyId)).kind, 'ENDED')
  const cells = await asSync(on.owner, async (client) => {
    const read = await client.query(`select to_jsonb(c)::text as row from sync.${TABLE} c`)
    return read.rows.map((row) => String(Object(row).row))
  })
  assert.ok(cells.length > 0)
  assert.ok(cells.every((row) => !row.includes('CGC_CPF') && !row.includes('52998224725')))
})
