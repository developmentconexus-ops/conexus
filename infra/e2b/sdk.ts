import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join, matchesGlob } from 'node:path'
import { DECLARED } from '../../packages/app/src/check/declarations.ts'

/** What the template copies into /opt/conexus/packages: the SDK, its contract and the kit whose types the SDK reads. */
export const SDK_FOLDERS = ['packages/app', 'packages/app-contract', 'packages/connectors'] as const
/** The template's own ignore patterns; E2B adds the repository's `.dockerignore` to them. */
export const IGNORED = ['**/node_modules']

function ignoredBy(root: string): string[] {
  const dockerignore = readFileSync(join(root, '.dockerignore'), 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'))
  return [...dockerignore, ...IGNORED]
}

/** The three `package.json` the template rewrites to name the declarations (check/declarations.ts); `manifestDigests` proves them apart from the rest. */
const REWRITTEN = DECLARED.map(({ manifest }) => `packages/${manifest}`)

/** The commit's SDK files the template must carry unchanged: the tracked ones the ignore patterns let through. */
export function sdkFiles(root: string): string[] {
  const patterns = ignoredBy(root)
  const tracked = execFileSync('git', ['ls-files', '-z', '--', ...SDK_FOLDERS], {
    cwd: root,
    encoding: 'utf8',
  })
    .split('\0')
    .filter(Boolean)
  return tracked.filter(
    (file) =>
      !REWRITTEN.includes(file) &&
      !patterns.some((pattern) => matchesGlob(file, pattern) || matchesGlob(file, `${pattern}/**`)),
  )
}

/** One line of `sha256sum`'s output: the digest of the bytes, two spaces, the path as the machine prints it. */
function digestLine(file: string, bytes: Buffer | string): string {
  return `${createHash('sha256').update(bytes).digest('hex')}  ${file}\n`
}

/** `sha256sum`'s lines for the files, each path relative to `root`, as the machine prints them. */
export function digests(root: string, files: readonly string[]): string {
  return files.map((file) => digestLine(file, readFileSync(join(root, file)))).join('')
}

/** The same lines for the three rewritten `package.json`: the commit's file with the template's rewrite applied, which is what the machine must hold byte for byte. */
export function manifestDigests(root: string): string {
  return DECLARED.map(({ manifest, rewrite }) => {
    const file = `packages/${manifest}`
    return digestLine(file, rewrite(readFileSync(join(root, file), 'utf8')))
  }).join('')
}
