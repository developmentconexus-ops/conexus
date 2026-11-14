import { appendFileSync } from 'node:fs'
import { z } from 'zod'
import { spawnCommand } from './command.ts'

type Flaky = { file: string; name: string }

const Issues = z.array(z.object({ number: z.number(), title: z.string(), state: z.string() }))
const LABEL = 'flaky'

function gh(args: string[]): string | undefined {
  const { status, output } = spawnCommand('gh', args, { cwd: process.cwd(), deadline: 30_000 })
  if (status === 0) return output
  console.log(`::warning title=Teste instável::o registro não chegou ao GitHub: ${output}`)
  return undefined
}

function titleOf(test: Flaky): string {
  return `Teste instável: ${test.file} › ${test.name}`
}

function occurrence(test: Flaky): string {
  const {
    GITHUB_SERVER_URL: server,
    GITHUB_REPOSITORY: repository,
    GITHUB_RUN_ID: run,
  } = process.env
  const where = `${server}/${repository}/actions/runs/${run}`
  return `Passou só na segunda rodada, depois de falhar na primeira.\n\n- Teste: \`${test.file}\` › ${test.name}\n- Execução: ${where} (commit \`${process.env.GITHUB_SHA}\`, job \`${process.env.GITHUB_JOB}\`)\n\nÉ uma falha de teste ou de código que aparece de vez em quando. Investigue a causa (T4); a segunda rodada só a esconde da cor do CI.`
}

/** One issue per flaky test, found by its title: a new one, or a new comment (and a reopening) on the old. */
function record(tests: Flaky[], repository: string): void {
  gh([
    'label',
    'create',
    LABEL,
    '--force',
    '--color',
    'fbca04',
    '--description',
    'Passou só na segunda rodada do CI',
    '-R',
    repository,
  ])
  const listed = gh([
    'issue',
    'list',
    '-R',
    repository,
    '--label',
    LABEL,
    '--state',
    'all',
    '--limit',
    '1000',
    '--json',
    'number,title,state',
  ])
  if (listed === undefined) return
  const known = Issues.parse(JSON.parse(listed))
  for (const test of tests) {
    const found = known.find((issue) => issue.title === titleOf(test))
    if (found === undefined) {
      gh([
        'issue',
        'create',
        '-R',
        repository,
        '--label',
        LABEL,
        '--title',
        titleOf(test),
        '--body',
        occurrence(test),
      ])
      continue
    }
    if (found.state.toUpperCase() === 'CLOSED')
      gh(['issue', 'reopen', String(found.number), '-R', repository])
    gh(['issue', 'comment', String(found.number), '-R', repository, '--body', occurrence(test)])
  }
}

/**
 * A test that failed and then passed on the second run is flaky (testing T4): it shows in the job
 * summary and as a warning, and opens or updates its issue. Without GH_TOKEN the issue is skipped.
 */
export function reportFlaky(tests: Flaky[]): void {
  for (const test of tests) {
    console.log(
      `::warning title=Teste instável::${test.file} › ${test.name} passou só na segunda rodada`,
    )
  }
  const summary = process.env.GITHUB_STEP_SUMMARY
  if (summary !== undefined) {
    const rows = tests.map((test) => `| \`${test.file}\` | ${test.name.replaceAll('|', '\\|')} |`)
    appendFileSync(
      summary,
      [
        '### Testes instáveis: passaram só na segunda rodada',
        '',
        '| Arquivo | Teste |',
        '| --- | --- |',
        ...rows,
        '',
        '',
      ].join('\n'),
    )
  }
  const repository = process.env.GITHUB_REPOSITORY
  if (process.env.GH_TOKEN !== undefined && repository !== undefined) record(tests, repository)
}
