// Defect: a step is built from a card the founder did not approve, or from one that changed after
// he did. The ledger line must cite a commit that is an ancestor of the tip, and the card must be
// the same file at that commit and now (delivery L6).
// Refusals are proved by planting each one in check-approval.test.ts.
// An amended card has more than one approval line; the last one holds (founder, 2026-10-22).
// A card of three levels, e2432, is step 24.3.2 (founder, 2026-11-03: "4. Okay").
// Revalidate by 2027-04-13, or when the approval line changes shape.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { runCommand } from './command.ts'
import { cardsInConstruction, tracksTouched } from './tracks.ts'

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
const inConstruction = cardsInConstruction(root, existsSync(stepsDir) ? readdirSync(stepsDir) : [])
// A pull request answers for the cards of the tracks it touches (delivery L6, L20); a push to main, which has no base, for all.
const touched = base === undefined ? undefined : tracksTouched(root, base)
const cards = [...inConstruction]
  .filter(([, track]) => touched === undefined || touched.has(track))
  .map(([name]) => name)
if (cards.length === 0) {
  console.log('check-approval: no card of a track this change touches, nothing to check')
  process.exit(0)
}
const ledger = readFileSync(join(root, 'docs/approvals.md'), 'utf8')

function approvedCommit(card: string): { label: string; approved: string | undefined } {
  const cardPath = `docs/steps/${card}`
  const digits = (card.match(/^e(\d+)-/) ?? [])[1]
  const file = cardPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // A short card has no step number: its ledger line names its file.
  const line =
    digits === undefined
      ? new RegExp(
          `^\\s*(?:Cartão curto .+ \\(\`${file}\`\\) aprovado|Emenda do cartão curto .+ \\(\`${file}\`\\) aprovada) em \\d{4}-\\d{2}-\\d{2} \\(commit ([0-9a-f]{7,40})\\).*: ".+"`,
          'gm',
        )
      : new RegExp(
          `^\\s*Cartão da etapa ${stepOf(digits).replaceAll('.', '\\.')} aprovado em \\d{4}-\\d{2}-\\d{2} \\(commit ([0-9a-f]{7,40})\\): ".+"\\s*$`,
          'gm',
        )
  // An amended card is approved again: the newest line is the one that holds.
  const approved = [...ledger.matchAll(line)].at(-1)?.[1]
  return { label: digits === undefined ? card : `step ${stepOf(digits)}`, approved }
}

// The first two digits are the step and each one after a level: e041 is 4.1, e2432 is 24.3.2.
function stepOf(digits: string): string {
  return [String(Number(digits.slice(0, 2))), ...digits.slice(2)].join('.')
}

function checkCard(card: string): void {
  const cardPath = `docs/steps/${card}`
  const { label, approved } = approvedCommit(card)

  if (approved === undefined) {
    if (onlyDocuments()) {
      console.log(
        `check-approval: ${label} is not approved yet, and this change holds only documents`,
      )
      return
    }
    refuse('approval-missing', `docs/approvals.md has no approval line for ${label} (${cardPath})`)
  }
  if (!gitSucceeds('merge-base', '--is-ancestor', approved, 'HEAD')) {
    refuse('approval-commit-not-in-tip', `${approved} is not an ancestor of HEAD (${cardPath})`)
  }
  if (!gitSucceeds('diff', '--quiet', approved, 'HEAD', '--', cardPath)) {
    refuse('card-changed-after-approval', `${cardPath} differs from ${approved}`)
  }
  console.log(`check-approval: ${label} approved at ${approved}, card unchanged`)
}

for (const card of cards.sort()) checkCard(card)
