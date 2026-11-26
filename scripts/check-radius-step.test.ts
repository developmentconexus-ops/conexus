import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { test } from 'node:test'
import { parse } from 'yaml'
import { z } from 'zod'

const Workflow = z.object({
  jobs: z.object({
    check: z.object({ steps: z.array(z.object({ run: z.string().optional() })) }),
  }),
})

function ciRadiusStep(): string {
  const workflow = readFileSync(resolve(import.meta.dirname, '../.github/workflows/ci.yml'), 'utf8')
  const step = Workflow.parse(parse(workflow)).jobs.check.steps.find((candidate) =>
    candidate.run?.includes('npm run radius'),
  )
  assert.ok(step?.run, 'the check job of ci.yml has no radius step')
  return step.run
}

test('raio: o passo do CI chama o raio uma vez por unidade do cartão, com a letra do nome', () => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-radius-step-'))
  try {
    mkdirSync(join(dir, 'docs/steps'), { recursive: true })
    writeFileSync(
      join(dir, 'docs/steps/a-etapa.md'),
      '## As unidades\n\n## U1 Uma\n\n## U5a Duas\n\n## U5b Três\n',
    )
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ scripts: { radius: 'echo called' } }))
    const result = spawnSync('bash', ['-e', '-c', ciRadiusStep()], {
      cwd: dir,
      encoding: 'utf8',
      env: { ...process.env, SHA: 'abc123' },
      timeout: 120_000,
    })
    assert.equal(result.status, 0, result.stdout + result.stderr)
    assert.deepEqual(result.stdout.match(/^called .*$/gm), [
      'called U1 abc123 a-etapa.md',
      'called U5a abc123 a-etapa.md',
      'called U5b abc123 a-etapa.md',
    ])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
