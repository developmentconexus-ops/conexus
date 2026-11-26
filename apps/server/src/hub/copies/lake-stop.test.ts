import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { LakeRun, LakeRunId, LakeTableSummary } from '@conexus/hub-api'
import { z } from 'zod'
import { queued, TEST_ORIGIN, withOwnerLock } from '../../platform/test-database.ts'
import { until } from '../../platform/test-until.ts'
import type { Person } from '../identity/test-hub.ts'
import { ANA_OWNER, call, codeOf, personOn } from '../identity/test-hub.ts'
import type { LakeCopyOn } from './test-lake-copy.ts'
import { DAILY, finished, lakeCopyOn, NOTAS, PARCEIROS, runsOf, wholeOf } from './test-lake-copy.ts'
import { drained, result, finished as taskExited } from './test-lake-queue.ts'

const SILENT = { kind: 'NO_ANSWER' } as const

function stop(on: LakeCopyOn, connection: string, who: Person = on.ana) {
  return on.hub.app.inject({
    method: 'POST',
    url: `${on.base}/${connection}/lake-copy/run/stop`,
    headers: { origin: TEST_ORIGIN, cookie: who.cookie },
  })
}

async function answerOf(response: ReturnType<typeof stop>) {
  const answered = await response
  return [answered.statusCode, answered.json()]
}

async function openRound(on: LakeCopyOn) {
  const connection = await on.linked()
  assert.equal((await on.put(connection, { tables: [NOTAS, PARCEIROS], ...DAILY })).statusCode, 200)
  await on.hub.lakeRuns.idle()
  const [round] = await runsOf(on, connection)
  const [task] = on.aws.tasks()
  assert.ok(round !== undefined && task !== undefined, 'the round is open with its task')
  return { connection, run: LakeRunId.parse(round.id), arn: task.arn }
}

async function rowOf(on: LakeCopyOn, run: string) {
  const [row] = await on.rows(
    `select outcome, code, system_message, stopped_by from copies.lake_run where id = $1`,
    [run],
  )
  return row
}

const OPEN = { outcome: null, code: null, system_message: null }
const INTERRUPTED = { outcome: 'INTERRUPTED', code: null, system_message: null }

async function consumed(t: TestContext, on: LakeCopyOn, run: string) {
  t.after(() => on.hub.lakeRuns.queue.stop())
  await on.hub.lakeRuns.queue.start()
  await until(async () => (await rowOf(on, run))?.outcome !== null, 'the queue closed the round')
}

function linesOf(on: LakeCopyOn, message: string) {
  return on.hub.lines.filter((line) => line.message === message).map(({ fields }) => fields)
}

async function lastRunOf(on: LakeCopyOn, connection: string) {
  return on.viewOf(await on.get(connection)).lastRun
}

test('parar com a rodada aberta: 202 sem esperar a parada, o parâmetro sai antes do StopTask, e o evento da ECS fecha INTERRUPTED com quem parou', async (t) => {
  const on = await lakeCopyOn(t)
  const { connection, run, arn } = await openRound(on)
  const before = await lastRunOf(on, connection)
  assert.equal(before?.outcome === 'RUNNING' && before.stopping, false)
  on.aws.lagStops(1_000)
  const calls = on.aws.calls().length

  assert.deepEqual(await answerOf(stop(on, connection)), [202, { stopping: true }])
  assert.deepEqual(on.aws.calls().slice(calls), ['DeleteParameter', 'StopTask'])
  assert.deepEqual(on.aws.parameters(), [])
  assert.deepEqual(await rowOf(on, run), { ...OPEN, stopped_by: on.ana.id })
  const asked = await lastRunOf(on, connection)
  assert.equal(asked?.outcome === 'RUNNING' && asked.stopping, true)
  assert.deepEqual(linesOf(on, 'LAKE_COPY_STOP_ASKED'), [
    { by: on.ana.id, companyId: on.companyId, connectionId: connection, runId: run },
  ])

  on.aws.endTask(arn)
  await consumed(t, on, run)

  assert.deepEqual(await rowOf(on, run), { ...INTERRUPTED, stopped_by: on.ana.id })
  const [ended] = linesOf(on, 'COPY_RUN_ENDED')
  assert.deepEqual(
    [ended?.outcome, ended?.cause, ended?.asked, ended?.by],
    ['INTERRUPTED', 'ECS_STOPPED', true, on.ana.id],
  )
  const by = { name: ANA_OWNER.name }
  const closed = await lastRunOf(on, connection)
  assert.deepEqual(closed?.outcome === 'INTERRUPTED' && closed.stoppedBy, by)
  const view = on.viewOf(await on.get(connection))
  for (const table of view.tables.filter(({ copy }) => copy.kind === 'MARKED')) {
    const last = table.copy.kind === 'MARKED' ? table.copy.lastRun : null
    assert.deepEqual(last?.outcome === 'INTERRUPTED' && last.stoppedBy, by, table.source)
  }
  const company = `/api/companies/${on.companyId}/lake-tables`
  const listed = z
    .array(LakeTableSummary)
    .parse((await call(on.hub, on.ana, 'GET', company)).json())
  for (const table of listed) {
    const last = table.lastRun
    assert.deepEqual(last?.outcome === 'INTERRUPTED' && last.stoppedBy, by, table.name)
    const rounds = await call(on.hub, on.ana, 'GET', `${company}/${table.id}/runs`)
    const [round] = z.array(LakeRun).parse(rounds.json())
    assert.deepEqual(round?.outcome === 'INTERRUPTED' && round.stoppedBy, by, table.name)
  }
  assert.equal(listed.length, 2)
})

