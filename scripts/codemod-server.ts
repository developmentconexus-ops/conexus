// Defect: apps/server/src/builder/ is split by hand into harness/ and agents/, so the new tree and the import paths drift
// (card "Uma sala e os nomes certos", U7). `node scripts/codemod-server.ts <area>` (g5a to g5f, the six pull requests) moves
// the files of that area's rows to their owner's folder with git mv, rewrites every import and every path a document cites,
// and lists the move in scripts/codemod-server.json; run again it finds nothing to move. `--plan` writes the list only.
// Revalidate by 2027-05-24, or when a step moves server files.
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { posix } from 'node:path'
import { z } from 'zod'
import type { Area } from './codemod-server-areas.ts'
import {
  AREAS,
  destinationOf,
  folderRows,
  isOld,
  OLD,
  ROWS_TOP,
  SRC,
} from './codemod-server-areas.ts'
import type { Graph, Move, Plan } from './codemod-server-plan.ts'
import {
  againstDirection,
  filesOf,
  graphOf,
  planOf,
  refuseCollisions,
} from './codemod-server-plan.ts'
import type { Surface } from './codemod-server-rewrite.ts'
import { doorText, relativeTo, rewritten } from './codemod-server-rewrite.ts'

const LIST = 'scripts/codemod-server.json'
const Listed = z.record(z.string(), z.array(z.object({ from: z.string(), to: z.string() })))
// The records keep the paths they were written with; a guide and a skill change only in a step's closing (delivery L20).
const KEPT = /^(docs\/(steps|approvals|decisions|guides)\/|\.agents\/)/
const BINARY = /\.(png|jpe?g|svg|ico|woff2?|zip|snapshot)$/
const CITED = /(?<![\w/.-])((?:apps\/server\/src\/|src\/|\$\{SERVER\}\/)?)builder\/([\w.$/-]*\w)/g
// The reference documents also name a file as the folder of builder/ holds it, `conversation/guard.ts`.
const SHORT_DOCS = /^docs\/(reference|explanation|how-to)\/|^docs\/architecture\.md$/
const SHORT = new RegExp(`(?<![\\w/.@-])(?:${ROWS_TOP.join('|')})/[\\w.$/-]*\\w`, 'g')
const READ_URL = /new URL\(\s*(['"`])(\.[^'"`]*)\1\s*,\s*import\.meta\.url/g

function git(...args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 28 })
}

function listed(...where: string[]): string[] {
  return git('ls-files', '-z', '--', ...where)
    .split('\0')
    .filter(Boolean)
}

function readList(): Record<string, Move[]> {
  return existsSync(LIST) ? Listed.parse(JSON.parse(readFileSync(LIST, 'utf8'))) : {}
}

function writeList(area: Area, moves: readonly Move[]): void {
  const list = { ...readList(), [area]: moves }
  const ordered = AREAS.flatMap((one) => (list[one] === undefined ? [] : [[one, list[one]]]))
  writeFileSync(LIST, `${JSON.stringify(Object.fromEntries(ordered), null, 2)}\n`)
}

/** A path a document or a comment cites, moved as its file or its folder moved; the others stay as written. */
function citedPaths(
  text: string,
  file: string,
  moves: ReadonlyMap<string, string>,
  area: Area,
): string {
  const folders = [...folderRows(area)].sort(([a], [b]) => b.length - a.length)
  const movedOf = (full: string): string | undefined => {
    const folder = folders.find(([from]) => full === from || full.startsWith(`${from}/`))
    return (
      moves.get(full) ?? (folder === undefined ? undefined : full.replace(folder[0], folder[1]))
    )
  }
  const whole = text.replace(CITED, (cited, prefix: string, rest: string) => {
    const moved = movedOf(`${OLD}/${rest}`)
    return moved === undefined ? cited : `${prefix}${moved.slice(SRC.length + 1)}`
  })
  if (!SHORT_DOCS.test(file)) return whole
  return whole.replace(SHORT, (cited) => {
    const moved = movedOf(`${OLD}/${cited}`)
    return moved === undefined ? cited : moved.slice(SRC.length + 1)
  })
}

function rewriteCitations(plan: Plan, area: Area, skip: ReadonlySet<string>): void {
  const cited = new Map(plan.moves.map((move) => [move.from, move.to]))
  for (const file of listed('.')) {
    const skipped =
      KEPT.test(file) || file.startsWith('scripts/codemod-server') || BINARY.test(file)
    if (skipped || skip.has(file) || !existsSync(file) || !lstatSync(file).isFile()) continue
    const text = readFileSync(file, 'utf8')
    const next = citedPaths(text, file, cited, area)
    if (next !== text) writeFileSync(file, next)
  }
}

/** A path a moved file reads by `new URL(…, import.meta.url)` follows its target, which moves with it or stays. */
function rewriteReads(file: string, text: string, newOf: (file: string) => string): string {
  const at = newOf(file)
  return text.replace(READ_URL, (read, quote: string, path: string) => {
    const target = posix.normalize(posix.join(posix.dirname(file), path.replace(/\$\{.*$/, '')))
    const there = newOf(target)
    if (path.includes('${')) {
      const beside =
        posix.relative(posix.dirname(at), there) === posix.relative(posix.dirname(file), target)
      if (!beside) throw new Error(`${file} reads ${path}, whose folder no longer sits beside it`)
      return read
    }
    if (at === file && there === target) return read
    return read.replace(`${quote}${path}${quote}`, `${quote}${relativeTo(at, there)}${quote}`)
  })
}

function checkApplied(area: Area): void {
  const moves = readList()[area] ?? []
  if (moves.length === 0) throw new Error(`${area}: nothing to move and nothing listed in ${LIST}`)
  const missing = moves.filter((move) => !existsSync(move.to))
  if (missing.length > 0)
    throw new Error(
      `${area} is applied, but ${missing.length} files of the list are missing: ${missing[0]?.to}`,
    )
  console.log(`${area}: the ${moves.length} files of ${LIST} are in place`)
}

/** The text each file takes, its imports pointing at where the area leaves what they read. */
function rewrittenFiles(graph: Graph, plan: Plan, surface: Surface): Map<string, string> {
  const changes = new Map<string, string>()
  for (const file of graph.refs.keys()) {
    if (plan.removed.includes(file)) continue
    const text = rewriteReads(file, rewritten({ graph, plan, surface }, file), plan.newOf)
    if (text !== graph.texts.get(file) || plan.newOf(file) !== file) changes.set(file, text)
  }
  return changes
}

/** A door that stays but loses the names of the files that moved, written as the names it keeps. */
function trimmedDoors(graph: Graph, plan: Plan): Map<string, string> {
  const doors = new Map<string, string>()
  for (const [door, names] of graph.doors) {
    if (plan.kinds.get(door) !== 'trimmed') continue
    const kept = new Map([...names].filter(([, named]) => plan.newOf(named.file) === named.file))
    doors.set(door, doorText(kept, door))
  }
  return doors
}

function write(
  plan: Plan,
  changes: ReadonlyMap<string, string>,
  doors: ReadonlyMap<string, string>,
): void {
  for (const door of plan.removed) git('rm', '-q', '-f', door)
  for (const move of plan.moves) {
    mkdirSync(posix.dirname(move.to), { recursive: true })
    git('mv', move.from, move.to)
  }
  for (const [from, text] of changes) writeFileSync(plan.newOf(from), text)
  for (const [door, text] of doors) {
    mkdirSync(posix.dirname(door), { recursive: true })
    writeFileSync(door, text)
  }
}

function main(): void {
  const area = AREAS.find((one) => one === process.argv[2])
  if (area === undefined)
    throw new Error(`usage: node scripts/codemod-server.ts <${AREAS.join('|')}> [--plan]`)
  const files = listed('apps/server', 'packages', 'scripts', 'tests')
  if (!files.some((file) => isOld(file) && destinationOf(file)?.area === area)) {
    checkApplied(area)
    return
  }
  const plan = planOf(area, filesOf(files))
  const graph = graphOf(filesOf(files), (door) =>
    ['dissolved', 'trimmed'].includes(plan.kinds.get(door) ?? ''),
  )
  const against = againstDirection(graph, plan)
  if (against.length > 0)
    throw new Error(`the table leaves imports against the direction:\n${against.join('\n')}`)
  refuseCollisions(plan.moves)
  const surface: Surface = new Map()
  const changes = rewrittenFiles(graph, plan, surface)
  writeList(area, plan.moves)
  if (process.argv.includes('--plan')) return
  const made = new Map(
    [...surface].map(([subject, names]) => [
      `${subject}/public.ts`,
      doorText(names, `${subject}/public.ts`),
    ]),
  )
  const stays = trimmedDoors(graph, plan)
  for (const door of made.keys())
    if (existsSync(door)) throw new Error(`${door} exists: the area would overwrite a door`)
  write(plan, changes, new Map([...stays, ...made]))
  rewriteCitations(plan, area, new Set([...made.keys(), ...stays.keys()]))
  if (existsSync(OLD) && listed(OLD).length === 0) rmSync(OLD, { recursive: true, force: true })
  spawnSync(
    'npx',
    [
      'biome',
      'check',
      '--write',
      '--no-errors-on-unmatched',
      'apps/server',
      'scripts',
      'packages',
      'tests',
    ],
    { stdio: 'inherit' },
  )
}

main()
