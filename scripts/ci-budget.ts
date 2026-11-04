// The daily CI budget check: a job that used 85% or more of its `timeout-minutes` in each of the
// last three runs of `main` is told in one open issue before the timeout cuts it
// (docs/steps/saude-do-ci.md, U2). The 70% warning of every run is U1's, in ci.yml.
// It never fails a build: .github/workflows/ci-budget.yml runs it on a schedule.
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { option } from './cli.ts'

const ISSUE_TITLE = 'CI acima do orçamento'
const OVER_PERCENT = 85
const STREAK = 3
const IGNORED_JOB = 'ci'

type JobRun = {
  job: string
  minutes: number
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'timed_out'
}
type CiRun = {
  id: number
  sha: string
  conclusion: 'success' | 'failure' | 'cancelled'
  jobs: JobRun[]
}
/** The `(.name // key)` of each job in ci.yml → its `timeout-minutes`, as U1 reads them. */
type Budgets = Record<string, number>
type OverBudget = {
  job: string
  percents: readonly [number, number, number]
  runs: readonly [number, number, number]
}

const RunsResponse = z.object({
  workflow_runs: z.array(
    z.object({ id: z.number(), head_sha: z.string(), conclusion: z.string().nullable() }),
  ),
})
const JobsResponse = z.object({
  jobs: z.array(
    z.object({
      name: z.string(),
      conclusion: z.enum(['success', 'failure', 'cancelled', 'skipped', 'timed_out']).nullable(),
      started_at: z.string().nullable(),
      completed_at: z.string().nullable(),
    }),
  ),
})
const BudgetsFile = z.record(z.string(), z.number().positive())

/** A matrix job is named `server (2)` by the API and `server` in ci.yml. */
function budgetOf(job: string, budgets: Budgets): { key: string; minutes: number } | undefined {
  const key = job in budgets ? job : job.replace(/ \(.*\)$/, '')
  const minutes = budgets[key]
  return minutes === undefined ? undefined : { key, minutes }
}

/**
 * The share of its budget a job used; a job the timeout cut counts as the whole of it. The API
 * reports that cut as `cancelled` with a duration at or over the limit, not as `timed_out`, so the
 * comparison of minutes is what catches it.
 */
function percentOf(job: JobRun, budget: number): number {
  if (job.conclusion === 'timed_out' || job.minutes >= budget) return 100
  return (job.minutes / budget) * 100
}

/** The largest share among the jobs of one key (the biggest shard), per budgeted key. */
function peaks(run: CiRun, budgets: Budgets): Map<string, number> {
  const peak = new Map<string, number>()
  for (const job of run.jobs) {
    if (job.job === IGNORED_JOB) continue
    const budget = budgetOf(job.job, budgets)
    if (budget === undefined) continue
    peak.set(budget.key, Math.max(peak.get(budget.key) ?? 0, percentOf(job, budget.minutes)))
  }
  return peak
}

/** A cancelled run in which no job reached its budget was cancelled by the concurrency group. */
function cancelledByConcurrency(run: CiRun, budgets: Budgets): boolean {
  return run.conclusion === 'cancelled' && ![...peaks(run, budgets).values()].some((p) => p >= 100)
}

/** `runs` newest first. A job is over when its peak is 85% or more in each of the last three runs. */
export function overBudget(runs: CiRun[], budgets: Budgets): OverBudget[] {
  const last = runs.filter((run) => !cancelledByConcurrency(run, budgets)).slice(0, STREAK)
  const [first, second, third] = last
  if (first === undefined || second === undefined || third === undefined) return []
  const peaksOf = last.map((run) => peaks(run, budgets))
  const found: OverBudget[] = []
  for (const job of Object.keys(budgets)) {
    const percents = peaksOf.map((peak) => peak.get(job) ?? 0)
    const [a = 0, b = 0, c = 0] = percents
    if (percents.every((percent) => percent >= OVER_PERCENT)) {
      found.push({ job, percents: [a, b, c], runs: [first.id, second.id, third.id] })
    }
  }
  return found
}