test('parar sem rodada aberta: 200, nenhuma chamada à AWS e nada escrito; a ligação sem cópia responde igual', async (t) => {
  const on = await lakeCopyOn(t)
  const { connection, run } = await openRound(on)
  await finished(on, connection, ['sankhya_notas', 'sankhya_parceiros'])
  const bare = await on.linked('Filial')
  const calls = on.aws.calls().length

  assert.deepEqual(await answerOf(stop(on, connection)), [200, { stopping: false }])
  assert.deepEqual(await answerOf(stop(on, bare)), [200, { stopping: false }])

  assert.deepEqual(on.aws.calls().slice(calls), [])
  assert.equal((await rowOf(on, run))?.stopped_by, null)
  assert.deepEqual(linesOf(on, 'LAKE_COPY_STOP_ASKED'), [])
})

test('parar é de quem gerencia cópias: membro, desenvolvedor, estranho e ligação desconhecida recebem 404 sem tocar a rodada; o administrador para', async (t) => {
  const on = await lakeCopyOn(t)
  const { connection, run } = await openRound(on)
  const calls = on.aws.calls().length
  const refused = [
    await on.member('Bia', 'member'),
    await on.member('Davi', 'developer'),
    await personOn(on.hub, { name: 'Fora', email: 'fora@example.test' }),
  ]
  for (const who of refused) {
    const answered = await stop(on, connection, who)
    assert.deepEqual([answered.statusCode, codeOf(answered)], [404, 'NOT_FOUND'], who.id)
  }
  const unknown = await stop(on, '00000000-0000-4000-8000-000000000001')
  assert.deepEqual([unknown.statusCode, codeOf(unknown)], [404, 'NOT_FOUND'])
  assert.deepEqual(on.aws.calls().slice(calls), [])
  assert.deepEqual(await rowOf(on, run), { ...OPEN, stopped_by: null })

  const admin = await on.member('Caio', 'admin')
  assert.deepEqual(await answerOf(stop(on, connection, admin)), [202, { stopping: true }])
})

test('parar duas vezes: a segunda responde igual e fica quem pediu primeiro; com a rodada fechada, 200; quem saiu da empresa não leva o nome', async (t) => {
  const on = await lakeCopyOn(t)
  const { connection, run, arn } = await openRound(on)
  const caio = await on.member('Caio', 'admin')
  on.aws.lagStops(1_000)

  assert.deepEqual(await answerOf(stop(on, connection, caio)), [202, { stopping: true }])
  assert.deepEqual(await answerOf(stop(on, connection)), [202, { stopping: true }])
  assert.equal((await rowOf(on, run))?.stopped_by, caio.id)

  on.aws.endTask(arn)
  await consumed(t, on, run)
  const closed = await lastRunOf(on, connection)
  assert.deepEqual(closed?.outcome === 'INTERRUPTED' && closed.stoppedBy, { name: 'Caio' })
  assert.deepEqual(await answerOf(stop(on, connection)), [200, { stopping: false }])
  assert.equal(linesOf(on, 'COPY_RUN_ENDED').length, 1)

  await on.rows(`delete from auth.member where user_id = $1`, [caio.id])
  const after = await lastRunOf(on, connection)
  assert.equal(after?.outcome === 'INTERRUPTED' && after.stoppedBy, null)
})

