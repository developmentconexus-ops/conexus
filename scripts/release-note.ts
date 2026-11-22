// Defect: a release note whose first line is not a version name, names a version already tagged,
// travels with other files or carries no text would merge and publish nothing, or the wrong thing
// (delivery L17). No configuration GitHub has says "the name is a version and its tag does not
// exist", so the pull request's check and Publish's `version` job both run this file, the one owner
// of the note's format (decision 0081); rollback.yml and infra/releases.sh keep their own check of
// the name they are given. Refusals, and a failed question to origin, are proved in
// release-note.test.ts.
// It reads only Node's own modules: the `version` job runs it without `npm ci`.
import { execFileSync, spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const NOTE = 'releases/note.md'
const VERSION = /^# (v[0-9]+\.[0-9]+\.[0-9]+)$/

function git(...args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
}

function refuse(code: string, detail: string): never {
  console.error(`${code}: ${detail}`)
  process.exit(1)
}

function tagExists(version: string): boolean {
  const found = spawnSync(
    'git',
    ['ls-remote', '--exit-code', '--tags', 'origin', `refs/tags/${version}`],
    { encoding: 'utf8', stdio: ['ignore', 'ignore', 'inherit'], timeout: 60_000 },
  )
  if (found.status === 0) return true
  if (found.status === 2) return false
  console.error(`release-note: could not ask origin for the tag ${version}`)
  process.exit(1)
}

/** The note at HEAD, read and checked: its version and the text under its first line. */
function readNote(): { version: string; text: string } {
  const listed = git('ls-tree', '--name-only', 'HEAD', '--', NOTE).trim()
  if (listed !== NOTE) refuse('note-version', `${NOTE} is not in this commit`)
  const [first = '', ...rest] = git('show', `HEAD:${NOTE}`).split('\n')
  const version = VERSION.exec(first)?.[1]
  if (version === undefined)
    refuse('note-version', `the first line '${first}' is not '# v<n>.<n>.<n>'`)
  const text = rest.join('\n').trim()
  if (text === '') refuse('note-empty', `${NOTE} has no text under its first line`)
  if (tagExists(version)) refuse('note-published', `the tag ${version} already exists`)
  return { version, text }
}

const [command, argument, value] = process.argv.slice(2)
if (command === 'check' && argument === '--base' && value !== undefined) {
  const changed = git('diff', '--name-only', '--no-renames', `${value}...HEAD`)
    .split('\n')
    .filter((file) => file !== '')
  if (!changed.includes(NOTE)) {
    console.log('release-note: no note in this change')
    process.exit(0)
  }
  const others = changed.filter((file) => file !== NOTE)
  if (others.length > 0) refuse('note-not-alone', `the note comes with ${others.join(', ')}`)
  console.log(readNote().version)
} else if (command === 'publish' && argument !== undefined) {
  const { version, text } = readNote()
  writeFileSync(argument, `${text}\n`)
  console.log(`version=${version}`)
} else {
  console.error('release-note: check --base <ref> | publish <file>')
  process.exit(2)
}
