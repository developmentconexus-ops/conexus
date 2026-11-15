// Defect: a document names, between backticks, a repository path no file has, so the next reader or
// agent goes looking for code that left (the audit of 2026-11-14 found `conversation/turn-log.ts`
// in the boundaries, gone since 2026-10-25). A path is a backticked word with a slash and a file
// extension; it resolves when some file of the repository ends with it, at a folder boundary, so
// `copies/public.ts` and `hub/copies/public.ts` both name the same file. Refusals are proved by
// planting each one in check-docs-paths.test.ts.
// Revalidate by 2027-05-14, or when a reference checkout the documents cite is added or renamed.
import { dirname, join, normalize } from 'node:path'
import { withoutFences } from './check-docs-method.ts'

/** Dated records and planned code: what they name was true then, or is yet to be written. */
const RECORDS: readonly [RegExp, string][] = [
  [/^docs\/approvals\.md$/, 'the founder-word log names what stood on each date'],
  [/^docs\/decisions\//, 'a decision is a dated record of its reason'],
  [/^docs\/steps\//, 'a card plans code that does not exist until its step closes'],
]

/** A path that is not the repository's. Each line says whose it is. */
const NOT_OURS: readonly [RegExp, string][] = [
  [/^@[^/]+\//, 'a scoped npm package'],
  [/^node_modules\//, 'an installed package'],
  [/(^|\/)dist\//, 'a package build'],
  [/\.(m?js|d\.ts)$/, 'a library build: the repository writes TypeScript'],
  [/^(mastracode|worker|space|client|connector-builder-ui|config-based)\//, 'a reference checkout'],
  [/^apps\/hub\//, 'the old repository, frozen at e0353c36'],
  [/^src\/lib\//, 'a reference checkout (Open WebUI)'],
  [
    /^packages\/(core|playground|playground-ui|email)\//,
    'a reference checkout (Mastra, Documenso)',
  ],
  [
    /^(agent-controller|agent\/goal|tools\/builtin|evals\/run|datasets\/experiment|environment\/build|auth\/storage)/,
    "a folder of Mastra's core or of Mastra Code",
  ],
  [
    /^(shared|server)\/|^src\/conexus\/|^\.conexus\//,
    "a file of a generated app, which the Hub's repository does not hold",
  ],
]

const EXTENSION = /\.(?:ts|tsx|md|json|cjs|mjs|js|sql|ya?ml|grit|svg|css|html|toml|sh)$/
/** What a prose path never holds: a space, a glob, a placeholder, a URL or a second path. */
const NOT_A_PATH = /[\s<>*{}$…|()=,;'"[\]]|:\/\//
const SPAN = /`([^`\n]+)`/g
const LINE_RANGE = /:\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*$/

/** Every folder-boundary suffix of each file, with at least a folder and a name. */
export function suffixesOf(files: readonly string[]): ReadonlySet<string> {
  const suffixes = new Set<string>()
  for (const file of files) {
    const parts = file.split('/')
    for (let at = 0; at < parts.length - 1; at += 1) suffixes.add(parts.slice(at).join('/'))
  }
  return suffixes
}

function pathsOf(text: string): string[] {
  const paths: string[] = []
  for (const [, span = ''] of withoutFences(text).matchAll(SPAN)) {
    const path = span.trim().replace(LINE_RANGE, '').replace(/#.*$/, '').replace(/^\.\//, '')
    if (path.includes('/') && EXTENSION.test(path) && !NOT_A_PATH.test(path)) paths.push(path)
  }
  return paths
}

/** The backticked paths of each document that no file of the repository ends with. */
export function pathProblems(
  texts: ReadonlyMap<string, string>,
  suffixes: ReadonlySet<string>,
  fail: (name: string, file: string, detail: string) => void,
): void {
  for (const [file, text] of texts) {
    if (RECORDS.some(([pattern]) => pattern.test(file))) continue
    for (const path of new Set(pathsOf(text))) {
      const found = path.startsWith('../')
        ? suffixes.has(normalize(join(dirname(file), path)))
        : suffixes.has(path)
      if (!found && !NOT_OURS.some(([pattern]) => pattern.test(path)))
        fail('path-missing', file, path)
    }
  }
}
