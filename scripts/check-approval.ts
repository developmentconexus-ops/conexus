// Defect: a step is built from a card the founder did not approve, or from one that changed after
// he did. The ledger line must cite a commit that is an ancestor of the tip, and the card must be
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
    // biome-ignore lint/plugin: a git command that exits non-zero answers this question with false (C53)
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
const ledger = readFileSync(join(root, 'docs/approvals.md'), 'utf8')

function checkCard(card: string): void {
  const digits = (card.match(/^e(\d+)-/) ?? [])[1] ?? ''
  const step =
    digits.length > 2
      ? digits.startsWith('0')
        ? `${Number(digits[1])}.${Number(digits.slice(2))}`
        : `${digits.slice(0, 2)}.${Number(digits.slice(2))}`
      : String(Number(digits))
  const cardPath = `docs/steps/${card}`
  const line = new RegExp(
    `^\\s*Cartão da etapa ${step.replace('.', '\\.')} aprovado em \\d{4}-\\d{2}-\\d{2} \\(commit ([0-9a-f]{7,40})\\): ".+"\\s*$`,
    'm',
  )
  const approved = ledger.match(line)?.[1]

  if (approved === undefined) {
    if (onlyDocuments()) {
      console.log(
        `check-approval: step ${step} is not approved yet, and this change holds only documents`,
      )
      return
    }
    refuse(
      'approval-missing',
      `docs/approvals.md has no approval line for step ${step} (${cardPath})`,
    )
  }
  if (!gitSucceeds('merge-base', '--is-ancestor', approved, 'HEAD')) {
    refuse('approval-commit-not-in-tip', `${approved} is not an ancestor of HEAD (${cardPath})`)
  }
  if (!gitSucceeds('diff', '--quiet', approved, 'HEAD', '--', cardPath)) {
    refuse('card-changed-after-approval', `${cardPath} differs from ${approved}`)
  }
  console.log(`check-approval: step ${step} approved at ${approved}, card unchanged`)
}

for (const card of cards.sort()) checkCard(card)