test('parar durante a partida: sem tarefa, a rodada fecha na hora, e a partida desfaz a tarefa que iniciou depois', async (t) => {
  const on = await lakeCopyOn(t)
  const connection = await on.linked()
  // The SDK repeats a silent request inside the call: both are held, and the start tries again.
  on.aws.start.script('PutParameter', 'HELD')
  on.aws.start.script('PutParameter', 'HELD')
  assert.equal((await on.put(connection, { tables: [NOTAS], ...DAILY })).statusCode, 200)
  await until(() => on.aws.parameters().length === 1, 'the start wrote its parameter')
  const [round] = await runsOf(on, connection)

  assert.deepEqual(await answerOf(stop(on, connection)), [202, { stopping: true }])
  assert.deepEqual(on.aws.tasks(), [], 'there was no task to stop')
  assert.deepEqual(await rowOf(on, String(round?.id)), { ...INTERRUPTED, stopped_by: on.ana.id })
  const [ended] = linesOf(on, 'COPY_RUN_ENDED')
  assert.deepEqual([ended?.cause, ended?.asked, ended?.by], ['PERSON', true, on.ana.id])

  await on.hub.lakeRuns.idle()
  assert.deepEqual(
    on.aws.tasks().map(({ stopped }) => stopped),
    [true],
  )
  assert.deepEqual(on.aws.parameters(), [])
  assert.equal(linesOf(on, 'COPY_START_UNDONE').length, 1)
})

test('parar com o parâmetro que a AWS não apaga: 503 e nada escrito', async (t) => {
  const on = await lakeCopyOn(t, {
    tasks: (real) => ({ ...real, deleteRun: async () => SILENT }),
  })
  const { connection, run, arn } = await openRound(on)

  const answered = await stop(on, connection)

  assert.deepEqual([answered.statusCode, codeOf(answered)], [503, 'COPY_AWS_UNAVAILABLE'])
  assert.deepEqual(await rowOf(on, run), { ...OPEN, stopped_by: null })
  assert.deepEqual(on.aws.tasks(), [{ arn, startedBy: run, stopped: false }])
})

test('parar com o StopTask sem resposta: 503, o pedido fica, a repetição pede de novo', async (t) => {
  let down = true
  const on = await lakeCopyOn(t, {
    tasks: (real) => ({
      ...real,
      stop: async (...asked) => (down ? SILENT : real.stop(...asked)),
    }),
  })
  const { connection, run } = await openRound(on)

  const refused = await stop(on, connection)
  assert.deepEqual([refused.statusCode, codeOf(refused)], [503, 'COPY_AWS_UNAVAILABLE'])
  assert.deepEqual(await rowOf(on, run), { ...OPEN, stopped_by: on.ana.id })

  down = false
  assert.deepEqual(await answerOf(stop(on, connection)), [202, { stopping: true }])
  assert.equal(on.aws.tasks()[0]?.stopped, true)
})

test('a tarefa que sai sozinha depois do pedido de parar fecha INTERRUPTED, não como tarefa perdida', async (t) => {
  const on = await lakeCopyOn(t, { tasks: (real) => ({ ...real, stop: async () => SILENT }) })
  const { connection, run, arn } = await openRound(on)
  assert.equal((await stop(on, connection)).statusCode, 503)

  on.aws.endTask(arn, 'EXITED')
  await consumed(t, on, run)

  assert.deepEqual(await rowOf(on, run), { ...INTERRUPTED, stopped_by: on.ana.id })
  const [ended] = linesOf(on, 'COPY_RUN_ENDED')
  assert.deepEqual(
    [ended?.outcome, ended?.cause, ended?.asked, ended?.code],
    ['INTERRUPTED', 'ECS_STOPPED', true, undefined],
  )
})

test('a rodada parada conta o que gravou: o resultado interrompido vale depois do evento da ECS, e a primeira carga recomeça', async (t) => {
  const on = await lakeCopyOn(t)
  const { connection, run, arn } = await openRound(on)
  on.aws.lagStops(1_000)
  assert.equal((await stop(on, connection)).statusCode, 202)

  taskExited(on, { run, arn }, 'UserInitiated')
  t.after(() => on.hub.lakeRuns.queue.stop())
  await on.hub.lakeRuns.queue.start()
  await drained(on)
  assert.deepEqual(await rowOf(on, run), { ...OPEN, stopped_by: on.ana.id })
  const counts = { read: 20, written: 10, rounded: 0, rows: null, whole: true }
  on.aws.enqueue(result(run, { kind: 'INTERRUPTED' }, [{ name: 'sankhya_notas', ...counts }]))
  await until(async () => (await rowOf(on, run))?.outcome !== null, 'the result closed the round')

  const view = on.viewOf(await on.get(connection))
  const notas = view.tables.find(({ source }) => source === 'TGFCAB')?.copy
  assert.ok(view.lastRun?.outcome === 'INTERRUPTED' && notas?.kind === 'MARKED')
  assert.ok(notas.lastRun?.outcome === 'INTERRUPTED' && notas.firstLoad)
  assert.deepEqual([view.lastRun.read, view.lastRun.written], [20, 10])
  assert.deepEqual([notas.lastRun.read, notas.lastRun.written], [20, 10])
  assert.equal((await on.run(connection)).statusCode, 202)
  await on.hub.lakeRuns.idle()
  const [, next] = await runsOf(on, connection)
  assert.deepEqual(wholeOf(on, next?.id), { sankhya_notas: true, sankhya_parceiros: true })
})

