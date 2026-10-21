import { z } from 'zod'
import type { FailureLog } from '../../platform/failure.ts'
import { runGit } from './exec.ts'

/** A commit id, made only by parsing what git printed (code C23). */
export const Sha = z
  .string()
  .regex(/^[0-9a-f]{40}$/)
  .brand('Sha')
export type Sha = z.infer<typeof Sha>

export const MAIN = 'refs/heads/main'
export const MAX_FILES = 2_000
export const MAX_BYTES = 64 * 1024 * 1024

export type Context = {
  dir: string
  timeoutMs: number
  gcEvery: number
  log: FailureLog
}

export function git(
  context: Context,
  args: readonly string[],
  options: { input?: Uint8Array | string; answers?: readonly number[]; maxOutput?: number } = {},
) {
  return runGit(['--git-dir', context.dir, ...args], {
    timeoutMs: context.timeoutMs,
    maxOutput: options.maxOutput ?? MAX_BYTES,
    ...options,
  })
}

export async function text(context: Context, args: readonly string[]): Promise<string> {
  return (await git(context, args)).stdout.toString('utf8').trim()
}

/** The commit a ref names, or null when there is none: git exits 1, silently, for "no". */
export async function readRef(context: Context, ref: string): Promise<Sha | null> {
  const found = await git(context, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`], {
    answers: [1],
  })
  return found.code === 0 ? Sha.parse(found.stdout.toString('utf8').trim()) : null
}

async function succeeds(context: Context, args: readonly string[]): Promise<boolean> {
  return (await git(context, args, { answers: [1] })).code === 0
}

/** Whether `main` holds this commit in its history: the only commits the source view reads. */
export async function inMain(context: Context, sha: Sha): Promise<boolean> {
  return (
    (await succeeds(context, ['rev-parse', '--verify', '--quiet', `${sha}^{commit}`])) &&
    (await succeeds(context, ['merge-base', '--is-ancestor', sha, MAIN]))
  )
}
