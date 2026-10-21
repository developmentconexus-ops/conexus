import { z } from 'zod'
import { Secret } from './secret.ts'

/** The bucket in Cloudflare R2 that holds the copy of each app's Git (decision 0051). */
export const GitCopyBucket = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/)
  .brand('GitCopyBucket')
export type GitCopyBucket = z.infer<typeof GitCopyBucket>

/** The bucket's own key, `<access key id> <secret access key>`; `createGitCopy` reveals it into its client (S36). */
export type GitCopyKey = Secret<'GitCopyKey'>
export const GitCopyKey = {
  parse(value: string): GitCopyKey {
    if (!/^\S+\s+\S+$/.test(value)) throw new TypeError('git copy key not two words')
    return new Secret('GitCopyKey', value)
  },
}

/** Where the bare repositories live on the server, and the bucket that copies them. */
export const GitEnvironment = z.object({
  HUB_GIT_ROOT: z.string().startsWith('/'),
  HUB_GIT_COPY_BUCKET: GitCopyBucket,
  HUB_GIT_COPY_KEY_FILE: z.string().min(1),
})
