import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { after, test } from 'node:test'
import { ciRuns, ISSUE_TITLE, issueBody, overBudget } from './ci-budget.ts'

const SCRIPT = resolve(import.meta.dirname, 'ci-budget.ts')
const BUDGETS = { check: 15, scripts: 15, server: 10, web: 15 }

type Job = { name: string; conclusion: string; started_at: string; completed_at: string }

// Three runs of `main` from 2026-11-04, as the API answered, reduced to the fields the script
// reads: the id, the commit, the conclusion, and each job's name, conclusion, start and end.
const RECORDED: { id: number; head_sha: string; conclusion: string; jobs: Job[] }[] = [
  {
    id: 41910237381,
    head_sha: 'a31b7faa11a3d8e5673e83599f00a8bfe76c5f57',
    conclusion: 'failure',
    jobs: [
      job('web', 'success', '20:49:29', '20:59:53'),
      job('server (6)', 'success', '20:49:29', '20:58:35'),
      job('server (3)', 'success', '20:49:29', '20:58:19'),
      job('scripts', 'failure', '20:49:29', '20:52:38'),
      job('server (4)', 'success', '20:49:29', '20:57:07'),
      job('server (5)', 'success', '20:49:29', '20:58:07'),
      job('server (1)', 'success', '20:49:34', '20:59:04'),
      job('server (2)', 'success', '20:49:29', '20:59:03'),
    ],
  },
  {
    id: 41896513649,
    head_sha: 'be7623facc40819099d6912a83a03f8f5ef83182',
    conclusion: 'success',
    jobs: [
      job('web', 'success', '19:24:00', '19:34:55'),
      job('server (5)', 'success', '19:24:00', '19:31:06'),
      job('server (2)', 'success', '19:24:00', '19:33:25'),
      job('server (6)', 'success', '19:24:00', '19:33:53'),
      job('server (1)', 'success', '19:24:01', '19:30:01'),
      job('scripts', 'success', '19:24:00', '19:24:58'),
      job('server (4)', 'success', '19:24:00', '19:33:14'),
      job('server (3)', 'success', '19:24:01', '19:31:57'),
    ],
  },
  {
    id: 41894623524,
    head_sha: '6ed65f79e00d5c21c377afb1cf1794742198f524',
    conclusion: 'cancelled',
    jobs: [
      job('server (3)', 'success', '19:12:05', '19:21:24'),
      job('web', 'success', '19:12:05', '19:23:17'),
      job('server (6)', 'success', '19:12:05', '19:21:52'),
      job('server (2)', 'cancelled', '19:12:05', '19:22:09'),
      job('server (4)', 'success', '19:12:05', '19:21:36'),
      job('scripts', 'success', '19:12:06', '19:13:31'),
      job('server (5)', 'success', '19:12:05', '19:19:02'),
      job('server (1)', 'success', '19:12:06', '19:21:32'),
    ],
  },
]

function job(name: string, conclusion: string, start: string, end: string): Job {
  return {
    name,
    conclusion,
    started_at: `2026-11-04T${start}Z`,
    completed_at: `2026-11-04T${end}Z`,
  }
}

/** A run whose only job, a `server` shard, ran for `seconds`. */
function shardRun(id: number, conclusion: string, seconds: number, shardConclusion = conclusion) {
  const end = new Date(Date.UTC(2026, 10, 4, 12, 0, seconds)).toISOString().slice(11, 19)
  return {
    id,
    head_sha: `${String(id).padStart(8, '0')}${'0'.repeat(32)}`,
    conclusion,
    jobs: [job('server (2)', shardConclusion, '12:00:00', end)],
  }
}

function runsOf(runs: { id: number; head_sha: string; conclusion: string; jobs: Job[] }[]) {
  return ciRuns(JSON.stringify({ workflow_runs: runs }), (id) =>
    JSON.stringify({ jobs: runs.find((run) => run.id === id)?.jobs }),
  )
}

test('o maior shard acima de 85% nos três últimos runs abre a conta, e um job cortado conta como 100%', () => {
  const over = overBudget(runsOf(RECORDED), BUDGETS)
  assert.equal(over.length, 1)
  const [server] = over
  assert.equal(server?.job, 'server')
  assert.deepEqual(server?.runs, [41910237381, 41896513649, 41894623524])
  assert.deepEqual(
    server?.percents.map((percent) => Math.round(percent)),
    [96, 99, 100],
  )
})

test('dois de três, ou um run abaixo de 85% no meio, não é uma sequência', () => {
  const high = 540
  const low = 300
  assert.deepEqual(
    overBudget(runsOf([shardRun(3, 'success', high), shardRun(2, 'success', high)]), BUDGETS),
    [],
  )
  assert.deepEqual(
    overBudget(
      runsOf([
        shardRun(3, 'success', high),
        shardRun(2, 'success', low),
        shardRun(1, 'success', high),
      ]),
      BUDGETS,
    ),
    [],
  )
  assert.equal(
    overBudget(
      runsOf([
        shardRun(3, 'success', high),
        shardRun(2, 'success', high),
        shardRun(1, 'success', high),
      ]),
      BUDGETS,
    ).length,
    1,
  )
  assert.deepEqual(
    overBudget(
      runsOf([
        shardRun(3, 'success', 509),
        shardRun(2, 'success', 509),
        shardRun(1, 'success', 509),
      ]),
      BUDGETS,
    ),
    [],
  )
})

