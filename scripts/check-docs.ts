// Defect: a document grows past its ceiling, hides from docs/index.md, holds a link that goes
// nowhere, repeats or cites a rule that does not exist, names a retired process, or a second step
// card waits in docs/steps/, or a skill's name leaves its folder's (delivery L5, L24); the method's
// own refusals are in check-docs-method.ts. A package a workspace depends on has no row in the
// stack map, a row repeats or names nothing the repository uses, or a workspace pattern is one the
// check cannot read.
// A link is inline or a reference definition, and a fragment must name a heading of the Markdown
// file it points to, an ATX or a Setext heading, read by its rendered text. Refusals are proved by planting each one in check-docs.test.ts.
// Revalidate by 2027-04-13, or when the list in delivery L24 changes.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, join, relative, resolve } from 'node:path'
import { parse } from 'yaml'
import { z } from 'zod'
import { methodProblems, RULE_DEFINITION, withoutFences, words } from './check-docs-method.ts'

const root = resolve(process.argv[2] ?? '.')

const CEILINGS: readonly (readonly [RegExp, number])[] = [
  [/^AGENTS\.md$/, 400],
  [/^docs\/index\.md$/, 500],
  [/^docs\/roadmap\.md$/, 1600],
  [/^docs\/architecture\.md$/, 2500],
  [/^docs\/guides\/code\.md$/, 3500],
  [/^docs\/guides\/security\.md$/, 3000],
  [/^docs\/guides\/(data|design)\.md$/, 2500],
  [/^docs\/guides\/(testing|web)\.md$/, 2000],
  [/^docs\/guides\/delivery\.md$/, 1800],
  [/^docs\/decisions\/[^/]+\.md$/, 350],
  [/^docs\/how-to\/[^/]+\.md$/, 800],
  [/^\.agents\/skills\/[^/]+\/SKILL\.md$/, 600],
  [/^\.agents\/skills\/[^/]+\/references\/[^/]+\.md$/, 1500],
]
const STEP_PAGE_CEILING = 600
const RETIRED = [
  /\bwave\b/i,
  /\bN[0-5]\b/,
  /\breceipts?\b/i,
  /\bFactory (?:review|robot)/i,
  /\bCodex review\b/i,
  /\bconexus-spec\b/,
  /\bconexus-prove\b/,
  /\bconexus-development\b/,
  /\bdossier\b/i,
]
const RETIRED_HOME = 'docs/guides/delivery.md'
const RULE_ID = /\b([CDLSTVW]\d{1,3})\b/g

