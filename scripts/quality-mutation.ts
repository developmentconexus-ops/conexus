// Stryker over the lines a change adds, one run per package that has a Stryker configuration.
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { z } from 'zod'
import { spawnCommand } from './command.ts'
import type { Changed } from './quality-changes.ts'
import { isTest } from './quality-changes.ts'

const STRYKER = join(import.meta.dirname, '../node_modules/.bin/stryker')
const MUTATION_DEADLINE_MS = 60 * 60 * 1000
const Config = z.looseObject({
  commandRunner: z.looseObject({ command: z.string() }).optional(),
  jsonReporter: z.looseObject({ fileName: z.string() }),
})
const Report = z.looseObject({
  files: z.record(
    z.string(),
    z.looseObject({
      mutants: z.array(
        z.looseObject({
          mutatorName: z.string(),
          replacement: z.string().optional(),
          status: z.string(),
          location: z.looseObject({ start: z.looseObject({ line: z.number() }) }),
        }),
      ),
    }),
  ),
})

type Survivor = { file: string; line: number; mutator: string; replacement: string }
export type Mutation = { package: string; tests: string[]; mutants: number; survivors: Survivor[] }

function packageOf(file: string): string {
  const [top, name] = file.split('/')
  return top === 'apps' || top === 'packages' ? `${top}/${name}` : (top ?? '')
}

const RELATIVE_IMPORT = /\bfrom\s+['"](\.{1,2}\/[^'"]+)['"]/g

function importsOf(root: string, file: string): string[] {
  const text = readFileSync(join(root, file), 'utf8')
  return [...text.matchAll(RELATIVE_IMPORT)]
    .map((match) => join(dirname(file), match[1] ?? '').replace(/\.js$/, '.ts'))
    .filter((target) => existsSync(join(root, target)))
}

/** The files a test reaches the source through: its own folder's code, never another folder's. */
function stepsInto(args: { from: string; target: string }): boolean {
  const { from, target } = args
  return dirname(target) === dirname(from)
}

/** Whether `test` reaches `source` through relative imports, so a test that goes through the folder's `public.ts` or a `test-*.ts` helper counts. */
function reaches(args: { root: string; test: string; source: string }): boolean {
  const { root, test, source } = args
  const seen = new Set([test])
  const queue = [test]
  for (let file = queue.pop(); file !== undefined; file = queue.pop()) {
    for (const target of importsOf(root, file)) {
      if (target === source) return true
      if (!seen.has(target) && stepsInto({ from: test, target })) {
        seen.add(target)
        queue.push(target)
      }
    }
  }
  return false
}

/**
 * The test files that own a package's changed code: the tests the change touches, the one beside each file,
 * and every other test in the file's folder that reaches it through its imports.
 */
export function owners(args: {
  root: string
  changed: Changed
  sources: Changed
  pkg: string
}): string[] {
  const { root, changed, sources, pkg } = args
  const touched = [...changed.keys()].filter((file) => packageOf(file) === pkg && isTest(file))
  const files = [...sources.keys()].filter((file) => packageOf(file) === pkg)
  const reaching = files.flatMap((source) =>
    readdirSync(join(root, dirname(source)))
      .filter((name) => /\.test\.tsx?$/.test(name))
      .map((name) => join(dirname(source), name))
      .filter((test) => reaches({ root, test, source })),
  )
  const beside = files
    .map((file) => file.replace(/\.tsx?$/, '.test.ts'))
    .filter((file) => existsSync(join(root, file)))
  return [...new Set([...touched, ...beside, ...reaching])]
}

/** Runs Stryker in `pkg` on the added lines of `sources`; the server's command runner gets the owning `tests`. */
export function mutate(args: {
  root: string
  pkg: string
  sources: Changed
  tests: string[]
}): Mutation {
  const { root, pkg, sources, tests } = args
  const cwd = join(root, pkg)
  const config = Config.parse(JSON.parse(readFileSync(join(cwd, 'stryker.config.json'), 'utf8')))
  const ranges = [...sources].filter(([file]) => packageOf(file) === pkg)
  const entries = ranges.flatMap(([file, lines]) =>
    lines.map(([start, end]) => `${relative(pkg, file)}:${start}-${end}`),
  )
  const flags = ['run', '--mutate', entries.join(',')]
  if (config.commandRunner !== undefined) {
    if (tests.length === 0) {
      throw new Error(`${pkg}: no test file owns the changed code; name them with --tests`)
    }
    const files = tests.map((file) => relative(pkg, file)).join(' ')
    flags.push('--commandRunner.command', `${config.commandRunner.command} ${files}`)
  }
  const reportFile = join(cwd, config.jsonReporter.fileName)
  rmSync(reportFile, { force: true })
  const run = spawnCommand(STRYKER, flags, { cwd, deadline: MUTATION_DEADLINE_MS })
  if (!existsSync(reportFile))
    throw new Error(`${pkg}: Stryker wrote no report:\n${run.output.slice(-2000)}`)
  const report = Report.parse(JSON.parse(readFileSync(reportFile, 'utf8')))
  const mutants = Object.entries(report.files).flatMap(([file, entry]) =>
    entry.mutants.map((mutant) => ({ file: join(pkg, file), mutant })),
  )
  const survivors = mutants
    .filter(({ mutant }) => mutant.status === 'Survived' || mutant.status === 'NoCoverage')
    .map(({ file, mutant }) => ({
      file,
      line: mutant.location.start.line,
      mutator:
        mutant.status === 'NoCoverage'
          ? `${mutant.mutatorName} (no test covers it)`
          : mutant.mutatorName,
      replacement: mutant.replacement ?? '',
    }))
  return {
    package: pkg,
    tests: config.commandRunner === undefined ? [] : tests,
    mutants: mutants.length,
    survivors,
  }
}

/** Packages that hold changed source and a Stryker configuration; the rest are named as not mutated. */
export function mutable(root: string, sources: Changed): { run: string[]; skipped: string[] } {
  const packages = [...new Set([...sources.keys()].map(packageOf))]
  function has(pkg: string): boolean {
    return existsSync(join(root, pkg, 'stryker.config.json'))
  }
  return { run: packages.filter(has), skipped: packages.filter((pkg) => !has(pkg)) }
}
