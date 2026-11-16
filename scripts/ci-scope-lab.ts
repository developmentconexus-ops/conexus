import { execFileSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { parse } from 'yaml'

type Step = { id?: string; run?: string }
const workflow: { jobs: { scope: { steps: Step[] } } } = parse(
  readFileSync(resolve(import.meta.dirname, '../.github/workflows/ci.yml'), 'utf8'),
)
const SCRIPT = workflow.jobs.scope.steps.find((step) => step.id === 'scope')?.run ?? ''

export function git(dir: string, ...args: string[]): string {
  return execFileSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
    encoding: 'utf8',
  }).trim()
}

export function commit(dir: string, files: Record<string, string>): string {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), content)
  }
  git(dir, 'add', '-A')
  git(dir, 'commit', '-q', '-m', 'x')
  return git(dir, 'rev-parse', 'HEAD')
}

export type Run = {
  event: string
  before: string
  sha: string
  action?: string
  headSha?: string
  fake?: string
}

export function run(dir: string, options: Run): { output: string; stdout: string } {
  const output = `${dir}.output`
  writeFileSync(output, '')
  const stdout = execFileSync(
    'bash',
    ['--noprofile', '--norc', '-e', ...(process.env.DBG ? ['-x'] : []), '-c', SCRIPT],
    {
      cwd: dir,
      encoding: 'utf8',
      stdio: process.env.DBG ? ['pipe', 'pipe', 'inherit'] : 'pipe',
      env: {
        PATH: `${options.fake ?? ''}:${process.env.PATH ?? ''}`,
        EVENT: options.event,
        ACTION: options.action ?? '',
        BASE_REF: 'main',
        BEFORE: options.before,
        SHA: options.sha,
        HEAD_SHA: options.headSha ?? '',
        REPO: 'o/r',
        GH_TOKEN: 'x',
        GITHUB_OUTPUT: output,
        GITHUB_STEP_SUMMARY: '/dev/null',
      },
    },
  )
  return { output: readFileSync(output, 'utf8').trim(), stdout }
}

export function scope(dir: string, event: string, before: string, sha: string): string {
  return run(dir, { event, before, sha }).output
}

export type Fixtures = { runs?: unknown; jobs?: unknown; annotations?: unknown }

// A `gh` that answers the three read-only endpoints from fixtures and applies the real --jq filter.
export function fakeGh(dir: string, fixtures: Fixtures): string {
  const bin = `${dir}.bin`
  mkdirSync(bin, { recursive: true })
  const data = `${dir}.fixtures`
  rmSync(data, { recursive: true, force: true })
  mkdirSync(data, { recursive: true })
  for (const [name, value] of Object.entries(fixtures))
    writeFileSync(join(data, name), JSON.stringify(value))
  writeFileSync(
    join(bin, 'gh'),
    `#!/bin/bash
endpoint="$2"; filter=
while [ $# -gt 0 ]; do [ "$1" = --jq ] && filter="$2"; shift; done
case "$endpoint" in
  */jobs) file=jobs ;;
  */annotations) file=annotations ;;
  *actions/runs\\?*) file=runs ;;
  *) exit 1 ;;
esac
[ -f "${data}/$file" ] || exit 1
jq -r "$filter" "${data}/$file"
`,
  )
  chmodSync(join(bin, 'gh'), 0o755)
  return bin
}

export type Pr = { dir: string; baseTip: string; head: string; merge: string }

// The merge GitHub tests: the base tip and the head, the head as the second parent.
export function merged(dir: string, base: string, head: string): string {
  git(dir, 'checkout', '-q', '--detach', base)
  git(dir, 'merge', '-q', '--no-ff', '-m', 'merge', head)
  return git(dir, 'rev-parse', 'HEAD')
}

function pullRequest(dir: string): Pr {
  git(dir, 'init', '-q', '-b', 'main')
  const baseTip = commit(dir, { 'scripts/s.ts': 's', 'docs/a.md': 'a' })
  git(dir, 'update-ref', 'refs/remotes/origin/main', baseTip)
  git(dir, 'checkout', '-q', '-b', 'pr')
  const head = commit(dir, { 'scripts/s.ts': 'changed' })
  return { dir, baseTip, head, merge: merged(dir, baseTip, head) }
}

export function proof(base: string, suites: string): string {
  return `base=${base} suites=${suites}`
}

export function goodFixtures(base: string, suites: string): Fixtures {
  return {
    runs: { workflow_runs: [{ id: 1, name: 'CI', conclusion: 'success' }] },
    jobs: {
      jobs: [
        { id: 7, name: 'scope' },
        { id: 8, name: 'check' },
      ],
    },
    annotations: [{ title: 'scope-proof', message: proof(base, suites) }],
  }
}

let counter = 0

export function docsPush(
  pr: Pr,
  fixtures: Fixtures,
  change: Partial<{
    base: string
    files: Record<string, string>
    prepare: (dir: string) => void
    empty: boolean
  }> = {},
): Run {
  git(pr.dir, 'checkout', '-q', 'pr')
  counter += 1
  change.prepare?.(pr.dir)
  const head = change.empty
    ? git(pr.dir, 'commit-tree', '-m', 'empty', '-p', pr.head, `${pr.head}^{tree}`)
    : commit(pr.dir, {
        ...(change.files ?? { 'docs/a.md': 'edited' }),
        [`docs/n${counter}.md`]: 'n',
      })
  const merge = merged(pr.dir, change.base ?? pr.baseTip, head)
  return {
    event: 'pull_request',
    action: 'synchronize',
    before: pr.head,
    sha: merge,
    headSha: head,
    fake: fakeGh(pr.dir, fixtures),
  }
}

export function inPullRequest(body: (pr: Pr) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-scope-pr-'))
  try {
    body(pullRequest(dir))
  } finally {
    for (const path of [dir, `${dir}.output`, `${dir}.bin`, `${dir}.fixtures`])
      rmSync(path, { recursive: true, force: true })
  }
}