function walk(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    if (name === 'node_modules' || name === '.git') return []
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

const files = [
  ...['AGENTS.md', 'README.md', 'CLAUDE.md'].map((name) => join(root, name)),
  ...walk(join(root, 'docs')),
  ...walk(join(root, '.agents/skills')),
]
  .filter((path) => path.endsWith('.md') && existsSync(path))
  .map((path) => relative(root, path))
  .sort()

const problems: string[] = []
function fail(name: string, file: string, detail: string) {
  problems.push(`${name}: ${file}: ${detail}`)
}

function withoutCode(text: string): string {
  return withoutFences(text).replace(/`[^`\n]*`/g, '')
}

function body(file: string, text: string): string {
  if (!file.endsWith('/SKILL.md')) return text
  return text.replace(/^---\n[\s\S]*?\n---\n/, '')
}

function checkCeiling(file: string, text: string) {
  const ceiling = CEILINGS.find(([pattern]) => pattern.test(file))?.[1]
  if (ceiling !== undefined) {
    const count = words(body(file, text))
    if (count > ceiling)
      fail('document-too-long', file, `${count} words, the ceiling is ${ceiling}`)
  }
  if (/^docs\/steps\//.test(file)) {
    const page = text.match(/^## A página do fundador\n([\s\S]*?)(?=^## )/m)?.[1] ?? ''
    if (words(page) > STEP_PAGE_CEILING) {
      fail(
        'founder-page-too-long',
        file,
        `${words(page)} words, the ceiling is ${STEP_PAGE_CEILING}`,
      )
    }
  }
}

function checkSkillHeader(file: string, text: string) {
  if (!file.endsWith('/SKILL.md')) return
  const header = text.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? ''
  const fields: unknown = parse(header)
  const name =
    typeof fields === 'object' && fields !== null && 'name' in fields ? fields.name : undefined
  const folder = basename(dirname(file))
  if (name !== folder)
    fail('skill-name-differs-from-folder', file, `${String(name)} is not ${folder}`)
}

const INLINE_LINK = /\]\(\s*<?([^)\s>]+)>?(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g
const REFERENCE_DEFINITION = /^ {0,3}\[[^\]^][^\]]*\]:[ \t]*<?([^\s>]+)>?/gm

const ATX_HEADING = /^ {0,3}#{1,6}[ \t]+(.+?)(?:[ \t]+#+)?[ \t]*$/
const SETEXT_UNDERLINE = /^ {0,3}(?:=+|-+)[ \t]*$/
const NOT_A_PARAGRAPH = /^(?: {4}|\s*(?:#|>|[-+*][ \t]|\d+[.)][ \t]|(?:=+|-+)[ \t]*$))/

/** The text of each heading, ATX or Setext, as written. A Setext underline needs a paragraph line directly above it. */
function headingTitles(text: string): string[] {
  const lines = withoutFences(text.replace(/^---\n[\s\S]*?\n---\n/, '')).split('\n')
  const titles: string[] = []
  lines.forEach((line, i) => {
    const atx = line.match(ATX_HEADING)?.[1]
    if (atx !== undefined) titles.push(atx)
    const above = lines[i - 1]
    if (SETEXT_UNDERLINE.test(line) && above?.trim() && !NOT_A_PARAGRAPH.test(above)) {
      titles.push(above.trim())
    }
  })
  return titles
}

/** Emphasis, code and link markup gone; an underscore inside a word, as in `snake_case`, is text. */
function renderedText(title: string): string {
  return title
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .split(/(`[^`]*`)/)
    .map((part, i) =>
      i % 2 === 1
        ? part.replace(/`/g, '')
        : part
            .replace(/[*~]/g, '')
            .replace(/(?<![\p{L}\p{N}])_+(?=[^\s_])/gu, '')
            .replace(/(?<=[^\s_])_+(?![\p{L}\p{N}])/gu, ''),
    )
    .join('')
}

/** The ids GitHub gives a document's headings: lower case, punctuation gone, repeats numbered. */
function headingIds(text: string): Set<string> {
  const ids = new Set<string>()
  const seen = new Map<string, number>()
  for (const title of headingTitles(text)) {
    const slug = renderedText(title)
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\p{M} _-]/gu, '')
      .replace(/ /g, '-')
    const repeats = seen.get(slug) ?? 0
    seen.set(slug, repeats + 1)
    ids.add(repeats === 0 ? slug : `${slug}-${repeats}`)
  }
  return ids
}

/** A fragment with a malformed escape, such as `50%`, names no heading: GitHub drops `%` from ids. */
function decoded(fragment: string): string {
  try {
    return decodeURIComponent(fragment)
  } catch {
    return fragment
  }
}

function checkLinks(file: string, text: string) {
  const code = withoutCode(text)
  const targets = [...code.matchAll(INLINE_LINK), ...code.matchAll(REFERENCE_DEFINITION)]
  for (const match of targets) {
    const [path = '', fragment] = (match[1] ?? '').split('#')
    if (/^[a-z][a-z0-9+.-]*:/i.test(path)) continue
    const target = path === '' ? resolve(root, file) : resolve(root, dirname(file), path)
    if (!existsSync(target)) fail('broken-link', file, path)
    else if (fragment && target.endsWith('.md') && statSync(target).isFile()) {
      const id = decoded(fragment).toLowerCase()
      if (!headingIds(readFileSync(target, 'utf8')).has(id)) {
        fail('broken-fragment', file, `${path}#${fragment}`)
      }
    }
  }
}

function indexedTargets(): string[] {
  const index = readFileSync(join(root, 'docs/index.md'), 'utf8')
  return [...withoutCode(index).matchAll(INLINE_LINK)].map((match) =>
    relative(root, resolve(root, 'docs', (match[1] ?? '').split('#')[0] ?? '')),
  )
}

