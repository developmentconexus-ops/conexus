import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Fixtures, Run } from './ci-scope-lab.ts'
import {
  commit,
  docsPush,
  fakeGh,
  git,
  goodFixtures,
  inPullRequest,
  merged,
  proof,
  run,
} from './ci-scope-lab.ts'

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

test('um merge -s ours do main seguido de documento muda a árvore testada: as suítes rodam', () => {
  inPullRequest((pr) => {
    git(pr.dir, 'checkout', '-q', '--detach', pr.baseTip)
    const moved = commit(pr.dir, { 'apps/server/x.ts': 'main code' })
    git(pr.dir, 'update-ref', 'refs/remotes/origin/main', moved)
    const next = docsPush(pr, goodFixtures(moved, pr.head), {
      base: moved,
      prepare: (dir) => git(dir, 'merge', '-q', '-s', 'ours', '-m', 'ours', moved),
    })
    assert.equal(run(pr.dir, next).output, 'code=true')
  })
})

test('um rename de código para docs/ conta o caminho velho', () => {
  inPullRequest((pr) => {
    const next = docsPush(pr, goodFixtures(pr.baseTip, pr.head), {
      prepare: (dir) => git(dir, 'mv', 'scripts/s.ts', 'docs/s.md'),
    })
    assert.equal(run(pr.dir, next).output, 'code=true')
  })
})

test('um commit vazio, que só reexecuta o CI, roda as suítes; um head do evento que não é o segundo pai também', () => {
  inPullRequest((pr) => {
    const empty = docsPush(pr, goodFixtures(pr.baseTip, pr.head), { empty: true })
    assert.equal(run(pr.dir, empty).output, 'code=true')
    const next = docsPush(pr, goodFixtures(pr.baseTip, pr.head))
    git(pr.dir, 'checkout', '-q', '--detach', next.headSha ?? '')
    const sibling = commit(pr.dir, { 'docs/sibling.md': 's' })
    assert.equal(run(pr.dir, { ...next, headSha: sibling }).output, 'code=true')
  })
})

test('só a anotação scope-proof, inteira, conta como prova', () => {
  inPullRequest((pr) => {
    const good = goodFixtures(pr.baseTip, pr.head)
    const next = docsPush(pr, good)
    const message = proof(pr.baseTip, pr.head)
    function code(annotations: unknown): string {
      return run(pr.dir, { ...next, fake: fakeGh(pr.dir, { ...good, annotations }) }).output
    }
    assert.equal(
      code([
        { title: 'other', message: 'garbage' },
        { title: 'scope-proof', message },
      ]),
      'code=false',
    )
    assert.equal(code([{ title: 'other', message }]), 'code=true')
    assert.equal(code([{ title: 'scope-proof', message: `x${message}` }]), 'code=true')
    assert.equal(code([{ title: 'scope-proof', message: `${message}x` }]), 'code=true')
  })
})

test('um pull request só de documento anota que nenhuma suíte rodou', () => {
  inPullRequest((pr) => {
    git(pr.dir, 'checkout', '-q', '--detach', pr.baseTip)
    git(pr.dir, 'checkout', '-q', '-b', 'docs-only')
    const docsHead = commit(pr.dir, { 'docs/only2.md': 'o' })
    const merge = merged(pr.dir, pr.baseTip, docsHead)
    const result = run(pr.dir, {
      event: 'pull_request',
      action: 'opened',
      before: '',
      sha: merge,
      headSha: docsHead,
    })
    assert.equal(result.output, 'code=false')
    assert.match(
      result.stdout,
      new RegExp(`::notice title=scope-proof::base=${pr.baseTip} suites=none`),
    )
  })
})
