// Defect: a test that passes only on the second run hides behind a green run, and nobody learns
// it is flaky (testing T4). `node scripts/flaky-issues.ts <folder>` reads the records the test jobs
// uploaded (scripts/flaky-report.ts), one JSON line each, and opens or updates one issue per test:
// found by its title, a new comment for each occurrence and a reopening when it was closed. It runs
// in the `flaky` job of ci.yml, which holds `issues: write` and runs no test code. A record that
// cannot reach GitHub is a warning, never a red run. It needs GH_TOKEN and the GITHUB_* variables.
// The record, the dedupe and the issue calls are proved in flaky-issues.test.ts.
// Revalidate by 2027-05-14, or when the `gh` issue commands change.
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { z } from 'zod'
import { spawnCommand } from './command.ts'

const Record = z.object({ file: z.string(), name: z.string(), job: z.string() })
type Record = z.infer<typeof Record>

const LABEL = 'flaky'
const folder = resolve(process.argv[2] ?? '.')
const repository = process.env.GITHUB_REPOSITORY ?? ''

function recordsIn(path: string): Record[] {
  const records = readdirSync(path, { recursive: true, encoding: 'utf8' })
    .filter((name) => name.endsWith('.jsonl'))
    .flatMap((name) => readFileSync(join(path, name), 'utf8').split('\n').filter(Boolean))
    .map((line) => Record.parse(JSON.parse(line)))
  return [...new Map(records.map((record) => [titleOf(record), record])).values()]
}

function titleOf(record: Record): string {
  return `Teste instável: ${record.file} › ${record.name}`
}

function occurrence(record: Record): string {
  const where = `${process.env.GITHUB_SERVER_URL}/${repository}/actions/runs/${process.env.GITHUB_RUN_ID}`
  return `Passou só na segunda rodada, depois de falhar na primeira.\n\n- Teste: \`${record.file}\` › ${record.name}\n- Execução: ${where} (commit \`${process.env.GITHUB_SHA}\`, job \`${record.job}\`)\n\nÉ uma falha de teste ou de código que aparece de vez em quando. Investigue a causa (T4); a segunda rodada só a esconde da cor do CI.`
}

function gh(args: string[]): string | undefined {
  const { status, output } = spawnCommand('gh', [...args, '-R', repository], {
    cwd: process.cwd(),
    deadline: 30_000,
  })
  if (status === 0) return output
  console.log(`::warning title=Teste instável::o registro não chegou ao GitHub: ${output}`)
  return undefined
}

const records = recordsIn(folder)
if (records.length === 0) process.exit(0)

gh([
  'label',
  'create',
  LABEL,
  '--force',
  '--color',
  'fbca04',
  '--description',
  'Passou só na segunda rodada do CI',
])
const listed = gh([
  'issue',
  'list',
  '--label',
  LABEL,
  '--state',
  'all',
  '--limit',
  '1000',
  '--json',
  'number,title,state',
  '--jq',
  '.[] | [.number, .state, .title] | @tsv',
])
if (listed === undefined) process.exit(0)
const known = new Map(
  listed
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [number = '', state = '', ...title] = line.split('\t')
      return [title.join('\t'), { number, state }] as const
    }),
)
for (const record of records) {
  const found = known.get(titleOf(record))
  if (found === undefined) {
    gh([
      'issue',
      'create',
      '--label',
      LABEL,
      '--title',
      titleOf(record),
      '--body',
      occurrence(record),
    ])
    continue
  }
  if (found.state.toUpperCase() === 'CLOSED') gh(['issue', 'reopen', found.number])
  gh(['issue', 'comment', found.number, '--body', occurrence(record)])
}
