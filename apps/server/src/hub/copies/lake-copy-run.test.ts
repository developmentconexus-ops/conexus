import assert from 'node:assert/strict'
import { test } from 'node:test'
import { bodyOfStatus, runLakeCopy } from '@conexus/hub-api'
import { queued, withOwnerLock } from '../../platform/test-database.ts'
import { codeOf } from '../identity/test-hub.ts'
import {
  counts,
  finished,
  lakeCopyOn,
  NFE,
  NOTAS,
  PARCEIROS,
  PRODUTOS,
  runsOf,
  specOf,
  wholeOf,
} from './test-lake-copy.ts'
import { ALL_WHOLE, lastWhole, loadedOn } from './test-lake-pass.ts'

test('marcar depois: a tabela nova dispara a rodada que lê inteira só ela, e o horário não muda', async (t) => {
  const on = await lakeCopyOn(t)
  const connection = await on.linked()
  assert.equal(
    (await on.put(connection, { tables: [NOTAS], interval: '24h', startDate: null })).statusCode,
    200,
  )
  await finished(on, connection, ['sankhya_notas'])
  const clockId = `schedule_${connection}`
  const first = await on.hub.mastra.schedules.get(clockId)
  const [before] = await on.rows(
    `select c.created_at::text as created_at from copies.lake_table t join copies.lake_copy c using (connection_id) where t.connection_id = $1`,
    [connection],
  )

  const put = await on.put(connection, {
    tables: [NOTAS, PARCEIROS],
    interval: '1h',
    startDate: null,
  })
  assert.equal(put.statusCode, 200, put.body)
  await on.hub.lakeRuns.idle()
  const runs = await runsOf(on, connection)
  assert.equal(runs.length, 2)
  assert.deepEqual(wholeOf(on, runs[1]?.id), { sankhya_notas: false, sankhya_parceiros: true })

  const second = await on.hub.mastra.schedules.get(clockId)
  assert.ok(first?.cron !== undefined && second?.cron !== undefined)
  assert.notEqual(second.cron, first.cron, 'the interval changed')
  assert.equal(
    second.cron.split(' ')[0],
    first.cron.split(' ')[0],
    'the minute of the start did not',
  )
  const [after] = await on.rows(
    `select c.created_at::text as created_at from copies.lake_table t join copies.lake_copy c using (connection_id) where t.connection_id = $1 order by name`,
    [connection],
  )
  assert.equal(after?.created_at, before?.created_at)

  const open = await on.put(connection, {
    tables: [NOTAS, PARCEIROS, PRODUTOS],
    interval: '1h',
    startDate: null,
  })
  assert.equal(open.statusCode, 200, open.body)
  await on.hub.lakeRuns.idle()
  assert.equal((await runsOf(on, connection)).length, 2, 'a round already open takes no second one')
  const [marked] = await on.rows(
    `select count(*)::int as n from copies.lake_table where connection_id = $1`,
    [connection],
  )
  assert.equal(marked?.n, 3)
})

test('a data só grava: nenhuma rodada começa, nem com uma data mais antiga, e a resposta traz a data', async (t) => {
  const on = await lakeCopyOn(t)
  const connection = await on.linked()
  const marks = { tables: [NOTAS, PARCEIROS], interval: '24h' }
  assert.equal(
    on.viewOf(await on.put(connection, { ...marks, startDate: '2025-06-01' })).startDate,
    '2025-06-01',
  )
  await finished(on, connection, ['sankhya_notas', 'sankhya_parceiros'])
  const before = await counts(on)

  for (const startDate of ['2024-01-01', '2024-01-01', '2026-01-01', null]) {
    const view = on.viewOf(await on.put(connection, { ...marks, startDate }))
    assert.equal(view.startDate, startDate)
    await on.hub.lakeRuns.idle()
    assert.deepEqual(await counts(on), before, `no round for ${startDate}`)
  }
  const [row] = await on.rows(
    `select start_date::text as start_date from copies.lake_copy where connection_id = $1`,
    [connection],
  )
  assert.equal(row?.start_date, null)
})

