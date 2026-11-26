import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { TREAT_TASK_SCHEMA, TreatTaskResult, TreatTaskSpec, treatTaskSchema } from './public.ts'

test('o esquema guardado da tarefa que trata é o que o Zod gera hoje', () => {
  assert.deepEqual(JSON.parse(readFileSync(TREAT_TASK_SCHEMA, 'utf8')), treatTaskSchema())
})

const MODEL = {
  name: 'tratado__sankhya_notas',
  layer: 'tratado',
  table: 'sankhya_notas',
  sql: 'select nunota from "current"."sankhya_notas"',
  after: [],
}

function specWith(model: object) {
  return {
    version: 1,
    runId: randomUUID(),
    attempt: 1,
    companyId: 'EmpresaTesteA0000000000000000001',
    lake: { bucketArn: 'arn:aws:s3tables:us-east-2:111122223333:bucket/x', region: 'us-east-2' },
    queueUrl: 'https://sqs.us-east-2.amazonaws.com/111122223333/conexus-copia-fim',
    models: [{ ...MODEL, ...model }],
    select: [MODEL.name],
  }
}

test('o SQL com um template do dbt é recusado, e o esquema gerado leva a recusa como pattern', () => {
  assert.equal(TreatTaskSpec.safeParse(specWith({})).success, true)
  const plain = 'select {1} as chave, \'}}\' as fim, 10 % 3 as resto -- #\nfrom "current"."x"'
  assert.equal(TreatTaskSpec.safeParse(specWith({ sql: plain })).success, true)
  const templates = ['{{ env_var("X") }}', '{% set x = 1 %}', '{# nota #}']
  const pattern = JSON.parse(readFileSync(TREAT_TASK_SCHEMA, 'utf8')).spec.properties.models.items
    .properties.sql.pattern
  for (const template of templates) {
    const sql = `select 1\nfrom t ${template}`
    assert.equal(TreatTaskSpec.safeParse(specWith({ sql })).success, false, template)
    assert.equal(new RegExp(pattern).test(sql), false, template)
  }
  assert.equal(new RegExp(pattern).test(plain), true)
})

test('recusa a especificação com um nome em select ou after fora de models, ou um nome repetido', () => {
  const spec = specWith({})
  const [model] = spec.models
  const outside = 'tratado__que_nao_veio'
  const refused: [string, object][] = [
    ['select', { select: [MODEL.name, outside] }],
    ['models', { models: [{ ...model, after: [outside] }] }],
    ['models', { models: [model, model] }],
  ]
  for (const [field, change] of refused) {
    const parsed = TreatTaskSpec.safeParse({ ...spec, ...change })
    assert.deepEqual(
      parsed.error?.issues.map((issue) => issue.path),
      [[field]],
    )
  }
  const reader = { ...model, name: 'negocio__notas', layer: 'negocio', after: [MODEL.name] }
  assert.equal(TreatTaskSpec.safeParse({ ...spec, models: [reader, model] }).success, true)
})

test('o resultado leva as linhas de quem gravou, o tipo e a linha de quem falhou, e nenhuma frase', () => {
  const result = {
    ...{ type: 'TREAT_RESULT', version: 1, runId: randomUUID(), attempt: 1 },
    outcome: { kind: 'COMPLETE' },
  }
  const name = MODEL.name
  const ends = [
    { name, status: 'BUILT', rows: 0 },
    { name, status: 'FAILED', failure: 'COLUMN_NOT_FOUND', line: null },
    { name, status: 'SKIPPED' },
  ]
  assert.equal(TreatTaskResult.safeParse({ ...result, models: ends }).success, true)
  const refused = [
    { name, status: 'BUILT' },
    { name, status: 'FAILED', failure: "Column 'x' cannot be resolved", line: 1 },
    { name, status: 'FAILED', failure: 'COLUMN_NOT_FOUND' },
  ]
  for (const end of refused) {
    assert.equal(TreatTaskResult.safeParse({ ...result, models: [end] }).success, false)
  }
  const unexplained = { ...result, models: [], outcome: { kind: 'ERROR' } }
  assert.equal(TreatTaskResult.safeParse(unexplained).success, false)
})
