// Defect: a step is built from a card the founder did not approve, or from one that changed after
// he did. The roadmap line must cite a commit that is an ancestor of the tip, and the card must be
// the same file at that commit and now (delivery L6).
// Refusals are proved by planting each one in check-approval.test.ts.
// Revalidate by 2027-04-13, or when the approval line changes shape.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { STEP_CARD } from './cli.ts'
import { runCommand } from './command.ts'

const args = process.argv.slice(2)
const baseIndex = args.indexOf('--base')
const base = baseIndex === -1 ? undefined : args[baseIndex + 1]
const positional = args.filter((arg, index) => arg !== '--base' && args[index - 1] !== '--base')
const root = resolve(positional[0] ?? '.')

function git(...gitArgs: string[]): string {
  return runCommand('git', gitArgs, { cwd: root, stderr: 'pipe' })
}

function gitSucceeds(...gitArgs: string[]): boolean {
  try {
    git(...gitArgs)
    return true
  } catch {
    return false
  }
}

function refuse(name: string, detail: string): never {
  console.error(`${name}: ${detail}`)
  process.exit(1)
}

function onlyDocuments(): boolean {
  if (base === undefined) return false
  const changed = git('diff', '--name-only', `${base}...HEAD`).split('\n').filter(Boolean)
  return changed.every((file) => file.startsWith('docs/') || /^[^/]+\.md$/.test(file))
}

const stepsDir = join(root, 'docs/steps')
const cards = existsSync(stepsDir)
  ? readdirSync(stepsDir).filter((name) => STEP_CARD.test(name))
  : []
if (cards.length === 0) {
  console.log('check-approval: no card in docs/steps, nothing to check')
  process.exit(0)
}
const card = cards[0] ?? ''
const step = ((card.match(/^e(\d+(?:\.\d+)?)-/) ?? [])[1] ?? '').replace(/^0+(?=\d)/, '')
const cardPath = `docs/steps/${card}`

const roadmap = readFileSync(join(root, 'docs/roadmap.md'), 'utf8')
const line = new RegExp(
  `^\\s*Cartão da etapa ${step.replace('.', '\\.')} aprovado em \\d{4}-\\d{2}-\\d{2} \\(commit ([0-9a-f]{7,40})\\): ".+"\\s*$`,
  'm',
)
const approved = roadmap.match(line)?.[1]

if (approved === undefined) {
  if (onlyDocuments()) {
    console.log(
      `check-approval: step ${step} is not approved yet, and this change holds only documents`,
    )
    process.exit(0)
  }
  refuse('approval-missing', `docs/roadmap.md has no approval line for step ${step}`)
}
if (!gitSucceeds('merge-base', '--is-ancestor', approved, 'HEAD')) {
  refuse('approval-commit-not-in-tip', `${approved} is not an ancestor of HEAD`)
}
if (!gitSucceeds('diff', '--quiet', approved, 'HEAD', '--', cardPath)) {
  refuse('card-changed-after-approval', `${cardPath} differs from ${approved}`)
}
console.log(`check-approval: step ${step} approved at ${approved}, card unchanged`)
