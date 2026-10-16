// Defect: a migration the previous image cannot run on, an applied migration that changed, two
// migrations whose branches conflict (drizzle-kit lets a fork whose changes commute stand), or a
// session lock that fails behind a pooler (data D6, D7, D25).
// Each refusal is proved by planting it in check-migrations.test.ts.
// Revalidate by 2027-04-13, or when drizzle-kit changes its snapshot format.
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { option } from './cli.ts'
import { runCommand, spawnCommand } from './command.ts'

const DRIZZLE_KIT_DEADLINE_MS = 120_000
const MIGRATIONS = 'apps/server/migrations'
const SERVER_SOURCE = 'apps/server/src'
const DRIZZLE_KIT = resolve(import.meta.dirname, '..', 'node_modules', '.bin', 'drizzle-kit')
const CONTRACT = /^[ \t]*--[ \t]*contract:[ \t]*\S/m
const BREAKS_THE_PREVIOUS_IMAGE = /\b(drop|rename)\b/i
const SESSION_STATE: [RegExp, string][] = [
  [/pg_(try_)?advisory_lock/i, 'a session-level advisory lock'],
  [/\bset\s+session\b/i, 'SET SESSION'],
  [/[`'";]\s*set\s+(?!local\b)(?!session\b)[a-z_][\w.]*\s*(=|to\b)/i, 'SET outside a transaction'],
  [/set_config\([^)]*,\s*false\s*\)/i, 'set_config with is_local false'],
]

const base = option('--base')
if (base === undefined) {
  console.error('check-migrations: --base <ref> is required')
  process.exit(2)
}
const root = resolve(option('--root') ?? '.')
const refusals: string[] = []

function git(...args: string[]): string {
  return runCommand('git', args, { cwd: root })
}

function withoutComments(sql: string): string {
  return sql
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('--'))
    .join('\n')
}

function checkAgainstBase(): void {
  const changes = git('diff', '--name-status', '--no-renames', `${base}...HEAD`, '--', MIGRATIONS)
  for (const change of changes.split('\n').filter(Boolean)) {
    const [status = '', file = ''] = change.split('\t')
    if (status === 'A') {
      if (!file.endsWith('/migration.sql')) continue
      const sql = git('show', `HEAD:${file}`)
      if (BREAKS_THE_PREVIOUS_IMAGE.test(withoutComments(sql)) && !CONTRACT.test(sql)) {
        refusals.push(`${file}: DROP or RENAME needs a line "-- contract: <reason>" (data D6)`)
      }
    } else {
      refusals.push(
        `${file}: an applied migration was ${status === 'D' ? 'deleted' : 'changed'} (data D7)`,
      )
    }
  }
}

function checkHistory(): void {
  const run = spawnCommand(
    DRIZZLE_KIT,
    ['check', '--config', join(root, 'apps/server/drizzle.config.ts')],
    { cwd: join(root, 'apps/server'), deadline: DRIZZLE_KIT_DEADLINE_MS },
  )
  if (run.status !== 0) {
    refusals.push(`drizzle-kit check refused the migration history: ${run.output.trim()}`)
  }
}

function sources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .map((entry) => join(entry.parentPath, entry.name))
}

function checkSessionState(): void {
  for (const file of sources(join(root, SERVER_SOURCE))) {
    const text = readFileSync(file, 'utf8')
    for (const [pattern, what] of SESSION_STATE) {
      if (pattern.test(text)) refusals.push(`${file.slice(root.length + 1)}: ${what} (data D25)`)
    }
  }
}

checkAgainstBase()
checkHistory()
checkSessionState()
for (const refusal of refusals) console.error(`check-migrations: ${refusal}`)
if (refusals.length > 0) process.exit(1)
console.log('check-migrations: ok')
