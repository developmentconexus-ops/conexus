// The lines a change adds, from `git diff -U0`, and the source files they belong to.
import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { runCommand } from './command.ts'

export type Range = [start: number, end: number]
/** Added lines per file, 1-based and inclusive. */
export type Changed = Map<string, Range[]>

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

function hunks(diff: string): Changed {
  const changed: Changed = new Map()
  let file: string | undefined
  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ ')) {
      file = line.startsWith('+++ b/') ? line.slice(6) : undefined
      continue
    }
    const range = addedRange(line)
    if (file !== undefined && range !== undefined) {
      changed.set(file, [...(changed.get(file) ?? []), range])
    }
  }
  return changed
}

/** What `git status` lists as added or edited, against the point where this work left `base`. */
export function changedLines(root: string, base: string): Changed {
  const diff = runCommand('git', ['diff', '-U0', '--no-renames', '--diff-filter=AM', base], {
    cwd: root,
  })
  const changed = hunks(diff)
  const untracked = runCommand('git', ['ls-files', '--others', '--exclude-standard'], { cwd: root })
  for (const file of untracked.split('\n').filter(Boolean)) {
    const lines = readFileSync(join(root, file), 'utf8').split('\n').length
    changed.set(file, [[1, lines]])
  }
  return changed
}

export function touches(ranges: Range[], start: number, end: number): boolean {
  return ranges.some(([from, to]) => from <= end && start <= to)
}

/** The contents of `files` at `ref`, written under `dir` at the same paths; a file new since `ref` is skipped. */
export function writeAt(root: string, ref: string, files: string[], dir: string): void {
  for (const file of files) {
    let text: string
    try {
      text = runCommand('git', ['show', `${ref}:${file}`], { cwd: root })
    } catch {
      continue
    }
    mkdirSync(dirname(join(dir, file)), { recursive: true })
    writeFileSync(join(dir, file), text)
  }
}

/** The code trees the duplication run reads, as of `ref`, under `dir`. */
export function extractSources(root: string, ref: string, dir: string): void {
  const all = runCommand('git', ['ls-tree', '-r', '--name-only', ref], { cwd: root })
  const files = all.split('\n').filter((file) => TREE.test(file))
  const archive = execFileSync('git', ['archive', '--format=tar', ref, '--', ...files], {
    cwd: root,
    maxBuffer: 256 * 1024 * 1024,
    timeout: 60_000,
  })
  execFileSync('tar', ['-x', '-C', dir], { input: archive, timeout: 60_000 })
}
