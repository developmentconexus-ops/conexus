// Defect: a pull request changes the skills or the guides while a step is in construction, so
// running sessions end up on different rules (delivery L20).
// Refusals are proved by planting each one in check-method-freeze.test.ts.
// Revalidate by 2027-04-13, or when the emergency label changes.
import { existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { option } from './cli.ts'
import { runCommand } from './command.ts'

const EMERGENCY = 'emergência'
const FROZEN = ['.agents/skills/', 'docs/guides/']

const base = option('--base')
if (base === undefined) {
  console.error('check-method-freeze: --base <ref> is required')
  process.exit(2)
}
const labels = (option('--labels') ?? '').split(',').map((label) => label.trim())
const root = resolve(option('--root') ?? '.')

const stepsDir = join(root, 'docs/steps')
const hasCard = existsSync(stepsDir) && readdirSync(stepsDir).some((name) => name.endsWith('.md'))
if (!hasCard) {
  console.log('check-method-freeze: no step in construction, the method may change')
  process.exit(0)
}

const changed = runCommand('git', ['diff', '--name-only', '--no-renames', `${base}...HEAD`], {
  cwd: root,
})
  .split('\n')
  .filter((file) => FROZEN.some((prefix) => file.startsWith(prefix)))

if (changed.length > 0 && !labels.includes(EMERGENCY)) {
  console.error(`method-frozen-during-step: ${changed.join(', ')}`)
  process.exit(1)
}
console.log('check-method-freeze: the method is untouched')
