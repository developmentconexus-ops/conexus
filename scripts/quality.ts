// Defect: a feature ships lines its tests do not pin, a function it touches grows past what a
// reader holds, or it adds a clone of code that already has an owner (testing T-rule on mutation,
// code C77 and C26). `quality.ts [<base>]` runs, on the lines the work adds against <base> (default
// origin/main): Stryker mutation on the packages that have a stryker.config.json, Biome cognitive
// complexity on the functions it touches, and jscpd for new clones. `--fast` skips the mutation, as
// CI does. `--tests <file>,...` names the server tests that own the changed code when the change
// and the files beside it do not. Mutation is accounting, not a threshold: survivors print and the
// builder or reviewer answers each one. The refusals of the other two are proved in quality.test.ts.
// Revalidate by 2027-04-27, or when Stryker, Biome or jscpd change what they report.
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { option } from './cli.ts'
import { runCommand } from './command.ts'
import type { Changed } from './quality-changes.ts'
import { changedLines, extractSources, isSource, writeAt } from './quality-changes.ts'
import type { Row } from './quality-complexity.ts'
import { complexityRows, fails } from './quality-complexity.ts'
import { newClones } from './quality-duplication.ts'
import { mutable, mutate, owners } from './quality-mutation.ts'

const root = resolve(option('--root') ?? '.')
const fast = process.argv.includes('--fast')
const base =
  process.argv
    .slice(2)
    .find((arg, i, all) => !arg.startsWith('--') && !all[i - 1]?.startsWith('--')) ?? 'origin/main'
const scratch = mkdtempSync(join(tmpdir(), 'conexus-quality-'))
const failures: string[] = []

function git(...args: string[]): string {
  return runCommand('git', args, { cwd: root }).trim()
}

function complexityLine(row: Row): string {
  const before = row.base === undefined ? 'new' : String(row.base)
  return `  ${row.file}:${row.line} ${row.name}: ${before} -> ${row.head}`
}

function reportMutation(sources: Changed, all: Changed): void {
  const { run, skipped } = mutable(root, sources)
  for (const pkg of skipped)
    console.log(`mutation: ${pkg} has no Stryker configuration, not mutated`)
  for (const pkg of run) {
    const tests = option('--tests')?.split(',') ?? owners(root, all, sources, pkg)
    const result = mutate(root, pkg, sources, tests)
    console.log(`mutation: ${pkg}, ${result.mutants} mutants, ${result.survivors.length} survived`)
    for (const s of result.survivors) {
      const replacement = s.replacement.replace(/\s+/g, ' ')
      const shown = replacement.length > 100 ? `${replacement.slice(0, 100)}...` : replacement
      console.log(`  ${s.file}:${s.line} ${s.mutator} -> ${shown}`)
    }
  }
}

try {
  const point = git('merge-base', base, 'HEAD')
  const all = changedLines(root, point)
  const sources: Changed = new Map([...all].filter(([file]) => isSource(file)))
  console.log(`quality: ${sources.size} changed source files against ${point.slice(0, 7)}`)
  const baseFiles = join(scratch, 'base-files')
  mkdirSync(baseFiles)
  writeAt(root, point, [...sources.keys()], baseFiles)
  const rows = complexityRows(root, sources, baseFiles, scratch)
  console.log(rows.length === 0 ? 'complexity: no touched function above 1' : 'complexity:')
  for (const row of rows) console.log(complexityLine(row))
  failures.push(
    ...rows.filter(fails).map((r) => `complexity: ${r.file}:${r.line} ${r.name} is ${r.head}`),
  )
  const baseTree = join(scratch, 'base-tree')
  const clones = newClones(
    root,
    sources,
    () => {
      mkdirSync(baseTree)
      extractSources(root, point, baseTree)
      return baseTree
    },
    scratch,
  )
  console.log(clones.length === 0 ? 'duplication: no new clone' : 'duplication:')
  for (const c of clones) {
    const text = `${c.a.name}:${c.a.start}-${c.a.end} with ${c.b.name}:${c.b.start}-${c.b.end}`
    console.log(`  ${text}`)
    failures.push(`new clone: ${text}`)
  }
  if (!fast) reportMutation(sources, all)
} finally {
  rmSync(scratch, { recursive: true, force: true })
}
for (const failure of failures) console.error(`quality: ${failure}`)
process.exit(failures.length === 0 ? 0 : 1)