test('um run cancelado pela concorrência não quebra a sequência nem conta', () => {
  const high = 560
  const runs = runsOf([
    shardRun(5, 'success', high),
    shardRun(4, 'cancelled', 90),
    shardRun(3, 'success', high),
    shardRun(2, 'success', high),
  ])
  const [server] = overBudget(runs, BUDGETS)
  assert.deepEqual(server?.runs, [5, 3, 2])
  assert.deepEqual(
    overBudget(
      runsOf([
        shardRun(5, 'success', high),
        shardRun(4, 'cancelled', 90),
        shardRun(3, 'success', high),
      ]),
      BUDGETS,
    ),
    [],
  )
})

test('um job cortado no limite conta como 100% mesmo cancelado', () => {
  const runs = runsOf([
    shardRun(3, 'cancelled', 600),
    shardRun(2, 'success', 520),
    shardRun(1, 'success', 520),
  ])
  const [server] = overBudget(runs, BUDGETS)
  assert.equal(server?.percents[0], 100)
  assert.deepEqual(server?.runs, [3, 2, 1])
})

function longRun(id: number) {
  return {
    id,
    head_sha: 'a'.repeat(40),
    conclusion: 'success',
    jobs: [
      job('ci', 'success', '12:00:00', '12:09:59'),
      job('image', 'success', '12:00:00', '12:09:59'),
    ],
  }
}

test('o job ci e os jobs sem orçamento ficam fora da conta', () => {
  const run = longRun
  assert.deepEqual(overBudget(runsOf([run(3), run(2), run(1)]), { ...BUDGETS, ci: 5 }), [])
})

test('o corpo do issue traz a tabela dos runs, acima ou abaixo de 85%', () => {
  const runs = runsOf(RECORDED)
  const body = issueBody(overBudget(runs, BUDGETS), runs, BUDGETS)
  assert.match(body, /`server`/)
  assert.match(body, /\| server \| 10 min \| 96% \| 99% \| 100% \|/)
  assert.match(body, /\| web \| 15 min \| 69% \| 73% \| 75% \|/)
  const calm = runsOf([
    shardRun(3, 'success', 300),
    shardRun(2, 'success', 300),
    shardRun(1, 'success', 300),
  ])
  assert.match(issueBody([], calm, BUDGETS), /^Nenhum job está em 85% ou mais/)
  assert.match(issueBody([], calm, BUDGETS), /\| server \| 10 min \| 50% \| 50% \| 50% \|/)
})

test('uma resposta da API fora do formato é recusada na fronteira', () => {
  function none(): string {
    return JSON.stringify({ jobs: [] })
  }
  assert.throws(() => ciRuns(JSON.stringify({ workflow_runs: [{ id: 'x' }] }), none))
  assert.throws(() =>
    ciRuns(
      JSON.stringify({ workflow_runs: [{ id: 1, head_sha: 'a', conclusion: 'success' }] }),
      () => JSON.stringify({ jobs: [{ name: 'server (1)' }] }),
    ),
  )
})

const directories: string[] = []
after(() => {
  for (const directory of directories) rmSync(directory, { recursive: true, force: true })
})

function runScript(runs: ReturnType<typeof shardRun>[]) {
  const directory = mkdtempSync(join(tmpdir(), 'ci-budget-'))
  directories.push(directory)
  mkdirSync(join(directory, 'jobs'))
  writeFileSync(join(directory, 'runs.json'), JSON.stringify({ workflow_runs: runs }))
  for (const run of runs) {
    writeFileSync(join(directory, 'jobs', `${run.id}.json`), JSON.stringify({ jobs: run.jobs }))
  }
  writeFileSync(join(directory, 'budgets.json'), JSON.stringify(BUDGETS))
  const output = join(directory, 'output')
  const result = spawnSync(
    process.execPath,
    [
      SCRIPT,
      '--runs',
      join(directory, 'runs.json'),
      '--jobs',
      join(directory, 'jobs'),
      '--budgets',
      join(directory, 'budgets.json'),
      '--body',
      join(directory, 'body.md'),
    ],
    {
      encoding: 'utf8',
      env: { ...process.env, GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: '' },
      timeout: 30_000,
    },
  )
  return {
    result,
    body: readFileSync(join(directory, 'body.md'), 'utf8'),
    output: readFileSync(output, 'utf8'),
  }
}

test('na linha de comando, a conta diz quantos jobs estão acima e escreve sempre a tabela de hoje', () => {
  const above = runScript([
    shardRun(3, 'success', 560),
    shardRun(2, 'success', 560),
    shardRun(1, 'success', 560),
  ])
  assert.equal(above.result.status, 0)
  assert.equal(above.output, 'over=1\n')
  assert.match(above.body, /`server`/)
  const below = runScript([
    shardRun(3, 'success', 560),
    shardRun(2, 'success', 200),
    shardRun(1, 'success', 560),
  ])
  assert.equal(below.output, 'over=0\n')
  assert.match(below.body, /\| server \| 10 min \| 93% \| 33% \| 93% \|/)
})

test('o run cancelado pela concorrência aparece na tabela e não conta', () => {
  const runs = runsOf([shardRun(3, 'success', 560), shardRun(2, 'cancelled', 90)])
  assert.match(issueBody([], runs, BUDGETS), /\| server \| 10 min \| 93% \| – \|/)
})

test('o título do issue é o que o fluxo procura', () => {
  assert.equal(ISSUE_TITLE, 'CI acima do orçamento')
})
