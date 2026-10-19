// Defect: a lint or type suppression enters without a cause, or without the committed count
// changing, so a pull request can hide one (code C76).
// Refusals are proved by planting each one in check-suppressions.test.ts.
// Revalidate by 2027-04-13, or when Biome or TypeScript gain a second suppression syntax.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { z } from 'zod'

const root = resolve(process.argv[2] ?? '.')
const SKIPPED = new Set(['node_modules', '.git', 'dist', 'coverage'])
const SOURCE = /\.(?:[cm]?[jt]sx?|css)$/
const SUPPRESSION =
  /^\s*\{?\s*(?:\/\/|\/\*+)\s*(biome-ignore(?:-all|-start|-end)?|@ts-ignore|@ts-expect-error|@ts-nocheck)\b(.*)$/
const CAUSE_AFTER_COLON = /^[^:]*:\s*\S/

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (SKIPPED.has(name)) return []
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

function hasCause(kind: string, rest: string): boolean {
  if (kind === 'biome-ignore-end') return true
  if (kind.startsWith('biome-ignore')) return CAUSE_AFTER_COLON.test(rest)
  return rest.replace(/\*\/\s*\}?\s*$/, '').trim().length > 0
}

const counts: Record<string, number> = {}
const problems: string[] = []
for (const path of walk(root).filter((file) => SOURCE.test(file))) {
  const file = relative(root, path)
  readFileSync(path, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      const match = line.match(SUPPRESSION)
      if (match === null) return
      counts[file] = (counts[file] ?? 0) + 1
      if (!hasCause(match[1] ?? '', match[2] ?? '')) {
        problems.push(`suppression-without-cause: ${file}:${index + 1}`)
      }
    })
}

const recordPath = join(root, 'scripts/suppressions.json')
const recorded: Record<string, number> = existsSync(recordPath)
  ? z.record(z.string(), z.number()).parse(JSON.parse(readFileSync(recordPath, 'utf8')))
  : {}
for (const file of new Set([...Object.keys(counts), ...Object.keys(recorded)])) {
  const real = counts[file] ?? 0
  const written = recorded[file] ?? 0
  if (real !== written) {
    problems.push(
      `suppression-count-changed: ${file}: ${real} in the file, ${written} in scripts/suppressions.json`,
    )
  }
}

if (problems.length > 0) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log('check-suppressions: counts match')
