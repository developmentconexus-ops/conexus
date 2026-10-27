// Biome's cognitive complexity per function, for the functions a change touches.
// Biome reports a score at a function's name, not its extent, so the TypeScript parser gives the
// extent that tells a touched function from an untouched one.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from 'typescript'
import { z } from 'zod'
import { spawnCommand } from './command.ts'
import type { Changed } from './quality-changes.ts'
import { touches } from './quality-changes.ts'

/** Cognitive complexity a touched function may not pass, nor raise once it has passed it (code C77). */
const MAX_COMPLEXITY = 15

const CONFIG = join(import.meta.dirname, 'complexity.biome.json')
const BIOME = join(import.meta.dirname, '../node_modules/.bin/biome')
const Report = z.looseObject({
  diagnostics: z.array(
    z.looseObject({
      message: z.string(),
      location: z.looseObject({
        path: z.string(),
        start: z.looseObject({ line: z.number(), column: z.number() }),
      }),
    }),
  ),
})

type Fn = { key: string; from: number; to: number; startLine: number; endLine: number }
export type Row = {
  file: string
  name: string
  line: number
  base: number | undefined
  head: number
}

function nameOf(node: ts.FunctionLikeDeclaration, source: ts.SourceFile): string {
  if (ts.isConstructorDeclaration(node)) return 'constructor'
  if (node.name !== undefined) return node.name.getText(source)
  const parent = node.parent
  if (ts.isVariableDeclaration(parent) || ts.isPropertyAssignment(parent)) {
    return parent.name.getText(source)
  }
  if (ts.isCallExpression(parent)) {
    const callee = parent.expression
    return `callback of ${ts.isPropertyAccessExpression(callee) ? callee.name.text : callee.getText(source)}`
  }
  return 'anonymous'
}

function isFunction(node: ts.Node): node is ts.FunctionLikeDeclaration {
  return (
    (ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isConstructorDeclaration(node) ||
      ts.isGetAccessorDeclaration(node) ||
      ts.isSetAccessorDeclaration(node)) &&
    node.body !== undefined
  )
}

/** Every function with a body, keyed by the names around it and its order among equal keys. */
function functionsOf(file: string, text: string): Fn[] {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
  const found: Fn[] = []
  const seen = new Map<string, number>()
  function visit(node: ts.Node, chain: string[]): void {
    let inner = chain
    if (isFunction(node)) {
      inner = [...chain, nameOf(node, source)]
      const path = inner.join(' > ')
      const count = (seen.get(path) ?? 0) + 1
      seen.set(path, count)
      const from = node.getStart(source)
      found.push({
        key: count === 1 ? path : `${path} #${count}`,
        from,
        to: node.end,
        startLine: source.getLineAndCharacterOfPosition(from).line + 1,
        endLine: source.getLineAndCharacterOfPosition(node.end).line + 1,
      })
    }
    ts.forEachChild(node, (child) => visit(child, inner))
  }
  visit(source, [])
  return found
}

/** The score of each function Biome finds above 1, by file and function key, run from `dir`. */
function scoresIn(dir: string, files: string[], reportFile: string): Map<string, number> {
  const scores = new Map<string, number>()
  if (files.length === 0) return scores
  const args = [
    'lint',
    `--config-path=${CONFIG}`,
    '--only=complexity/noExcessiveCognitiveComplexity',
  ]
  spawnCommand(BIOME, [...args, '--reporter=json', `--reporter-file=${reportFile}`, ...files], {
    cwd: dir,
    deadline: 60_000,
  })
  const report = Report.parse(JSON.parse(readFileSync(reportFile, 'utf8')))
  const parsed = new Map<string, { text: string; fns: Fn[] }>()
  for (const { message, location } of report.diagnostics) {
    const score = Number(message.match(/complexity of (\d+)/)?.[1])
    if (!Number.isInteger(score)) continue
    let entry = parsed.get(location.path)
    if (entry === undefined) {
      const text = readFileSync(join(dir, location.path), 'utf8')
      entry = { text, fns: functionsOf(location.path, text) }
      parsed.set(location.path, entry)
    }
    const at = lineOffset(entry.text, location.start.line, location.start.column)
    const fn = innermost(entry.fns, at)
    if (fn !== undefined) scores.set(`${location.path}\n${fn.key}`, score)
  }
  return scores
}

function lineOffset(text: string, line: number, column: number): number {
  const before = text.split('\n').slice(0, line - 1)
  return before.reduce((sum, row) => sum + row.length + 1, 0) + column - 1
}

function innermost(fns: Fn[], at: number): Fn | undefined {
  return fns
    .filter((fn) => fn.from <= at && at < fn.to)
    .toSorted((a, b) => a.to - a.from - (b.to - b.from))[0]
}

/** A touched function fails when it is above the maximum and is new or higher than at the base. */
export function fails(row: Row): boolean {
  return row.head > MAX_COMPLEXITY && (row.base === undefined || row.head > row.base)
}

/** Every touched function that Biome scores above 1, with its score at the base and at the head. */
export function complexityRows(args: {
  root: string
  changed: Changed
  baseDir: string
  scratch: string
}): Row[] {
  const { root, changed, baseDir, scratch } = args
  const files = [...changed.keys()]
  const head = scoresIn(root, files, join(scratch, 'head.json'))
  const base = scoresIn(
    baseDir,
    files.filter((file) => existsSync(join(baseDir, file))),
    join(scratch, 'base.json'),
  )
  const rows: Row[] = []
  for (const file of files) {
    const ranges = changed.get(file) ?? []
    const baseKeys = new Set(
      functionsOf(file, readBase(baseDir, file)).map((fn) => `${file}\n${fn.key}`),
    )
    for (const fn of functionsOf(file, readFileSync(join(root, file), 'utf8'))) {
      const key = `${file}\n${fn.key}`
      const score = head.get(key)
      if (score === undefined || !touches(ranges, fn.startLine, fn.endLine)) continue
      const before = base.get(key) ?? (baseKeys.has(key) ? 1 : undefined)
      rows.push({ file, name: fn.key, line: fn.startLine, base: before, head: score })
    }
  }
  return rows
}

function readBase(baseDir: string, file: string): string {
  const path = join(baseDir, file)
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}
