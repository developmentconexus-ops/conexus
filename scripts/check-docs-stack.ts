// Defect: a package a workspace depends on, or a Python dependency of apps/extraction, has no row in
// the stack map; a row repeats or names nothing the repository uses; or a workspace pattern or the
// Python project file is one the check cannot read.
// A row marked "ahead of <card>" in its second cell is held while docs/steps/<card>.md exists: a
// method change lands the row before the code its card builds, and the card leaves at the step's
// closing (delivery L17), and a mark whose card is gone is refused, so the closing takes it off.
// Refusals are proved by planting each one in check-docs-stack.test.ts.
// Revalidate by 2027-04-13, or when the repository's dependencies move out of package.json and pyproject.toml.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { withoutFences } from './check-docs-method.ts'
import { PYTHON_PROJECT, pythonDependencies } from './check-docs-python.ts'

const STACK = 'docs/reference/stack.md'
/** What the repository runs that no package.json declares: the database, the runtime, the images, the Hub image's Google sign-in binary and the Python project's package manager. */
const OTHER_PIECES = ['PostgreSQL', 'Node', 'Docker', 'cloudflared', 'CLIProxyAPI', 'uv']

const SECTIONS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']
const Manifest = z.looseObject({
  name: z.string().optional(),
  workspaces: z.array(z.string()).optional(),
  ...Object.fromEntries(
    SECTIONS.map((section) => [section, z.record(z.string(), z.string()).optional()]),
  ),
})
type Manifest = z.infer<typeof Manifest>
type Fail = (name: string, file: string, detail: string) => void

function manifest(dir: string): Manifest {
  return Manifest.parse(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')))
}

/** The folders a workspace pattern names: a folder, or `folder/*` read as every folder under it with a package.json. */
function workspaceDirs(root: string, pattern: string, fail: Fail): string[] {
  const parent = pattern.endsWith('/*') ? pattern.slice(0, -2) : undefined
  if (/[*!?[{]/.test(parent ?? pattern)) {
    fail('stack-workspace-unread', 'package.json', pattern)
    return []
  }
  if (parent === undefined) return [join(root, pattern)]
  const folder = join(root, parent)
  if (!existsSync(folder)) return []
  return readdirSync(folder)
    .map((name) => join(folder, name))
    .filter((dir) => existsSync(join(dir, 'package.json')))
}

/** The root and each workspace. */
function manifests(root: string, fail: Fail): Manifest[] {
  const top = manifest(root)
  const dirs = (top.workspaces ?? []).flatMap((pattern) => workspaceDirs(root, pattern, fail))
  return [top, ...dirs.map(manifest)]
}

const TABLE_RULE = /^\|(?:\s*:?-+:?\s*\|)+\s*$/
const AHEAD = /\bahead of ([a-z0-9-]+)\b/

type StackRow = { piece: string; card?: string; ahead: boolean }

/** Each table row of the map: its first cell, code marks gone, and whether a card still holds it ahead; a header is the line above a rule. */
function stackRows(root: string, text: string): StackRow[] {
  const lines = withoutFences(text).split('\n')
  return lines
    .filter((line, i) => {
      const next = lines[i + 1] ?? ''
      return line.startsWith('|') && !TABLE_RULE.test(line) && !TABLE_RULE.test(next)
    })
    .map((line) => {
      const [, piece = '', usedIn = ''] = line.split('|')
      const card = usedIn.match(AHEAD)?.[1]
      return {
        piece: piece.replace(/`/g, '').trim(),
        card,
        ahead: card !== undefined && existsSync(join(root, 'docs/steps', `${card}.md`)),
      }
    })
}

/** The npm packages the workspaces declare, but for the repository's own. */
function npmPieces(all: Manifest[]): string[] {
  const own = new Set(all.map((each) => each.name))
  return all
    .flatMap((each) => SECTIONS.map((section) => each[section]))
    .flatMap((declared) => Object.keys(declared ?? {}))
    .filter((name) => !own.has(name))
}

/** Every piece the repository declares: the npm packages, the Python project's and what no manifest holds. */
function declaredPieces(root: string, fail: Fail): Set<string> {
  const python = pythonDependencies(root)
  for (const where of python.unread) fail('stack-python-unread', PYTHON_PROJECT, where)
  return new Set([...OTHER_PIECES, ...npmPieces(manifests(root, fail)), ...python.names])
}

function rowProblems(listed: StackRow[], pieces: Set<string>, fail: Fail) {
  const rows = new Set(listed.map((row) => row.piece))
  for (const [i, row] of listed.entries()) {
    if (listed.findIndex((other) => other.piece === row.piece) !== i) {
      fail('stack-row-twice', STACK, row.piece)
    }
  }
  for (const piece of pieces) {
    if (!rows.has(piece)) fail('stack-row-missing', STACK, piece)
  }
  for (const row of listed) {
    if (row.card !== undefined && !row.ahead) {
      fail('stack-row-ahead-stale', STACK, `${row.piece}: docs/steps/${row.card}.md is gone`)
    } else if (!pieces.has(row.piece) && !row.ahead) fail('stack-row-unknown', STACK, row.piece)
  }
}

/** The refusals of the stack map over a tree: one line each, `name: file: detail`. */
export function stackProblems(root: string): string[] {
  const problems: string[] = []
  const fail: Fail = (name, file, detail) => problems.push(`${name}: ${file}: ${detail}`)
  if (!existsSync(join(root, 'package.json'))) return problems
  const path = join(root, STACK)
  const listed = existsSync(path) ? stackRows(root, readFileSync(path, 'utf8')) : []
  rowProblems(listed, declaredPieces(root, fail), fail)
  return problems
}
