// Defect: a pre-push gate that each person must turn on by hand is skipped without a word
// (docs/how-to/ci-health.md). `npm install` runs this through the `prepare` script and points
// core.hooksPath at .githooks, git's own place for hooks.
// Revalidate by 2027-05-17.
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { runCommand } from './command.ts'

const root = resolve(process.argv[2] ?? join(import.meta.dirname, '..'))
const HOOKS = '.githooks'

if (!existsSync(join(root, '.git'))) {
  console.log(`install-hooks: ${root} is not a git checkout, so ${HOOKS} was not turned on`)
} else {
  runCommand('git', ['config', 'core.hooksPath', HOOKS], { cwd: root })
  console.log(`install-hooks: git hooks now read ${HOOKS} (pre-push runs npm run check)`)
}
