import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setTimeout } from 'node:timers/promises'
import type { CopyId } from '@conexus/hub-api'
import { PADARIA_SOL_MATRIZ } from '../connectors/test-sales.ts'
import type { CopiesOn } from './test-copies.ts'
import {
  copiesOn,
  copyRowOf,
  holdPage,
  plantCopy,
  runsOf,
  syncRows,
  TEST_TUNING,
} from './test-copies.ts'

const NOTAS = PADARIA_SOL_MATRIZ.notas
const ITENS = NOTAS.flatMap((nota) => nota.itens.map((_, at) => [nota.nunota, at + 1]))

async function ended(on: CopiesOn, copyId: CopyId) {
  const end = await on.run(copyId)
  assert.equal(end.kind, 'ENDED', JSON.stringify(end))
  return end.kind === 'ENDED' ? end.outcome : undefined
}

function nunotasOf(rows: string[][]) {
  return rows.map((row) => Number(row[0]))
}

test('a passada completa', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  assert.deepEqual(await ended(on, copyId), { kind: 'COMPLETE' })
  const [run] = await runsOf(on, copyId)
  assert.deepEqual(
    { outcome: run.outcome, pages: run.pages, read: run.read, written: run.written },
    { outcome: 'COMPLETE', pages: 4, read: NOTAS.length, written: NOTAS.length },
    '183 vendas em páginas de 50',
  )
  const row = await copyRowOf(on, copyId)
  assert.equal(Number(row.rows), NOTAS.length)
  assert.equal(row.pass, 1)
  assert.equal(row.position, null)
  assert.equal(row.pass_started_at, null)
  assert.equal(row.claim_token, null)
  assert.ok(row.watermark !== null, 'a marca é a hora em que a passada começou')
  const first = await syncRows(on.owner, 'vendas', ['NUNOTA'])
  assert.deepEqual(
    nunotasOf(first),
    [...NOTAS.map((n) => n.nunota)].sort((a, b) => a - b),
  )

  assert.deepEqual(await ended(on, copyId), { kind: 'COMPLETE' })
  const again = await syncRows(on.owner, 'vendas', ['NUNOTA'])
  assert.equal(again.length, NOTAS.length, 'gravar de novo não duplica')
  assert.equal(Number((await copyRowOf(on, copyId)).rows), NOTAS.length)
  assert.equal((await copyRowOf(on, copyId)).pass, 2)
})

test('uma rodada por vez', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  const held = holdPage(on)
  const first = on.run(copyId)
  await held.arrived
  assert.deepEqual(await on.run(copyId), { kind: 'RUNNING' })
  assert.equal((await runsOf(on, copyId)).length, 1, 'nenhuma linha nova de rodada')
  held.release()
  assert.deepEqual(await first, { kind: 'ENDED', outcome: { kind: 'COMPLETE' } })
  assert.equal(on.gate.pages, 4, 'só a primeira leu')
})

test('a rodada órfã e a trava perdida', async (t) => {
  const on = await copiesOn(t, { ...TEST_TUNING, leaseMs: 300 })
  const copyId = await on.enable('vendas')
  const held = holdPage(on, 2)
  const orphan = on.run(copyId)
  await held.arrived
  await setTimeout(400)
  assert.deepEqual(await ended(on, copyId), { kind: 'COMPLETE' })
  const [taken, left] = await runsOf(on, copyId)
  assert.equal(left.outcome, 'INTERRUPTED', 'a rodada aberta fecha INTERRUPTED')
  assert.equal(taken.outcome, 'COMPLETE')
  assert.equal(taken.pages, 3, 'continua da posição salva, sem reler a primeira página')
  assert.equal(on.gate.pages, 5)
  const after = await copyRowOf(on, copyId)

  held.release()
  assert.deepEqual(await orphan, { kind: 'ENDED', outcome: { kind: 'INTERRUPTED' } })
  assert.ok(on.hub.lines.some((line) => line.message === 'COPY_CLAIM_LOST'))
  assert.deepEqual(await copyRowOf(on, copyId), after, 'nem posição, nem marca, nem fechamento')
  assert.deepEqual(
    (await runsOf(on, copyId)).map((run) => run.outcome),
    ['COMPLETE', 'INTERRUPTED'],
  )
  assert.equal(on.gate.pages, 5, 'a perdida para antes da página seguinte')
})

