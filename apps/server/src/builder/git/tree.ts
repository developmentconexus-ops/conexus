import type { Context, Sha } from './context.ts'
import { git, inMain, MAX_BYTES, MAX_FILES, present } from './context.ts'

/** Why a bundle from a machine is not taken: it is the agent's output, treated as hostile (S2). */
export type SaveRefusal =
  | 'two-commits'
  | 'wrong-parent'
  | 'not-regular'
  | 'too-many-files'
  | 'too-large'
  | 'corrupt'

export type TreeFile = { path: string; bytes: number }
export type FileRead =
  | { kind: 'text'; text: string }
  | { kind: 'not-found' }
  | { kind: 'not-text' }
  | { kind: 'too-large' }

const REGULAR = new Set(['100644', '100755'])
const UNSAFE_SEGMENTS = new Set(['', '.', '..', '.git'])

type Entry = { mode: string; type: string; oid: string; bytes: number; path: string }

async function entries(context: Context, args: readonly string[]): Promise<Entry[]> {
  const listed = await git(context, ['ls-tree', '-l', '-z', '--full-tree', ...args])
  return listed.stdout
    .toString('utf8')
    .split('\0')
    .filter(Boolean)
    .map((line) => {
      const tab = line.indexOf('\t')
      const [mode = '', type = '', oid = '', size = ''] = line.slice(0, tab).split(/ +/)
      return { mode, type, oid, bytes: Number(size) || 0, path: line.slice(tab + 1) }
    })
}

/** The first reason the tree behind `ref` is not an app's files: a link, a count, a size or a path. */
export async function inspectTree(context: Context, ref: string): Promise<SaveRefusal | null> {
  const files = await entries(context, ['-r', ref])
  if (files.some((file) => file.type !== 'blob' || !REGULAR.has(file.mode))) return 'not-regular'
  if (files.length > MAX_FILES) return 'too-many-files'
  if (files.reduce((sum, file) => sum + file.bytes, 0) > MAX_BYTES) return 'too-large'
  const unsafe = files.some((file) =>
    file.path.split('/').some((part) => UNSAFE_SEGMENTS.has(part)),
  )
  return unsafe ? 'corrupt' : null
}

export async function treeOf(context: Context, sha: Sha): Promise<TreeFile[] | null> {
  if (!(await present(context)) || !(await inMain(context, sha))) return null
  const files = await entries(context, ['-r', sha])
  return files.map(({ path, bytes }) => ({ path, bytes }))
}

/** A file of a version as text; its size is read from the tree first, so a large file is never read. */
export async function fileOf(
  context: Context,
  { sha, path, maxBytes }: { sha: Sha; path: string; maxBytes: number },
): Promise<FileRead> {
  const unsafe = path.includes('\0') || path.split('/').some((part) => UNSAFE_SEGMENTS.has(part))
  if (unsafe || !(await present(context)) || !(await inMain(context, sha))) {
    return { kind: 'not-found' }
  }
  const found = (await entries(context, [sha, '--', path])).find((entry) => entry.path === path)
  if (found === undefined || found.type !== 'blob') return { kind: 'not-found' }
  if (found.bytes > maxBytes) return { kind: 'too-large' }
  const blob = (await git(context, ['cat-file', 'blob', found.oid], { maxOutput: maxBytes })).stdout
  try {
    return blob.includes(0)
      ? { kind: 'not-text' }
      : { kind: 'text', text: new TextDecoder('utf-8', { fatal: true }).decode(blob) }
  } catch {
    return { kind: 'not-text' }
  }
}
