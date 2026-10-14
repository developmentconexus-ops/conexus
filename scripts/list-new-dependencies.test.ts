import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, test } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, 'list-new-dependencies.ts')
const dirs: string[] = []
after(() => {
  for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
})

function git(dir: string, ...args: string[]) {
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', ...args], {
    cwd: dir,
  })
}

function write(dir: string, path: string, content: unknown) {
  mkdirSync(dirname(join(dir, path)), { recursive: true })
  writeFileSync(join(dir, path), JSON.stringify(content))
}

function commit(dir: string, message: string) {
  git(dir, 'add', '.')
  git(dir, 'commit', '-q', '-m', message)
}

function summary(change: (dir: string) => void): string {
  const dir = mkdtempSync(join(tmpdir(), 'conexus-deps-'))
  dirs.push(dir)
  git(dir, 'init', '-q', '-b', 'main')
  write(dir, 'package.json', { devDependencies: { yaml: '2.9.1' } })
  commit(dir, 'base')
  git(dir, 'checkout', '-q', '-b', 'topic')
  change(dir)
  commit(dir, 'change')
  const file = join(dir, 'summary.md')
  const run = spawnSync('node', [SCRIPT, '--base', 'main', '--root', dir], {
    encoding: 'utf8',
    env: { ...process.env, GITHUB_STEP_SUMMARY: file },
  })
  assert.equal(run.status, 0, run.stderr)
  return readFileSync(file, 'utf8')
}

test('lista a nova', () => {
  const text = summary((dir) => {
    write(dir, 'package.json', { devDependencies: { yaml: '2.9.1', zod: '4.6.5' } })
    write(dir, 'apps/server/package.json', { dependencies: { fastify: '5.12.5' } })
  })
  assert.match(text, /\| `zod` \| `4\.6\.5` \| devDependencies \| `package\.json` \|/)
  assert.match(
    text,
    /\| `fastify` \| `5\.12\.5` \| dependencies \| `apps\/server\/package\.json` \|/,
  )
  assert.doesNotMatch(text, /`yaml`/)
})

test('diz quando não há dependência nova', () => {
  const text = summary((dir) => write(dir, 'docs.json', {}))
  assert.match(text, /No new dependency/)
})