test('o teto', async (t) => {
  const on = await copiesOn(t, { ...TEST_TUNING, runPages: 2 })
  const copyId = await on.enable('vendas')
  on.calls.length = 0
  assert.deepEqual(await ended(on, copyId), { kind: 'PARTIAL', reason: 'CAP' })
  const capped = await copyRowOf(on, copyId)
  assert.deepEqual(capped.position, [NOTAS.map((n) => n.nunota).sort((a, b) => a - b)[99]])
  assert.equal(capped.watermark, null, 'a marca não avança')
  assert.equal((await syncRows(on.owner, 'vendas', ['NUNOTA'])).length, 100)
  assert.deepEqual(on.calls, [`runNow ${copyId}`], 'pede outra rodada ao relógio')
  const [run] = await runsOf(on, copyId)
  assert.deepEqual([run.outcome, run.reason, run.pages], ['PARTIAL', 'CAP', 2])
  assert.deepEqual(await ended(on, copyId), { kind: 'COMPLETE' })
  assert.equal((await syncRows(on.owner, 'vendas', ['NUNOTA'])).length, NOTAS.length)
  assert.equal((await copyRowOf(on, copyId)).pass, 1)
})

/** The Matriz's note of a day (`YYYY-MM-DD`) and seller. */
function notaOf(day: string, seller = 0) {
  const found = NOTAS.filter((nota) => nota.dtneg === day)[seller]
  assert.ok(found)
  return found.nunota
}

/** The first pass as of 31 October, the second as of 1 November: the window from 1 and 2 October. */
async function twoPasses(on: CopiesOn, model: 'vendas' | 'itens_venda') {
  const copyId = await on.enable(model)
  await plantCopy(on, copyId, 'pass_started_at = $2', ['2026-10-31T12:00:00Z'])
  assert.deepEqual(await ended(on, copyId), { kind: 'COMPLETE' })
  return copyId
}

const KEPT_IN_WINDOW = '2026-10-05'
const GONE_IN_WINDOW = '2026-10-15'
const GONE_OUTSIDE = '2026-09-15'

test('a janela apaga o que sumiu', async (t) => {
  const on = await copiesOn(t, { ...TEST_TUNING, pageRows: 500 })
  const copyId = await twoPasses(on, 'vendas')
  const key = ['NUNOTA']
  const before = await syncRows(on.owner, 'vendas', key)
  on.gate.gone.add(String(notaOf(GONE_IN_WINDOW)))
  on.gate.gone.add(String(notaOf(GONE_OUTSIDE)))
  await plantCopy(on, copyId, 'pass_started_at = $2', ['2026-11-01T12:00:00Z'])
  on.fake.switches.refuse.add('consultar')
  assert.deepEqual(await ended(on, copyId), { kind: 'ERROR', code: 'COPY_SOURCE_REFUSED' })
  assert.deepEqual(await syncRows(on.owner, 'vendas', key), before, 'com erro nada sai')
  on.fake.switches.refuse.delete('consultar')
  assert.deepEqual(await ended(on, copyId), { kind: 'COMPLETE' })
  const after = nunotasOf(await syncRows(on.owner, 'vendas', key))
  assert.ok(!after.includes(notaOf(GONE_IN_WINDOW)), 'o que sumiu dentro da janela sai')
  assert.ok(after.includes(notaOf(GONE_OUTSIDE)), 'fora da janela nada sai')
  assert.equal(after.length, NOTAS.length - 1)
})

