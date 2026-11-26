import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import {
  busiestSecond,
  completed,
  lakeRunOn,
  queued,
  roundsOf,
  sentOf,
  specOf,
  TEST_LAKE,
  testClock,
} from './test-lake-run.ts'

const NOTAS = { source: 'TGFCAB', name: 'sankhya_notas' }
const PARCEIROS = { source: 'TGFPAR', name: 'sankhya_parceiros' }

test('o disparo: abre a rodada, grava o parâmetro com o selo aberto e inicia a tarefa com o papel da empresa e o token', async (t) => {
  const on = await lakeRunOn(t)
  const connection = await on.copied([NOTAS, PARCEIROS])
  const run = queued(await on.runs.iniciarRodada(on.at, connection, 'NOW'))
  await on.runs.idle()

  const spec = specOf(on, run)
  assert.equal(spec.runId, run)
  assert.equal(spec.connector, 'sankhya')
  assert.equal(spec.connectionId, connection)
  assert.deepEqual(
    spec.credential,
    on.fake.credential,
    'the seal opened, only into the parameter (S8)',
  )
  assert.deepEqual(
    spec.tables.map(({ source, name }) => ({ source, name })),
    [NOTAS, PARCEIROS],
  )
  assert.equal(spec.queueUrl, on.config.aws.copy.queueUrl)
  assert.equal(spec.lake.bucketArn.endsWith(`:bucket/conexus-${TEST_LAKE}`), true)

  const [sent, ...more] = sentOf(on, run)
  assert.deepEqual(more, [], 'one task')
  assert.ok(sent !== undefined)
  assert.equal(sent.clientToken, `${run}-1`)
  assert.equal(
    sent.overrides.taskRoleArn,
    `arn:aws:iam::${on.config.aws.account}:role/conexus-${TEST_LAKE}-escritor`,
  )
  const [task] = on.aws.tasks()
  assert.deepEqual(await roundsOf(on, connection), [
    { id: run, task_arn: task?.arn, outcome: null, code: null },
  ])
  assert.ok(on.lines.some(({ message }) => message === 'COPY_RUN_QUEUED'))
  const secrets = Object.values(on.fake.credential)
  const said = JSON.stringify(on.lines)
  assert.equal(
    secrets.some((secret) => said.includes(secret)),
    false,
    'no line carries the secret',
  )

  const parameters = on.aws.parameters().length
  assert.deepEqual(await on.runs.iniciarRodada(on.at, connection, 'NOW'), {
    kind: 'ALREADY_RUNNING',
  })
  await on.runs.idle()
  assert.equal(on.aws.tasks().length, 1, 'already running starts nothing')
  assert.equal(on.aws.parameters().length, parameters, 'and writes nothing')
  assert.equal((await roundsOf(on, connection)).length, 1)
})

test('o disparo: sem cópia da ligação, nada abre e a AWS não é chamada', async (t) => {
  const on = await lakeRunOn(t)
  const connection = await on.copied([])
  assert.deepEqual(await on.runs.iniciarRodada(on.at, connection, 'CLOCK'), { kind: 'NO_COPY' })
  assert.deepEqual(on.aws.parameters(), [])
  assert.deepEqual(await roundsOf(on, connection), [])
})

