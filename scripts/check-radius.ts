// Defect: a unit's commit touches a file its card's blast radius does not name, and the departure
// reaches the founder only if the builder notices it (delivery L7).
// `npm run radius -- U<k> [commit]` reads the table under "O raio da mudança" in the unit's section
// of the card, and prints `out-of-radius <file>` for each file the commit changed outside it. A bare
// name in a cell may mean the root or the folder of the path before it: both match, and the row is
// named `ambiguous-row` so the card can say which.
// Matching is Node's `path.matchesGlob` over a translation of the cell, so the card's grammar stays
// its own (see globOf). The refusals are proved by planting each one in check-radius.test.ts.
// Revalidate by 2027-04-15, when the card template's radius table changes shape, or when Node's
// glob matcher changes.
import { readdirSync, readFileSync } from 'node:fs'
import { join, matchesGlob } from 'node:path'
import { runCommand } from './command.ts'

const root = process.cwd()
const [unit = '', commit = 'HEAD'] = process.argv.slice(2)

function refuse(name: string, detail: string): never {
  console.error(`${name}: ${detail}`)
  process.exit(1)
}

/**
 * The card's cell grammar as a `path.matchesGlob` pattern: `*` is any run inside one segment, a
 * `<placeholder>` is one or more characters inside one segment, `{a,b}` alternates, a trailing `/`
 * names a folder (kept as the trailing `/`; see isInside), and every other character is itself, a dot-leading name included. Node's matcher
 * reads more (`**`, `?`, classes, extglobs, escapes, and `*` skipping dotfiles), so the cell is
 * translated rather than passed through.
 */
function globOf(span: string): string {
  const alternatives: boolean[] = []
  for (const char of span) {
    if (char === '{') alternatives.push(false)
    if (char === ',' && alternatives.length > 0) alternatives[alternatives.length - 1] = true
    if (char === '}' && alternatives.length > 0 && alternatives.pop() === false) {
      return refuse('lonely-braces', span)
    }
  }
  if (alternatives.length > 0) return refuse('unbalanced-braces', span)
  if (span.includes('\\')) return refuse('backslash', span)
  let glob = ''
  for (const part of span.split(/(<[^>]+>|\*+)/)) {
    const atSegmentStart = glob === '' || /[/{,]$/.test(glob)
    if (part.startsWith('<')) glob += atSegmentStart ? '{?*,.*}' : '?*'
    else if (part.startsWith('*')) glob += atSegmentStart ? '{*,.*}' : '*'
    else glob += part.replace(/[?[(]/g, '[$&]')
  }
  return glob
}

/** `docs/**` skips dot names in Node's matcher, so a folder holds a file when one of its parents is the folder. */
function isInside(file: string, pattern: string): boolean {
  if (!pattern.endsWith('/')) return matchesGlob(file, pattern)
  const parts = file.split('/')
  return parts.slice(0, -1).some((_, index) => {
    return matchesGlob(parts.slice(0, index + 1).join('/'), pattern.slice(0, -1))
  })
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

function radiusOf(card: string): string[] {
  const radius: string[] = []
  for (const cell of radiusRows(card)) {
    let folder = ''
    for (const [, span = ''] of cell.matchAll(/`([^`]+)`/g)) {
      radius.push(globOf(span))
      const fixed = span.slice(0, span.includes('{') ? span.indexOf('{') : undefined)
      if (span.includes('/')) folder = fixed.slice(0, fixed.lastIndexOf('/') + 1)
      else if (folder !== '') {
        radius.push(globOf(`${folder}${span}`))
        console.log(`ambiguous-row ${unit} ${span}: the root or ${folder}`)
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
    [
      '-c',
      'core.quotePath=false',
      'diff-tree',
      '-r',
      '--root',
      '--no-commit-id',
      '--no-renames',
      '--name-only',
      '-m',
      '--first-parent',
      commit,
    ],
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
const outside = changedFiles().filter((file) => !radius.some((pattern) => isInside(file, pattern)))
for (const file of outside) console.log(`out-of-radius ${unit} ${file}`)
if (outside.length > 0) process.exit(1)
console.log(`radius: ${unit} ${commit} inside`)