test('a janela relê o que não mudou', async (t) => {
  const on = await copiesOn(t, { ...TEST_TUNING, pageRows: 500 })
  for (const model of ['vendas', 'itens_venda'] as const) {
    const copyId = await twoPasses(on, model)
    const key = model === 'vendas' ? ['NUNOTA'] : ['NUNOTA', 'SEQUENCIA']
    assert.equal(
      (await syncRows(on.owner, model, key)).length,
      model === 'vendas' ? NOTAS.length : ITENS.length,
    )
    on.gate.gone.add(String(notaOf(GONE_IN_WINDOW, 1)))
    await plantCopy(on, copyId, 'pass_started_at = $2', ['2026-11-01T12:00:00Z'])
    assert.deepEqual(await ended(on, copyId), { kind: 'COMPLETE' })
    const rows = await syncRows(on.owner, model, key)
    const kept = rows.filter((row) => Number(row[0]) === notaOf(KEPT_IN_WINDOW))
    assert.ok(kept.length > 0, `${model}: a venda da janela que não mudou continua`)
    assert.ok(
      kept.every((row) => row.at(-1) === '1'),
      `${model}: relida pela janela na segunda passada`,
    )
    assert.ok(
      !rows.some((row) => Number(row[0]) === notaOf(GONE_IN_WINDOW, 1)),
      `${model}: a que sumiu da fonte sai`,
    )
    on.gate.gone.clear()
  }
})

test('o erro não vira vazio', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('clientes')
  on.fake.switches.refuse.add('consultar')
  assert.deepEqual(await ended(on, copyId), { kind: 'ERROR', code: 'COPY_SOURCE_REFUSED' })
  on.fake.switches.refuse.delete('consultar')
  on.fake.switches.malformed = true
  assert.deepEqual(await ended(on, copyId), { kind: 'ERROR', code: 'COPY_SOURCE_UNREADABLE' })
  on.fake.switches.malformed = false
  on.fake.switches.silent = true
  assert.deepEqual(await ended(on, copyId), { kind: 'ERROR', code: 'COPY_SOURCE_UNREACHABLE' })
  on.fake.switches.silent = false
  const write = t.mock.method(on.hub.postgres.companyPostgres, 'writePage', async () => ({
    kind: 'NO_ANSWER' as const,
  }))
  assert.deepEqual(await ended(on, copyId), { kind: 'ERROR', code: 'COPY_DATABASE_UNAVAILABLE' })
  write.mock.restore()
  const row = await copyRowOf(on, copyId)
  assert.equal(row.watermark, null, 'a marca não avança')
  assert.equal(row.rows, null, 'nunca "0 linhas"')
  assert.deepEqual(await syncRows(on.owner, 'clientes', ['CODPARC']), [])
  assert.deepEqual(
    (await runsOf(on, copyId)).map((run) => [run.outcome, run.reason]),
    [
      ['ERROR', 'COPY_DATABASE_UNAVAILABLE'],
      ['ERROR', 'COPY_SOURCE_UNREACHABLE'],
      ['ERROR', 'COPY_SOURCE_UNREADABLE'],
      ['ERROR', 'COPY_SOURCE_REFUSED'],
    ],
  )
})

test('o Hub vai desligar', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('vendas')
  const held = holdPage(on, 2)
  const running = on.run(copyId)
  await held.arrived
  on.hubState.updating = true
  held.release()
  assert.deepEqual(await running, {
    kind: 'ENDED',
    outcome: { kind: 'PARTIAL', reason: 'STOPPED' },
  })
  const [run] = await runsOf(on, copyId)
  assert.deepEqual([run.outcome, run.reason, run.pages], ['PARTIAL', 'STOPPED', 2])
  assert.equal(on.gate.pages, 2, 'para antes da página seguinte')
})

test('o registro não leva dado', async (t) => {
  const on = await copiesOn(t)
  const copyId = await on.enable('clientes')
  assert.deepEqual(await ended(on, copyId), { kind: 'COMPLETE' })
  const lines = on.hub.lines.filter((line) => line.message.startsWith('COPY_'))
  assert.deepEqual(
    lines.map((line) => line.message),
    ['COPY_ENABLED', 'COPY_RUN_ENDED'],
  )
  const ended_ = lines.find((line) => line.message === 'COPY_RUN_ENDED')
  assert.deepEqual(Object.keys(ended_?.fields ?? {}).sort(), [
    'companyId',
    'copyId',
    'ms',
    'outcome',
    'pages',
    'read',
    'runId',
    'written',
  ])
  const said = JSON.stringify(on.hub.lines)
  for (const data of ['SELECT', 'TGFPAR', 'NOMEPARC', 'MERCADO BOA VISTA', 'CODPARC'])
    assert.ok(!said.includes(data), `o registro não diz ${data}`)
  assert.ok(
    on.hub.lines.some((line) => line.message === 'CONNECTOR_CALLED' && line.fields.by === 'copy'),
  )
})
