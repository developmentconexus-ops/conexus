import { appendFileSync, readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { option, STEP_CARD } from './cli.ts'
import { runCommand } from './command.ts'

const base = option('--base')
if (base === undefined) {
  console.error('change-budget: --base <ref> is required')
  process.exit(2)
}
const root = resolve(option('--root') ?? '.')
const cards = readdirSync(resolve(root, 'docs/steps')).filter((name) => STEP_CARD.test(name))
const cardName = cards[0]
if (cards.length !== 1 || cardName === undefined) {
  console.error(`change-budget: expected one step card, found ${cards.length}`)
  process.exit(2)
}
const card = readFileSync(resolve(root, 'docs/steps', cardName), 'utf8')
const unitNames = [...card.matchAll(/^## (U\d+) /gm)].map((match) => match[1] ?? '')
const files = runCommand('git', ['diff', '--numstat', `${base}...HEAD`], { cwd: root })
  .split('\n')
  .flatMap((line) => {
    const [added = '0', removed = '0', path = ''] = line.split('\t')
    if (
      !path ||
      added === '-' ||
      removed === '-' ||
      !/\.(?:[cm]?[jt]sx?|sql|sh|css|html|grit)$/.test(path) ||
      /(^|\/)([^/]+\.test\.[jt]sx?|tests\/)|(^|\/)(dist|build|generated)\//.test(path)
    )
      return []
    return [{ path, lines: Number(added) + Number(removed) }]
  })
const total = files.reduce((sum, file) => sum + file.lines, 0)
const rows = unitNames.map((unit) => {
  const section = card.split(/^## /m).find((part) => part.startsWith(`${unit} `)) ?? ''
  const radius = section.split(/^### O raio da mudança\s*$/m)[1]?.split(/^#/m)[0] ?? ''
  const folders = [...radius.matchAll(/`([^`]+)`/g)]
    .map((match) => match[1] ?? '')
    .filter((value) => value.endsWith('/'))
  const count = files
    .filter((file) => folders.some((folder) => file.path.startsWith(folder)))
    .reduce((sum, file) => sum + file.lines, 0)
  const escaped = unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const budget = Number(
    card
      .match(new RegExp(`${escaped}[^\\n]*?\\*\\*(\\d[\\d.,]*)\\*\\*`))?.[1]
      ?.replace(/[.,]/g, '') ?? 0,
  )
  return `| ${unit} | ${count} | ${budget || 'not specified'} |`
})
const summary = `## Changed code size (informational)\n\nTests and generated files excluded; additions plus removals from \`git diff --numstat\`. This report does not fail CI.\n\n| Unit | Changed lines | Budget |\n| --- | ---: | ---: |\n${rows.join('\n')}\n| Total | ${total} | — |\n\n`
console.log(summary)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