test('o tamanho da máquina: 2 vCPU e 4 GB com uma tabela na primeira carga, 1 vCPU e 2 GB nas outras', async (t) => {
  const on = await lakeRunOn(t)
  const first = await on.copied([{ ...NOTAS, done: true }, PARCEIROS])
  const next = await on.copied(
    [
      { source: 'TGFITE', name: 'sankhya_itens', done: true },
      { source: 'TGFPRO', name: 'sankhya_produtos', done: true },
    ],
    { name: 'Filial' },
  )
  const firstRun = queued(await on.runs.iniciarRodada(on.at, first, 'NOW'))
  const nextRun = queued(await on.runs.iniciarRodada(on.at, next, 'CLOCK'))
  await on.runs.idle()
  assert.deepEqual(
    sentOf(on, firstRun).map(({ overrides }) => [overrides.cpu, overrides.memory]),
    [['2048', '4096']],
  )
  assert.deepEqual(
    sentOf(on, nextRun).map(({ overrides }) => [overrides.cpu, overrides.memory]),
    [['1024', '2048']],
  )
  assert.deepEqual(
    specOf(on, firstRun).tables.map(({ name, whole }) => [name, whole]),
    [
      ['sankhya_notas', false],
      ['sankhya_parceiros', true],
    ],
    'only the table on its first load is read whole',
  )
})

test('uma partida por vez: vinte disparos de vinte ligações no mesmo segundo abrem as vinte, e o dublê do parâmetro nunca recebe mais de 3 por segundo', async (t) => {
  const clock = testClock()
  const on = await lakeRunOn(t, clock)
  const connections = []
  for (let at = 0; at < 20; at += 1)
    connections.push(
      await on.copied([{ source: 'TGFPAR', name: `sankhya_parceiros_${at}`, done: true }], {
        name: `Ligação ${at}`,
      }),
    )
  const answers = await Promise.all(
    connections.map((connection) => on.runs.iniciarRodada(on.at, connection, 'CLOCK')),
  )
  assert.deepEqual(
    answers.map(({ kind }) => kind),
    connections.map(() => 'QUEUED'),
  )
  await on.runs.idle()
  assert.equal(on.aws.start.writes.length, 20)
  assert.ok(busiestSecond(on.aws.start.writes) <= 3, `at most 3 a second: ${on.aws.start.writes}`)
  assert.equal(on.aws.tasks().length, 20)
  const open = await on.rows(
    `select count(*)::int as open from copies.lake_run where ended_at is null and task_arn is not null`,
  )
  assert.deepEqual(open, [{ open: 20 }])
})

test('dois disparos juntos: Rodar agora duas vezes ao mesmo tempo inicia uma tarefa só', async (t) => {
  const on = await lakeRunOn(t)
  const connection = await on.copied([NOTAS])
  const answers = await Promise.all([
    on.runs.iniciarRodada(on.at, connection, 'NOW'),
    on.runs.iniciarRodada(on.at, connection, 'NOW'),
  ])
  await on.runs.idle()
  assert.deepEqual(answers.map(({ kind }) => kind).sort(), ['ALREADY_RUNNING', 'QUEUED'])
  assert.equal(on.aws.tasks().length, 1)
  assert.equal((await roundsOf(on, connection)).length, 1)
})

test('a AWS recusa: o RunTask recusado fecha a rodada como COPY_LAKE_UNAVAILABLE e apaga o parâmetro', async (t) => {
  const on = await lakeRunOn(t)
  const connection = await on.copied([NOTAS])
  on.aws.start.script('RunTask', 'REFUSED')
  const run = queued(await on.runs.iniciarRodada(on.at, connection, 'NOW'))
  await on.runs.idle()
  assert.deepEqual(await roundsOf(on, connection), [
    { id: run, task_arn: null, outcome: 'ERROR', code: 'COPY_LAKE_UNAVAILABLE' },
  ])
  assert.deepEqual(on.aws.parameters(), [])
  assert.deepEqual(on.aws.tasks(), [])
  const failed = on.lines.find(({ message }) => message === 'COPY_LAKE_START_FAILED')
  assert.deepEqual(failed?.fields, {
    companyId: on.companyId,
    connectionId: connection,
    runId: run,
    call: 'RunTask',
    answer: 'REFUSED',
    code: 'ClientException',
  })
})

