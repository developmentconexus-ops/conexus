import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { parse } from 'yaml'

type Step = { id?: string; run?: string }
const workflow: { jobs: { scope: { steps: Step[] } } } = parse(
  readFileSync(resolve(import.meta.dirname, '../.github/workflows/ci.yml'), 'utf8'),
)
const SCRIPT = workflow.jobs.scope.steps.find((step) => step.id === 'scope')?.run ?? ''

function git(dir: string, ...args: string[]): string {
  return execFileSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@t', ...args], {
    encoding: 'utf8',
  }).trim()
}

function commit(dir: string, files: Record<string, string>): string {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), content)
  }
  git(dir, 'add', '-A')
  git(dir, 'commit', '-q', '-m', 'x')
  return git(dir, 'rev-parse', 'HEAD')
}

type Run = {
  event: string
  before: string
  sha: string
  action?: string
  headSha?: string
  fake?: string
}

function run(dir: string, options: Run): { output: string; stdout: string } {
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

function scope(dir: string, event: string, before: string, sha: string): string {
  return run(dir, { event, before, sha }).output
}

type Fixtures = { runs?: unknown; jobs?: unknown; annotations?: unknown }

// A `gh` that answers the three read-only endpoints from fixtures and applies the real --jq filter.
function fakeGh(dir: string, fixtures: Fixtures): string {
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

type Pr = { dir: string; baseTip: string; head: string; merge: string }

// The merge GitHub tests: the base tip and the head, the head as the second parent.
function merged(dir: string, base: string, head: string): string {
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

function proof(base: string, suites: string): string {
  return `base=${base} suites=${suites}`
}

function goodFixtures(base: string, suites: string): Fixtures {
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

function docsPush(
  pr: Pr,
  fixtures: Fixtures,
  change: Partial<{ base: string; files: Record<string, string> }> = {},
): Run {
  git(pr.dir, 'checkout', '-q', 'pr')
  counter += 1
  const head = commit(pr.dir, {
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

test('o scope lê o intervalo do push e só chama de documento o que a lista nomeia', () => {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-scope-'))
  try {
    git(dir, 'init', '-q')
    const base = commit(dir, { 'docs/a.md': 'a', 'scripts/s.ts': 's' })
    const documents = commit(dir, { 'docs/b.md': 'b', 'AGENTS.md': 'x' })
    assert.equal(scope(dir, 'push', base, documents), 'code=false')
    const mixed = commit(dir, { 'docs/c.md': 'c', 'scripts/s.ts': 'changed' })
    assert.equal(scope(dir, 'push', documents, mixed), 'code=true')
    assert.equal(scope(dir, 'push', '0'.repeat(40), mixed), 'code=true')
    git(dir, 'mv', 'scripts/s.ts', 'docs/s.md')
    const renamed = commit(dir, {})
    assert.equal(scope(dir, 'push', mixed, renamed), 'code=true')
    assert.equal(scope(dir, 'schedule', base, documents), 'code=true')
  } finally {
    rmSync(dir, { recursive: true, force: true })
    rmSync(`${dir}.output`, { force: true })
  }
})

function inPullRequest(body: (pr: Pr) => void): void {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-scope-pr-'))
  try {
    body(pullRequest(dir))
  } finally {
    for (const path of [dir, `${dir}.output`, `${dir}.bin`, `${dir}.fixtures`])
      rmSync(path, { recursive: true, force: true })
  }
}

test('um synchronize só de documento sobre um head que passou as suítes não as roda de novo', () => {
  inPullRequest((pr) => {
    const first = run(pr.dir, {
      event: 'pull_request',
      action: 'opened',
      before: '',
      sha: pr.merge,
      headSha: pr.head,
    })
    assert.equal(first.output, 'code=true')
    assert.match(
      first.stdout,
      new RegExp(`::notice title=scope-proof::${proof(pr.baseTip, pr.head)}`),
    )
    const next = docsPush(pr, goodFixtures(pr.baseTip, pr.head))
    const result = run(pr.dir, next)
    assert.equal(result.output, 'code=false')
    assert.match(result.stdout, new RegExp(`base=${pr.baseTip} suites=${pr.head}`))
  })
})

test('a prova atravessa uma cadeia de commits só de documento até o head que rodou as suítes', () => {
  inPullRequest((pr) => {
    const second = docsPush(pr, goodFixtures(pr.baseTip, pr.head))
    const third = docsPush(
      { ...pr, head: second.headSha ?? '' },
      goodFixtures(pr.baseTip, pr.head),
      { files: { 'docs/b.md': 'b' } },
    )
    assert.equal(run(pr.dir, third).output, 'code=false')
  })
})

test('um commit de código desde o head provado roda as suítes e o novo head vira a prova', () => {
  inPullRequest((pr) => {
    const result = run(
      pr.dir,
      docsPush(pr, goodFixtures(pr.baseTip, pr.head), { files: { 'scripts/s.ts': 'again' } }),
    )
    assert.equal(result.output, 'code=true')
    assert.match(result.stdout, /suites=[0-9a-f]{40}/)
    assert.doesNotMatch(result.stdout, new RegExp(`suites=${pr.head}`))
  })
})

test('na dúvida as suítes rodam: cada condição da prova, quebrada sozinha', () => {
  inPullRequest((pr) => {
    const good = goodFixtures(pr.baseTip, pr.head)
    function code(fixtures: Fixtures, change?: Parameters<typeof docsPush>[2]): string {
      return run(pr.dir, docsPush(pr, fixtures, change)).output
    }
    assert.equal(code(good), 'code=false')
    assert.equal(
      code({ ...good, runs: { workflow_runs: [{ id: 1, name: 'CI', conclusion: 'failure' }] } }),
      'code=true',
    )
    assert.equal(
      code({ ...good, runs: { workflow_runs: [{ id: 1, name: 'CI', conclusion: 'cancelled' }] } }),
      'code=true',
    )
    assert.equal(code({ ...good, runs: { workflow_runs: [] } }), 'code=true')
    assert.equal(
      code({
        ...good,
        runs: {
          workflow_runs: [
            { id: 1, name: 'CI', conclusion: 'success' },
            { id: 2, name: 'CI', conclusion: 'failure' },
          ],
        },
      }),
      'code=true',
    )
    assert.equal(code({ ...good, jobs: { jobs: [{ id: 8, name: 'check' }] } }), 'code=true')
    assert.equal(code({ ...good, annotations: [] }), 'code=true')
    assert.equal(
      code({
        ...good,
        annotations: [{ title: 'scope-proof', message: proof(pr.baseTip, 'none') }],
      }),
      'code=true',
    )
    assert.equal(code({ jobs: good.jobs, annotations: good.annotations }), 'code=true')
    assert.equal(
      code(good, { files: { 'docs/a.md': 'edited', 'apps/web/x.ts': 'x' } }),
      'code=true',
    )
    assert.equal(code(good, { files: { 'DESIGN.md': 'design' } }), 'code=true')
  })
})

test('se o main andou desde o head anterior, a árvore testada mudou e as suítes rodam', () => {
  inPullRequest((pr) => {
    git(pr.dir, 'checkout', '-q', '--detach', pr.baseTip)
    const moved = commit(pr.dir, { 'docs/main.md': 'main moved' })
    git(pr.dir, 'update-ref', 'refs/remotes/origin/main', moved)
    const result = run(pr.dir, docsPush(pr, goodFixtures(pr.baseTip, pr.head), { base: moved }))
    assert.equal(result.output, 'code=true')
    assert.match(result.stdout, new RegExp(`base=${moved} `))
  })
})

test('sem synchronize, sem head anterior no clone ou com o head fora da ascendência, as suítes rodam', () => {
  inPullRequest((pr) => {
    const next = docsPush(pr, goodFixtures(pr.baseTip, pr.head))
    function code(change: Partial<Run>): string {
      return run(pr.dir, { ...next, ...change }).output
    }
    assert.equal(code({}), 'code=false')
    assert.equal(code({ action: 'labeled' }), 'code=true')
    assert.equal(code({ action: 'opened', before: '' }), 'code=true')
    assert.equal(code({ before: '' }), 'code=true')
    assert.equal(code({ headSha: pr.baseTip }), 'code=true')
    const unrelated = fakeGh(pr.dir, goodFixtures(pr.baseTip, '1'.repeat(40)))
    assert.equal(code({ fake: unrelated }), 'code=true')
    const parentless = git(pr.dir, 'commit-tree', '-m', 'y', '-p', pr.baseTip, `${pr.head}^{tree}`)
    const unrelatedFake = fakeGh(pr.dir, goodFixtures(pr.baseTip, parentless))
    assert.equal(code({ fake: unrelatedFake }), 'code=true')
    const absent = fakeGh(pr.dir, goodFixtures(pr.baseTip, '2'.repeat(40)))
    assert.equal(code({ fake: absent }), 'code=true')
  })
})

test('o gh que falha conta como dúvida', () => {
  inPullRequest((pr) => {
    const next = docsPush(pr, {})
    assert.equal(run(pr.dir, next).output, 'code=true')
  })
})
