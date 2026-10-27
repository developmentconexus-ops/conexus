// The lines a change adds, from `git diff -U0`, and the source files they belong to.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { runCommand } from './command.ts'

export type Range = [start: number, end: number]
/** Added lines per file, 1-based and inclusive. */
export type Changed = Map<string, Range[]>
/** The lines a change adds, and the path each renamed file had at the base, by its new path. */
export type Diff = { lines: Changed; renames: Map<string, string> }

const SOURCE = /^(?:(?:apps|packages)\/[^/]+\/src\/|scripts\/).*\.tsx?$/
const NOT_SOURCE =
  /\.(?:test|check)\.tsx?$|\.d\.ts$|(?:^|\/)(?:test-[^/]*|[^/]*fixtures?)\.tsx?$|routeTree\.gen\.ts$|\/(?:recordings|starter)\//

const TREE = /^(?:apps|packages)\/[^/]+\/src\/.*\.tsx?$/

export function isSource(path: string): boolean {
  return SOURCE.test(path) && !NOT_SOURCE.test(path)
}

export function isTest(path: string): boolean {
  return /\.test\.tsx?$/.test(path)
}

function addedRange(line: string): Range | undefined {
  const hunk = line.match(/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/)
  if (hunk === null) return undefined
  const start = Number(hunk[1])
  const count = hunk[2] === undefined ? 1 : Number(hunk[2])
  return count > 0 ? [start, start + count - 1] : undefined
}

function hunks(diff: string): Diff {
  const changed: Changed = new Map()
  const renames = new Map<string, string>()
  let file: string | undefined
  let from: string | undefined
  for (const line of diff.split('\n')) {
    if (line.startsWith('rename from ')) from = line.slice(12)
    if (line.startsWith('rename to ') && from !== undefined) renames.set(line.slice(10), from)
    if (line.startsWith('+++ ')) {
      file = line.startsWith('+++ b/') ? line.slice(6) : undefined
      continue
    }
    const range = addedRange(line)
    if (file !== undefined && range !== undefined) {
      changed.set(file, [...(changed.get(file) ?? []), range])
    }
  }
  return { lines: changed, renames }
}

/** What `git status` lists as added or edited, against the point where this work left `base`. */
export function changedLines(root: string, base: string): Diff {
  const diff = runCommand('git', ['diff', '-U0', '-M', '--diff-filter=AMR', base], { cwd: root })
  const { lines: changed, renames } = hunks(diff)
  const untracked = runCommand('git', ['ls-files', '--others', '--exclude-standard'], { cwd: root })
  for (const file of untracked.split('\n').filter(Boolean)) {
    const lines = readFileSync(join(root, file), 'utf8').split('\n').length
    changed.set(file, [[1, lines]])
  }
  return { lines: changed, renames }
}

export function touches(ranges: Range[], start: number, end: number): boolean {
  return ranges.some(([from, to]) => from <= end && start <= to)
}

/**
 * The contents of `files` at `ref`, written under `dir` at the paths they have now (a renamed file is
 * read under its old path); a file new since `ref` is skipped.
 */
export function writeAt(args: {
  root: string
  ref: string
  files: string[]
  renames: Map<string, string>
  dir: string
}): void {
  const { root, ref, files, renames, dir } = args
  for (const file of files) {
    let text: string
    try {
      text = runCommand('git', ['show', `${ref}:${renames.get(file) ?? file}`], { cwd: root })
    } catch {
      continue
    }
    mkdirSync(dirname(join(dir, file)), { recursive: true })
    writeFileSync(join(dir, file), text)
  }
}

/** The code trees the duplication run reads, as of `ref`, under `dir`. */
export function extractSources(args: {
  root: string
  ref: string
  renames: Map<string, string>
  dir: string
}): void {
  const { root, ref, renames, dir } = args
  const all = runCommand('git', ['ls-tree', '-r', '--name-only', ref], { cwd: root })
  const files = all.split('\n').filter((file) => TREE.test(file))
  const archive = execFileSync('git', ['archive', '--format=tar', ref, '--', ...files], {
    cwd: root,
    maxBuffer: 256 * 1024 * 1024,
    timeout: 60_000,
  })
  execFileSync('tar', ['-x', '-C', dir], { input: archive, timeout: 60_000 })
  for (const [now, before] of renames) {
    if (!existsSync(join(dir, before))) continue
    mkdirSync(dirname(join(dir, now)), { recursive: true })
    renameSync(join(dir, before), join(dir, now))
  }
}
