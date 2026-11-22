import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { after, test } from 'node:test'

const SCRIPT = resolve(import.meta.dirname, 'release-note.ts')
const dir = mkdtempSync(join(tmpdir(), 'conexus-release-note-'))
after(() => rmSync(dir, { recursive: true, force: true }))
const env = { PATH: process.env.PATH, HOME: dir }

function git(cwd: string, ...args: string[]): string {
  const run = spawnSync(
    'git',
    ['-c', 'user.name=test', '-c', 'user.email=test@example.invalid', ...args],
    { cwd, encoding: 'utf8', env },
  )
  assert.equal(run.status, 0, run.stderr)
  return run.stdout.trim()
}

// GitHub's side: a bare origin whose main already published v0.1.0, with that version's note.
const origin = join(dir, 'origin.git')
git(dir, 'init', '--quiet', '--bare', '--initial-branch=main', origin)
const work = join(dir, 'work')
git(dir, 'clone', '--quiet', `file://${origin}`, work)
git(work, 'switch', '--quiet', '--create', 'main')
writeFileSync(join(work, 'README.md'), 'Conexus\n')
mkdirSync(join(work, 'releases'))
writeFileSync(join(work, 'releases/note.md'), '# v0.1.0\n\nA primeira.\n')
git(work, 'add', '.')
git(work, 'commit', '--quiet', '-m', 'v0.1.0')
git(work, 'tag', 'v0.1.0')
git(work, 'push', '--quiet', 'origin', 'main', 'v0.1.0')

let branches = 0
/** A pull request's head: main plus these files written, or removed when null. */
function change(files: Record<string, string | null>): void {
  git(work, 'switch', '--quiet', '--create', `change-${branches++}`, 'origin/main')
  for (const [file, text] of Object.entries(files)) {
    if (text === null) git(work, 'rm', '--quiet', file)
    else {
      mkdirSync(dirname(join(work, file)), { recursive: true })
      writeFileSync(join(work, file), text)
      git(work, 'add', file)
    }
  }
  git(work, 'commit', '--quiet', '-m', 'change')
}

function note(...args: string[]) {
  const run = spawnSync('node', [SCRIPT, ...args], { cwd: work, encoding: 'utf8', env })
  return { status: run.status, stdout: run.stdout, stderr: run.stderr }
}

function check() {
  return note('check', '--base', 'origin/main')
}

function refused(code: string) {
  const run = check()
  assert.equal(run.status, 1, run.stderr)
  assert.equal(run.stdout, '')
  assert.match(run.stderr, new RegExp(`^${code}: .+\\n$`))
}

test('uma nota nova passa e imprime a versão', () => {
  change({ 'releases/note.md': '# v0.2.0\n\nO que muda.\n' })
  assert.deepEqual(check(), { status: 0, stdout: 'v0.2.0\n', stderr: '' })
})

test('uma mudança que não toca a nota passa sem conferir nada', () => {
  change({ 'README.md': 'Conexus, o Hub\n' })
  assert.deepEqual(check(), {
    status: 0,
    stdout: 'release-note: no note in this change\n',
    stderr: '',
  })
})

test('uma primeira linha fora do formato é recusada', () => {
  change({ 'releases/note.md': 'v0.2.0\n\nO que muda.\n' })
  refused('note-version')
  change({ 'releases/note.md': '# v0.2\n\nO que muda.\n' })
  refused('note-version')
  change({ 'releases/note.md': '# v0.2.0-beta\n\nO que muda.\n' })
  refused('note-version')
})

test('uma versão que já tem tag é recusada', () => {
  change({ 'releases/note.md': '# v0.1.0\n\nDe novo.\n' })
  refused('note-published')
})

test('a nota com outro arquivo no mesmo pull request é recusada', () => {
  change({ 'releases/note.md': '# v0.2.0\n\nO que muda.\n', 'README.md': 'outro\n' })
  refused('note-not-alone')
})

test('uma nota sem texto embaixo da primeira linha é recusada', () => {
  change({ 'releases/note.md': '# v0.2.0\n\n  \n' })
  refused('note-empty')
})

test('a nota apagada é recusada', () => {
  change({ 'releases/note.md': null })
  refused('note-version')
})

test('publish grava o texto da nota e entrega a versão', () => {
  change({ 'releases/note.md': '# v0.2.0\n\nO que muda.\n\n- uma linha\n' })
  const out = join(dir, 'note.md')
  assert.deepEqual(note('publish', out), { status: 0, stdout: 'version=v0.2.0\n', stderr: '' })
  assert.equal(readFileSync(out, 'utf8'), 'O que muda.\n\n- uma linha\n')
})

test('publish recusa uma versão que já tem tag', () => {
  change({ 'README.md': 'Conexus, o Hub\n' })
  const run = note('publish', join(dir, 'again.md'))
  assert.equal(run.status, 1)
  assert.equal(run.stdout, '')
  assert.match(run.stderr, /^note-published: the tag v0\.1\.0 already exists\n$/)
})
