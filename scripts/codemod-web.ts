// Defect: apps/web/src/builder/ is split by hand, so the new tree and the import paths drift (card "Uma sala e os nomes
// certos", U3). Run on the base it moves each file to its owner's folder, lists it in scripts/codemod-web.json and rewrites every import; run on
// the result it finds nothing to move. `--plan` writes the list only. Revalidate by 2027-05-24, or when a step moves web files.
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { posix } from 'node:path'
import { z } from 'zod'
import type { Named } from './codemod-web-imports.ts'
import type { Move } from './codemod-web-plan.ts'
import {
  againstDirection,
  folderMoves,
  graphOf,
  OLD,
  plan,
  refuseCollisions,
  SRC,
} from './codemod-web-plan.ts'
import type { Surface } from './codemod-web-rewrite.ts'
import { doorText, rewritten } from './codemod-web-rewrite.ts'

const LIST = 'scripts/codemod-web.json'
const Moves = z.object({
  moves: z.array(z.object({ from: z.string(), to: z.string() })),
})
// The records keep the paths they were written with; a guide and a skill change only in a step's closing (delivery L20).
const KEPT = /^(docs\/(steps|approvals|decisions|guides)\/|\.agents\/)/
const BINARY = /\.(png|jpe?g|svg|ico|woff2?|zip)$/
const WEB_DOCS = new Set([
  'docs/explanation/jornadas.md',
  'docs/reference/movimento.md',
  'docs/reference/telas.md',
])
const SHORT =
  /(?<![\w/.-])(?:builder\/)?(?:conversation|agents|assistant|automations|tools|model-accounts|observational-memory|preview|source)\/[\w.$/-]*\.\w+/g

function git(...args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 })
}

function listed(...where: string[]): string[] {
  return git('ls-files', '-z', '--', ...where)
    .split('\0')
    .filter(Boolean)
}

function citedPaths(text: string, file: string, moves: ReadonlyMap<string, string>): string {
  if (WEB_DOCS.has(file))
    text = text.replace(SHORT, (cited) => {
      const moved = moves.get(`${OLD}/${cited.replace(/^builder\//, '')}`)
      return moved === undefined ? cited : moved.slice(`${SRC}/`.length)
    })
  const bare = file.startsWith('apps/web/') || file === 'knip.json'
  const pattern = bare
    ? /(?:apps\/web\/)?src\/builder\/[\w.$/-]*\w/g
    : /apps\/web\/src\/builder\/[\w.$/-]*\w/g
  const folders = [...folderMoves()]
  return text.replace(pattern, (cited) => {
    const full = cited.startsWith('apps/web/') ? cited : `apps/web/${cited}`
    const folder = folders.find(([from]) => full === from || full.startsWith(`${from}/`))
    const moved =
      moves.get(full) ?? (folder === undefined ? undefined : full.replace(folder[0], folder[1]))
    if (moved === undefined) return cited
    return cited.startsWith('apps/web/') ? moved : moved.slice('apps/web/'.length)
  })
}

function rewriteCitations(moves: readonly Move[], doors: Iterable<string>): void {
  const cited = new Map(moves.map((move) => [move.from, move.to]))
  for (const file of listed('.').concat([...doors])) {
    const skipped = KEPT.test(file) || file.startsWith('scripts/codemod-web') || BINARY.test(file)
    if (skipped || !existsSync(file) || !lstatSync(file).isFile()) continue
    const text = readFileSync(file, 'utf8')
    const next = citedPaths(text, file, cited)
    if (next !== text) writeFileSync(file, next)
  }
}

function checkApplied(): void {
  const { moves } = Moves.parse(JSON.parse(readFileSync(LIST, 'utf8')))
  const missing = moves.filter((move) => !existsSync(move.to))
  if (missing.length > 0)
    throw new Error(
      `already moved, but ${missing.length} files of the list are missing: ${missing[0]?.to}`,
    )
  console.log(`${OLD}/ is gone and the ${moves.length} files of ${LIST} are in place`)
}

function writeList(moves: readonly Move[], surface: Surface): void {
  const doors = Object.fromEntries(
    [...surface].map(([subject, names]) => [`${subject}/public.ts`, [...names.keys()].sort()]),
  )
  writeFileSync(LIST, `${JSON.stringify({ moves, doors }, null, 2)}\n`)
}

function main(): void {
  if (!existsSync(OLD)) {
    checkApplied()
    return
  }
  const files = listed('apps/web')
  const graph = graphOf(files)
  const moves = plan(files)
  const newPath = new Map(moves.map((move) => [move.from, move.to]))
  const against = againstDirection(graph, (file) => newPath.get(file) ?? file)
  if (against.length > 0)
    throw new Error(`the table leaves imports against the direction:\n${against.join('\n')}`)
  const context = {
    graph,
    newOf: (file: string) => newPath.get(file) ?? file,
    surface: new Map<string, Map<string, Named>>(),
  }
  const changes = new Map<string, string>()
  for (const file of graph.refs.keys()) {
    const text = rewritten(context, file)
    if (text !== graph.texts.get(file) || newPath.has(file)) changes.set(file, text)
  }
  writeList(moves, context.surface)
  refuseCollisions(moves)
  if (process.argv.includes('--plan')) return
  for (const move of moves) {
    mkdirSync(posix.dirname(move.to), { recursive: true })
    git('mv', move.from, move.to)
  }
  for (const door of graph.doors.keys()) git('rm', '-q', '-f', door)
  for (const [from, text] of changes) writeFileSync(context.newOf(from), text)
  const doors = new Map(
    [...context.surface].map(([subject, names]) => [
      `${subject}/public.ts`,
      doorText(names, `${subject}/public.ts`),
    ]),
  )
  for (const [door, text] of doors) {
    mkdirSync(posix.dirname(door), { recursive: true })
    writeFileSync(door, text)
  }
  rewriteCitations(moves, doors.keys())
  rmSync(OLD, { recursive: true, force: true })
  spawnSync('npx', ['biome', 'check', '--write', '--no-errors-on-unmatched', 'apps/web', LIST], {
    stdio: 'inherit',
  })
}

main()