test('o resultado que chega depois do pedido de parar vale: o erro da tarefa continua erro', async (t) => {
  const on = await lakeCopyOn(t)
  const { connection, run } = await openRound(on)
  on.aws.lagStops(1_000)
  assert.equal((await stop(on, connection)).statusCode, 202)

  const failed = { kind: 'ERROR', code: 'COPY_LAKE_WRITE_FAILED', table: null, system: null }
  on.aws.enqueue(result(run, failed))
  await consumed(t, on, run)

  const row = await rowOf(on, run)
  assert.deepEqual([row?.outcome, row?.code], ['ERROR', 'COPY_LAKE_WRITE_FAILED'])
  const [ended] = linesOf(on, 'COPY_RUN_ENDED')
  assert.deepEqual([ended?.cause, ended?.asked, ended?.by], ['RESULT', true, on.ana.id])
})

test('a rodada que fecha enquanto o Parar apaga o parâmetro: 200, sem quem parou e sem StopTask', async (t) => {
  const meanwhile: (() => Promise<void>)[] = []
  const on = await lakeCopyOn(t, {
    tasks: (real) => ({
      ...real,
      deleteRun: async (...asked) => {
        await meanwhile.pop()?.()
        return real.deleteRun(...asked)
      },
    }),
  })
  const { connection, run } = await openRound(on)
  meanwhile.push(() => finished(on, connection, ['sankhya_notas', 'sankhya_parceiros']))
  const calls = on.aws.calls().length

  assert.deepEqual(await answerOf(stop(on, connection)), [200, { stopping: false }])

  assert.equal((await rowOf(on, run))?.stopped_by, null)
  assert.equal(on.aws.calls().slice(calls).includes('StopTask'), false)
  assert.deepEqual(linesOf(on, 'LAKE_COPY_STOP_ASKED'), [])
})

function closedByStop(on: LakeCopyOn, run: LakeRunId) {
  const close = { run, end: { kind: 'INTERRUPTED' }, tables: [], cause: 'ECS_STOPPED' } as const
  return on.hub.lakeRuns.closeLakeRun(on.at, close)
}

test('dois fechamentos da mesma rodada ao mesmo tempo: um vence, e o fim sai uma vez só', async (t) => {
  const on = await lakeCopyOn(t)
  const { run } = await openRound(on)
  const held = 'select 1 from copies.lake_run where id = $1 for update'

  await withOwnerLock(on.hub.test, held, [run], async (release) => {
    const both = Promise.all([closedByStop(on, run), closedByStop(on, run)])
    await queued(on.hub.test, 2, both)
    await release()
    return both
  })

  assert.equal(linesOf(on, 'COPY_RUN_ENDED').length, 1)
})

test('a primeira carga: a tela avisa das mesmas tabelas que a rodada seguinte lê inteiras', async (t) => {
  const on = await lakeCopyOn(t)
  const { connection, run } = await openRound(on)
  async function firstLoads() {
    const view = on.viewOf(await on.get(connection))
    return Object.fromEntries(
      view.tables.flatMap(({ source, copy }) =>
        copy.kind === 'MARKED' ? [[source, copy.firstLoad]] : [],
      ),
    )
  }
  assert.deepEqual(await firstLoads(), { TGFCAB: true, TGFPAR: true })
  assert.deepEqual(wholeOf(on, run), { sankhya_notas: true, sankhya_parceiros: true })

  await finished(on, connection, ['sankhya_notas'])
  assert.equal((await on.run(connection)).statusCode, 202)
  await on.hub.lakeRuns.idle()
  const [, next] = await runsOf(on, connection)

  assert.deepEqual(await firstLoads(), { TGFCAB: false, TGFPAR: true })
  assert.deepEqual(wholeOf(on, next?.id), { sankhya_notas: false, sankhya_parceiros: true })
})