function checkIndex() {
  if (!existsSync(join(root, 'docs/index.md'))) return
  const targets = indexedTargets()
  for (const file of files) {
    if (!/^(docs|\.agents\/skills)\//.test(file) || file === 'docs/index.md') continue
    const covered = targets.some((target) => file === target || file.startsWith(`${target}/`))
    if (!covered) fail('not-in-index', file, 'docs/index.md has no line for it')
  }
}

function checkRules(texts: ReadonlyMap<string, string>) {
  const defined = new Map<string, string>()
  for (const [file, text] of texts) {
    if (!/^docs\/guides\//.test(file)) continue
    for (const line of text.split('\n')) {
      const id = line.match(RULE_DEFINITION)?.[1]
      if (id === undefined) continue
      const first = defined.get(id)
      if (first !== undefined) fail('rule-defined-twice', file, `${id} is also in ${first}`)
      else defined.set(id, file)
    }
  }
  for (const [file, text] of texts) {
    for (const match of withoutCode(text).matchAll(RULE_ID)) {
      const id = match[1] ?? ''
      if (!defined.has(id)) fail('rule-missing', file, `${id} is cited and defined nowhere`)
    }
  }
}

function checkRetired(file: string, text: string) {
  if (file === RETIRED_HOME) return
  for (const pattern of RETIRED) {
    const hit = text.match(pattern)?.[0]
    if (hit !== undefined) fail('retired-name', file, hit)
  }
}

function checkSteps() {
  const cards = files.filter((file) => /^docs\/steps\/[^/]+\.md$/.test(file))
  if (cards.length > 1) fail('second-card', 'docs/steps', cards.join(', '))
}

const STACK = 'docs/reference/stack.md'
/** What the repository runs that no package.json declares: the database, the runtime, the images and the Hub image's Google sign-in binary. */
const OTHER_PIECES = ['PostgreSQL', 'Node', 'Docker', 'cloudflared', 'CLIProxyAPI']

const SECTIONS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']
const Manifest = z.looseObject({
  name: z.string().optional(),
  workspaces: z.array(z.string()).optional(),
  ...Object.fromEntries(
    SECTIONS.map((section) => [section, z.record(z.string(), z.string()).optional()]),
  ),
})
type Manifest = z.infer<typeof Manifest>

function manifest(dir: string): Manifest {
  return Manifest.parse(JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')))
}

/** The root and each workspace: a folder, or `folder/*` read as every folder under it with a package.json. */
function manifests(): Manifest[] {
  const top = manifest(root)
  const dirs = (top.workspaces ?? []).flatMap((pattern) => {
    const parent = pattern.endsWith('/*') ? pattern.slice(0, -2) : undefined
    if (/[*!?[{]/.test(parent ?? pattern)) {
      fail('stack-workspace-unread', 'package.json', pattern)
      return []
    }
    if (parent === undefined) return [join(root, pattern)]
    const folder = join(root, parent)
    return existsSync(folder)
      ? readdirSync(folder)
          .map((name) => join(folder, name))
          .filter((dir) => existsSync(join(dir, 'package.json')))
      : []
  })
  return [top, ...dirs.map(manifest)]
}

const TABLE_RULE = /^\|(?:\s*:?-+:?\s*\|)+\s*$/

/** The first cell of each table row, its code marks gone; a header is the line above a rule. */
function stackRows(text: string): string[] {
  const lines = withoutFences(text).split('\n')
  return lines
    .filter((line, i) => {
      const next = lines[i + 1] ?? ''
      return line.startsWith('|') && !TABLE_RULE.test(line) && !TABLE_RULE.test(next)
    })
    .map((line) => (line.split('|')[1] ?? '').replace(/`/g, '').trim())
}

function checkStack() {
  if (!existsSync(join(root, 'package.json'))) return
  const all = manifests()
  const own = new Set(all.map((each) => each.name))
  const pieces = new Set(OTHER_PIECES)
  for (const each of all) {
    for (const section of SECTIONS) {
      const declared = each[section]
      if (typeof declared !== 'object' || declared === null) continue
      for (const name of Object.keys(declared)) if (!own.has(name)) pieces.add(name)
    }
  }
  const path = join(root, STACK)
  const listed = existsSync(path) ? stackRows(readFileSync(path, 'utf8')) : []
  const rows = new Set(listed)
  for (const [i, row] of listed.entries()) {
    if (listed.indexOf(row) !== i) fail('stack-row-twice', STACK, row)
  }
  for (const piece of pieces) {
    if (!rows.has(piece)) fail('stack-row-missing', STACK, piece)
  }
  for (const row of rows) {
    if (!pieces.has(row)) fail('stack-row-unknown', STACK, row)
  }
}

const texts = new Map(files.map((file) => [file, readFileSync(join(root, file), 'utf8')]))
for (const [file, text] of texts) {
  checkCeiling(file, text)
  checkSkillHeader(file, text)
  checkLinks(file, text)
  checkRetired(file, text)
}
checkIndex()
checkRules(texts)
problems.push(...methodProblems(texts))
checkSteps()
checkStack()

if (problems.length > 0) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`check-docs: ${files.length} documents ok`)
