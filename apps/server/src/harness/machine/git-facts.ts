import { z } from 'zod'

/** A commit id, made only by parsing what git printed (code C23). */
export const Sha = z
  .string()
  .regex(/^[0-9a-f]{40}$/)
  .brand('Sha')
export type Sha = z.infer<typeof Sha>

export const MAX_FILES = 2_000
export const MAX_BYTES = 64 * 1024 * 1024

/** The ref a machine's bundle carries its one commit under. */
export const CANDIDATE_REF = 'refs/conexus/candidate'
/** The author of the commits the Builder's machine and the Hub make, as `git -c` options. */
export const BUILDER_IDENTITY = [
  '-c',
  'user.name=Conexus Builder',
  '-c',
  'user.email=builder@conexus.invalid',
]
