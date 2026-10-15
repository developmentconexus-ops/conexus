// Defect: a unit's commit touches a file its card's blast radius does not name, and the departure
// reaches the founder only if the builder notices it (delivery L7).
// `npm run radius -- U<k> [commit]` reads the table under "O raio da mudança" in the unit's section
// of the card, and prints `out-of-radius <file>` for each file the commit changed outside it. A bare
// name in a cell may mean the root or the folder of the path before it: both match, and the row is
// named `ambiguous-row` so the card can say which.
// The refusals are proved by planting each one in check-radius.test.ts.
// Revalidate by 2027-04-15, or when the card template's radius table changes shape.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { runCommand } from './command.ts'

const root = process.cwd()
const [unit = '', commit = 'HEAD'] = process.argv.slice(2)

function refuse(name: string, detail: string): never {
  console.error(`${name}: ${detail}`)
  process.exit(1)
}

/** `a/{b,c/d}.ts` becomes `a/b.ts` and `a/c/d.ts`; braces nest. */
function expand(pattern: string): string[] {
  const open = pattern.indexOf('{')
  if (open === -1) return [pattern]
  let depth = 0
  const commas: number[] = []
  for (let index = open; index < pattern.length; index++) {
    const char = pattern[index]
    if (char === '{') depth++
    if (char === ',' && depth === 1) commas.push(index)
    if (char === '}' && --depth === 0) {
      const cuts = [open, ...commas, index]
      const head = pattern.slice(0, open)
      const tail = pattern.slice(index + 1)
      return cuts
        .slice(1)
        .flatMap((cut, part) =>
          expand(`${head}${pattern.slice((cuts[part] ?? 0) + 1, cut)}${tail}`),
        )
    }
  }
  return refuse('unbalanced-braces', pattern)
}

function matcher(path: string): RegExp {
  const pattern = path
    .split(/(<[^>]+>|\*)/)
    .map((part) => {
      if (part === '*') return '[^/]*'
      if (part.startsWith('<')) return '[^/]+'
      return part.replace(/[.+?^$()[\]\\|]/g, '\\$&')
    })
    .join('')
  return new RegExp(`^${pattern}${path.endsWith('/') ? '' : '$'}`)
}

function radiusRows(card: string): string[] {
  const section = card.split(/^## /m).find((part) => part.startsWith(`${unit} `))
  if (section === undefined) return refuse('unknown-unit', `the card has no section ## ${unit}`)
  const table = section.split(/^### O raio da mudança\s*$/m)[1]?.split(/^#/m)[0] ?? ''
  return table
    .split('\n')
    .filter((line) => line.startsWith('|') && !/^\|\s*(-|Arquivo\b)/.test(line))
    .map((line) => line.split('|')[1] ?? '')
}

function radiusOf(card: string): RegExp[] {
  const radius: RegExp[] = []
  for (const cell of radiusRows(card)) {
    let folder = ''
    for (const [, span = ''] of cell.matchAll(/`([^`]+)`/g)) {
      for (const path of expand(span)) {
        radius.push(matcher(path))
        if (path.includes('/')) folder = path.slice(0, path.lastIndexOf('/') + 1)
        else if (folder !== '') {
          radius.push(matcher(`${folder}${path}`))
          console.log(`ambiguous-row ${unit} ${path}: the root or ${folder}`)
        }
      }
    }
  }
  return radius
}

function changedFiles(): string[] {
  try {
    runCommand('git', ['rev-parse', '--verify', '--quiet', `${commit}^{commit}`], { cwd: root })
  } catch {
    refuse('unknown-commit', commit)
  }
  const listed = runCommand(
    'git',
    ['diff-tree', '-r', '--root', '--no-commit-id', '--no-renames', '--name-only', commit],
    { cwd: root },
  )
  return listed.split('\n').filter(Boolean)
}

if (!/^U\d+$/.test(unit)) refuse('usage', 'npm run radius -- U<k> [commit]')
const cards = readdirSync(join(root, 'docs/steps')).filter((name) => /^e\d+-.*\.md$/.test(name))
const card = readFileSync(
  join(root, 'docs/steps', cards[0] ?? refuse('no-card', 'docs/steps')),
  'utf8',
)
const radius = radiusOf(card)
const outside = changedFiles().filter((file) => !radius.some((pattern) => pattern.test(file)))
for (const file of outside) console.log(`out-of-radius ${unit} ${file}`)
if (outside.length > 0) process.exit(1)
console.log(`radius: ${unit} ${commit} inside`)