test('a data de hoje é a de São Paulo, não a do relógio da máquina', async (t) => {
  const on = await lakeCopyOn(t, { now: new Date('2026-11-25T01:30:00Z') })
  const connection = await on.linked()
  const tomorrow = await on.put(connection, {
    tables: [NOTAS],
    interval: '24h',
    startDate: '2026-11-25',
  })
  assert.deepEqual([tomorrow.statusCode, codeOf(tomorrow)], [422, 'COPY_START_DATE_INVALID'])
  const today = await on.put(connection, {
    tables: [NOTAS],
    interval: '24h',
    startDate: '2026-11-24',
  })
  assert.equal(today.statusCode, 200, today.body)
})

test('inteira em todas: Ler tudo de novo pede whole em cada tabela marcada, cadastro e NF-e incluídos, com a data na tarefa; com rodada aberta, já está rodando', async (t) => {
  const on = await lakeCopyOn(t)
  const connection = await on.linked()
  const marks = { tables: [NOTAS, PARCEIROS, NFE], interval: '24h' }
  const names = marks.tables.map(({ name }) => name)
  assert.equal((await on.put(connection, { ...marks, startDate: '2024-03-01' })).statusCode, 200)
  await finished(on, connection, names)

  const queued = await on.run(connection, { whole: true })
  assert.equal(queued.statusCode, 202, queued.body)
  assert.deepEqual(bodyOfStatus(runLakeCopy, 202)?.parse(queued.json()), { already: false })
  await on.hub.lakeRuns.idle()
  const runs = await runsOf(on, connection)
  assert.equal(runs.length, 2)
  assert.equal(runs[1]?.whole, true)
  const spec = specOf(on, runs[1]?.id)
  assert.equal(spec.startDate, '2024-03-01', 'the copy date is in the spec')
  assert.deepEqual(wholeOf(on, runs[1]?.id), {
    sankhya_notas: true,
    sankhya_parceiros: true,
    sankhya_notas_nfe: true,
  })

  const before = await counts(on)
  for (const body of [{ whole: true }, {}]) {
    const already = await on.run(connection, body)
    assert.equal(already.statusCode, 200, already.body)
    assert.deepEqual(bodyOfStatus(runLakeCopy, 200)?.parse(already.json()), { already: true })
  }
  await on.hub.lakeRuns.idle()
  assert.deepEqual(await counts(on), before, 'already running writes nothing')

  await finished(on, connection, names)
  const plain = await on.run(connection)
  assert.equal(plain.statusCode, 202)
  await on.hub.lakeRuns.idle()
  const last = (await runsOf(on, connection)).at(-1)
  assert.deepEqual(wholeOf(on, last?.id), {
    sankhya_notas: false,
    sankhya_parceiros: false,
    sankhya_notas_nfe: false,
  })
})

test('a passada que dispara enquanto a rodada abre entra nela', async (t) => {
  const { on, connection } = await loadedOn(t, 'DAILY')
  const held = 'lock table copies.lake_run in exclusive mode'

  await withOwnerLock(on.hub.test, held, [], async (release) => {
    const asked = on.hub.lakeRuns.iniciarRodada(on.at, connection, 'CLOCK')
    await queued(on.hub.test, 1, asked)
    assert.equal(await on.hub.lakeRuns.markFullPass(on.at, connection), 'DUE')
    await release()
    return asked
  })
  await on.hub.lakeRuns.idle()

  assert.deepEqual(await lastWhole(on, connection), ALL_WHOLE)
})

test('rodar agora vale também sem relógio, e sem cópia não há o que rodar', async (t) => {
  const on = await lakeCopyOn(t)
  const connection = await on.linked()
  const none = await on.run(connection)
  assert.deepEqual([none.statusCode, codeOf(none)], [404, 'NOT_FOUND'])
  assert.equal(
    (await on.put(connection, { tables: [NOTAS], interval: 'MANUAL', startDate: null })).statusCode,
    200,
  )
  await finished(on, connection, ['sankhya_notas'])
  assert.equal((await on.run(connection)).statusCode, 202)
})