test('a AWS não responde: o RunTask sem resposta é repetido com o mesmo token e a AWS não inicia duas; o parâmetro sem resposta fecha a rodada', async (t) => {
  const on = await lakeRunOn(t)
  const connection = await on.copied([NOTAS])
  on.aws.start.script('RunTask', 'HELD')
  on.aws.start.script('RunTask', 'HELD')
  const run = queued(await on.runs.iniciarRodada(on.at, connection, 'NOW'))
  await on.runs.idle()
  const tokens = new Set(sentOf(on, run).map(({ clientToken }) => clientToken))
  assert.deepEqual([...tokens], [`${run}-1`])
  assert.equal(on.aws.tasks().length, 1, 'one task for the token')
  const [round] = await roundsOf(on, connection)
  assert.equal(round?.task_arn, on.aws.tasks()[0]?.arn)

  await completed(on, run)
  // The SDK repeats a silent call inside each of the three tries: every request is held.
  for (let held = 0; held < 10; held += 1) on.aws.start.script('PutParameter', 'HELD')
  const silent = queued(await on.runs.iniciarRodada(on.at, connection, 'NOW'))
  await on.runs.idle()
  const after = await roundsOf(on, connection)
  assert.deepEqual(after.at(-1), {
    id: silent,
    task_arn: null,
    outcome: 'ERROR',
    code: 'COPY_LAKE_UNAVAILABLE',
  })
  assert.deepEqual(
    on.aws.parameters(),
    [],
    'the parameter that took effect is deleted at the close',
  )
  assert.equal(on.aws.tasks().length, 1)
})

test('a data na tarefa: a especificação leva a data da cópia em toda rodada, e whole só nas tabelas que a data limita', async (t) => {
  const on = await lakeRunOn(t)
  const connection = await on.copied(
    [
      { ...NOTAS, done: true },
      { ...PARCEIROS, done: true },
    ],
    {
      startDate: '2026-01-01',
    },
  )
  const plain = queued(await on.runs.iniciarRodada(on.at, connection, 'CLOCK'))
  await on.runs.idle()
  const first = specOf(on, plain)
  assert.equal(first.startDate, '2026-01-01')
  assert.deepEqual(
    first.tables.map(({ name, whole }) => [name, whole]),
    [
      ['sankhya_notas', false],
      ['sankhya_parceiros', false],
    ],
  )
  await completed(on, plain)
  const again = queued(await on.runs.iniciarRodada(on.at, connection, 'NOW', true))
  await on.runs.idle()
  const second = specOf(on, again)
  assert.equal(second.startDate, '2026-01-01')
  assert.deepEqual(
    second.tables.map(({ name, whole }) => [name, whole]),
    [
      ['sankhya_notas', true],
      ['sankhya_parceiros', false],
    ],
    'whole only where startDateLimits',
  )
  const [round] = await on.rows(`select whole from copies.lake_run where id = $1`, [again])
  assert.deepEqual(round, { whole: true })
})

test('as colunas de novo: cada disparo relê o dicionário, e uma coluna nova da fonte entra nas colunas da tabela', async (t) => {
  const on = await lakeRunOn(t)
  const connection = await on.copied([{ ...NOTAS, done: true }])
  async function columnsOf() {
    const [row] = await on.rows(
      `select columns from copies.lake_table where connection_id = $1 and name = $2`,
      [connection, NOTAS.name],
    )
    return z.object({ columns: z.array(z.object({ name: z.string() })) }).parse(row).columns
  }
  const run = queued(await on.runs.iniciarRodada(on.at, connection, 'NOW'))
  await on.runs.idle()
  assert.equal((await columnsOf()).length, 450)
  await completed(on, run)

  const added = await fetch(new URL('/__teste/colunas', on.served.origin), { method: 'POST' })
  const { coluna } = z.object({ coluna: z.string() }).parse(await added.json())
  queued(await on.runs.iniciarRodada(on.at, connection, 'CLOCK'))
  await on.runs.idle()
  const columns = await columnsOf()
  assert.equal(columns.length, 451)
  assert.ok(columns.some(({ name }) => name === coluna))
})
