import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join, matchesGlob } from 'node:path'

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

/** The commit's SDK files the template must carry: the tracked ones the ignore patterns let through. */
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
      !patterns.some((pattern) => matchesGlob(file, pattern) || matchesGlob(file, `${pattern}/**`)),
  )
}

/** `sha256sum`'s lines for the files, each path relative to `root`, as the machine prints them. */
export function digests(root: string, files: readonly string[]): string {
  return files
    .map((file) => {
      const digest = createHash('sha256')
        .update(readFileSync(join(root, file)))
        .digest('hex')
      return `${digest}  ${file}\n`
    })
    .join('')
}