/** The issue's body: the jobs over budget and the table of the runs read, jobs by runs. */
export function issueBody(over: OverBudget[], runs: CiRun[], budgets: Budgets): string {
  const jobs = Object.keys(budgets).filter((job) => job !== IGNORED_JOB)
  const columns = runs.map((run) => ({
    title: `${run.id} (${run.sha.slice(0, 8)})`,
    peak: cancelledByConcurrency(run, budgets) ? undefined : peaks(run, budgets),
  }))
  const lines = [
    over.length === 0
      ? `Nenhum job está em ${OVER_PERCENT}% ou mais nos últimos ${STREAK} runs de \`main\`.`
      : `Em ${OVER_PERCENT}% ou mais do \`timeout-minutes\` nos últimos ${STREAK} runs de \`main\`: ${over.map((o) => `\`${o.job}\``).join(', ')}.`,
    '',
    `O maior job de cada nome, em % do seu \`timeout-minutes\`, nos ${runs.length} últimos runs completos de \`main\`, do mais novo ao mais antigo. Um run cancelado pela concorrência não conta e aparece com "–".`,
    '',
    `| Job | Limite | ${columns.map((column) => column.title).join(' | ')} |`,
    `| --- | ---: | ${columns.map(() => '---:').join(' | ')} |`,
    ...jobs.map((job) => {
      const cells = columns.map(({ peak }) => {
        if (peak === undefined) return '–'
        const percent = peak.get(job)
        return percent === undefined ? '' : `${Math.round(percent)}%`
      })
      return `| ${job} | ${budgets[job]} min | ${cells.join(' | ')} |`
    }),
  ]
  return `${lines.join('\n')}\n`
}

function minutesOf(start: string | null, end: string | null): number {
  if (start === null || end === null) return 0
  return Math.max(0, (Date.parse(end) - Date.parse(start)) / 60_000)
}

/** The API's two answers as JSON text, one jobs answer per run, as the runs the rule reads. */
export function ciRuns(runsResponse: string, jobsOf: (id: number) => string): CiRun[] {
  const runs: CiRun[] = []
  for (const run of RunsResponse.parse(JSON.parse(runsResponse)).workflow_runs) {
    const conclusion = run.conclusion
    if (conclusion !== 'success' && conclusion !== 'failure' && conclusion !== 'cancelled') continue
    const jobs = JobsResponse.parse(JSON.parse(jobsOf(run.id))).jobs.map((job) => ({
      job: job.name,
      minutes: minutesOf(job.started_at, job.completed_at),
      conclusion: job.conclusion ?? 'skipped',
    }))
    runs.push({ id: run.id, sha: run.head_sha, conclusion, jobs })
  }
  return runs
}

function main() {
  const runsFile = option('--runs')
  const jobsDirectory = option('--jobs')
  const budgetsFile = option('--budgets')
  const bodyFile = option('--body')
  if (!runsFile || !jobsDirectory || !budgetsFile || !bodyFile) {
    console.error(
      'ci-budget: --runs <file> --jobs <folder> --budgets <file> --body <file> required',
    )
    process.exit(2)
  }
  const budgets = BudgetsFile.parse(JSON.parse(readFileSync(budgetsFile, 'utf8')))
  const runs = ciRuns(readFileSync(runsFile, 'utf8'), (id) =>
    readFileSync(join(jobsDirectory, `${id}.json`), 'utf8'),
  )
  const over = overBudget(runs, budgets)
  const body = issueBody(over, runs, budgets)
  writeFileSync(bodyFile, body)
  if (process.env.GITHUB_OUTPUT)
    appendFileSync(process.env.GITHUB_OUTPUT, `over=${over.length}\ntitle=${ISSUE_TITLE}\n`)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, body)
  console.log(body)
}

if (import.meta.main) main()
