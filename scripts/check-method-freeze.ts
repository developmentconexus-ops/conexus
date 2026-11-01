// Defect: a pull request changes the skills or the guides while a step of a track it affects is in
// construction, so running sessions end up on different rules (delivery L20).
// Refusals are proved by planting each one in check-method-freeze.test.ts.
// Revalidate by 2027-04-13, or when the emergency label changes.
import { existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { option } from './cli.ts'
import { runCommand } from './command.ts'

const EMERGENCY = 'emergência'
const FROZEN = ['.agents/skills/', 'docs/guides/']
// A card named pattern-*.md is the pattern track's; any other card is the frontier's.
const PATTERN_PREFIX = 'pattern-'
const PATTERN_ONLY = ['.agents/skills/conexus-scope/references/pattern-card.md']

const base = option('--base')
if (base === undefined) {
  console.error('check-method-freeze: --base <ref> is required')
  process.exit(2)
}
const labels = (option('--labels') ?? '').split(',').map((label) => label.trim())
const root = resolve(option('--root') ?? '.')

const stepsDir = join(root, 'docs/steps')
const cards = existsSync(stepsDir)
  ? readdirSync(stepsDir).filter((name) => name.endsWith('.md'))
  : []
const inConstruction = {
  pattern: cards.some((name) => name.startsWith(PATTERN_PREFIX)),
  frontier: cards.some((name) => !name.startsWith(PATTERN_PREFIX)),
}
if (!inConstruction.pattern && !inConstruction.frontier) {
  console.log('check-method-freeze: no step in construction, the method may change')
  process.exit(0)
}

const changed = runCommand('git', ['diff', '--name-only', '--no-renames', `${base}...HEAD`], {
  cwd: root,
})
  .split('\n')
  .filter((file) => FROZEN.some((prefix) => file.startsWith(prefix)))
  .filter((file) => (PATTERN_ONLY.includes(file) ? inConstruction.pattern : true))

if (changed.length > 0 && !labels.includes(EMERGENCY)) {
  console.error(`method-frozen-during-step: ${changed.join(', ')}`)
  process.exit(1)
}
console.log('check-method-freeze: the method is untouched')
