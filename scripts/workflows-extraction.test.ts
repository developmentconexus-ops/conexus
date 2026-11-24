import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { parse } from 'yaml'

type Step = {
  id?: string
  name?: string
  uses?: string
  run?: string
  if?: string
  with?: Record<string, unknown>
}
type Job = { if?: string; needs?: string | string[]; steps: Step[] }

const ci: { jobs: Record<string, Job> } = parse(
  readFileSync(resolve(import.meta.dirname, '../.github/workflows/ci.yml'), 'utf8'),
)

const PRESENT = "steps.project.outputs.present == 'true'"

/** Runs the extraction job's own probe step in a folder, as the runner does, and reads what it wrote. */
function probe(files: string[]): { output: string; summary: string } {
  const probeStep = ci.jobs.extraction?.steps.find((step) => step.id === 'project')
  const dir = mkdtempSync(join(tmpdir(), 'conexus-extraction-'))
  try {
    for (const file of files) {
      mkdirSync(join(dir, file, '..'), { recursive: true })
      writeFileSync(join(dir, file), '')
    }
    const output = join(dir, 'output')
    const summary = join(dir, 'summary')
    const run = spawnSync('bash', ['-e', '-c', probeStep?.run ?? 'exit 1'], {
      cwd: dir,
      env: { PATH: process.env.PATH, GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: summary },
      encoding: 'utf8',
    })
    assert.equal(run.status, 0, run.stderr)
    return {
      output: readFileSync(output, 'utf8'),
      summary: existsSync(summary) ? readFileSync(summary, 'utf8') : '',
    }
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

test('o trabalho de Python passa em silêncio sem apps/extraction e confere formatação, tipos e testes com ele', () => {
  const job = ci.jobs.extraction
  assert.equal(job?.needs, 'scope')
  assert.match(job?.if ?? '', /needs\.scope\.outputs\.code != 'false'/)
  assert.deepEqual(probe([]).output, 'present=false\n')
  assert.match(probe([]).summary, /No apps\/extraction yet/)
  assert.equal(probe(['apps/extraction/pyproject.toml']).output, 'present=true\n')
  const after = job?.steps.slice(job.steps.findIndex((step) => step.id === 'project') + 1) ?? []
  for (const step of after) assert.equal(step.if, PRESENT, step.name ?? step.uses ?? step.run)
  const commands = after.map((step) => step.run ?? '').join('\n')
  assert.match(commands, /uv sync --locked --python 3\.13/)
  assert.match(commands, /ruff format --check/)
  assert.match(commands, /uv run mypy/)
  assert.match(commands, /uv run pytest/)
  const setup = after.find((step) => step.uses?.startsWith('astral-sh/setup-uv@'))
  assert.match(setup?.uses ?? '', /^astral-sh\/setup-uv@[0-9a-f]{40}$/)
  assert.match(String(setup?.with?.version), /^\d+\.\d+\.\d+$/)
})
