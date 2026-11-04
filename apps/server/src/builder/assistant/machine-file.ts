import type { RequestContext } from '@mastra/core/request-context'
import type { WorkspaceFilesystem } from '@mastra/core/workspace'
import { FileNotFoundError } from '@mastra/core/workspace'
import { Failure } from '../../platform/failure.ts'
import { PathEscapesError } from '../machine/public.ts'

/**
 * Where a path the model or the person names lands in the conversation's folder, or why it does
 * not.
 */
export type Located =
  | { kind: 'FILE'; path: string; name: string; bytes: number }
  | { kind: 'OUTSIDE' | 'NOT_FOUND' }

/**
 * Finds one file of the conversation's folder, where the file tools put it: the filesystem
 * resolves the path (`/relatorio.md` is `relatorio.md` of the folder), refuses what leaves it (a
 * `..` or a symlink out, `PathEscapesError`) and measures it. A folder, or a path that does not
 * exist, is `NOT_FOUND`.
 */
export async function locate(files: WorkspaceFilesystem, path: string): Promise<Located> {
  try {
    const found = await files.stat(path)
    const abs = files.resolveAbsolutePath?.(path)
    if (found.type !== 'file' || abs === undefined) return { kind: 'NOT_FOUND' }
    return { kind: 'FILE', path: abs, name: found.name, bytes: found.size }
  } catch (error) {
    if (error instanceof FileNotFoundError) return { kind: 'NOT_FOUND' }
    if (error instanceof PathEscapesError) return { kind: 'OUTSIDE' }
    throw error
  }
}

/** Why a file of the conversation could not be read: the path finds none, or the machine is off. */
export type Unreadable = { kind: 'OUTSIDE' | 'NOT_FOUND' | 'MACHINE_UNAVAILABLE' }

/**
 * One file of the conversation's machine, for a tool to read: found as the file tools put it
 * (`locate`) and handed to `use` with the filesystem; the machine that is off, or that stops in the
 * middle, is `MACHINE_UNAVAILABLE`.
 */
export async function withFile<T>(
  machines: { serving(requestContext: RequestContext): WorkspaceFilesystem | undefined },
  requestContext: RequestContext | undefined,
  path: string,
  use: (files: WorkspaceFilesystem, found: Extract<Located, { kind: 'FILE' }>) => Promise<T>,
): Promise<T | Unreadable> {
  const files = requestContext === undefined ? undefined : machines.serving(requestContext)
  if (files === undefined) return { kind: 'MACHINE_UNAVAILABLE' }
  try {
    const found = await locate(files, path)
    if (found.kind !== 'FILE') return { kind: found.kind }
    return await use(files, found)
  } catch (error) {
    if (error instanceof Failure && error.code === 'MACHINE_UNAVAILABLE') {
      return { kind: 'MACHINE_UNAVAILABLE' }
    }
    throw error
  }
}
