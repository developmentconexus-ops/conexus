import { randomBytes } from 'node:crypto'
import type { CloudflareAnswer, CloudflareApps, WorkerUpload } from './cloudflare.ts'
import { AppLoginKey, CloudflareApiUrl, CloudflareAppsToken, CloudflareName } from './config.ts'

// Nothing listens on the discard port, so a Hub that reaches Cloudflare without a double fails loudly.
export const NO_CLOUDFLARE_SERVER = 'http://127.0.0.1:9/client/v4'
export const TEST_ACCOUNT = 'a'.repeat(32)
export const TEST_NAMESPACE = 'conexus-apps-test'

/** The apps' part of a test configuration; the key and the token are fresh for each call. */
export function testAppsConfig(apiUrl = NO_CLOUDFLARE_SERVER) {
  return {
    appLoginKey: AppLoginKey.parse(randomBytes(32).toString('base64url')),
    cloudflareApiUrl: CloudflareApiUrl.parse(apiUrl),
    cloudflareAccountId: CloudflareName.parse(TEST_ACCOUNT),
    appsNamespace: CloudflareName.parse(TEST_NAMESPACE),
    cloudflareAppsToken: CloudflareAppsToken.parse(randomBytes(16).toString('hex')),
  }
}

type Call = 'upload' | 'remove' | 'exists'
type Scripted = 'REFUSED' | 'NO_ANSWER' | 'NOT_STARTING'

/**
 * A namespace of memory (T14) that answers like the adapter: the Workers it holds by name, each
 * call recorded, and the next answers scripted.
 */
export function fakeCloudflare() {
  const workers = new Map<string, WorkerUpload>()
  const calls: { call: Call; worker: string }[] = []
  const scripts: Record<Call, Scripted[]> = { upload: [], remove: [], exists: [] }

  function scripted<T>(
    call: Call,
    worker: string,
  ): CloudflareAnswer<T> | 'NOT_STARTING' | undefined {
    calls.push({ call, worker })
    const next = scripts[call].shift()
    if (next === undefined || next === 'NOT_STARTING') return next
    return { kind: next }
  }

  const cloudflare: CloudflareApps = {
    async upload(input) {
      const next = scripted<never>('upload', input.worker)
      if (next === 'NOT_STARTING') return { kind: 'DONE', value: 'NOT_STARTING' }
      if (next !== undefined) return next
      workers.set(input.worker, input)
      return { kind: 'DONE', value: 'UPLOADED' }
    },
    async remove(worker) {
      const next = scripted<never>('remove', worker)
      if (next !== undefined && next !== 'NOT_STARTING') return next
      workers.delete(worker)
      return { kind: 'DONE', value: 'REMOVED' }
    },
    async exists(worker) {
      const next = scripted<never>('exists', worker)
      if (next !== undefined && next !== 'NOT_STARTING') return next
      return { kind: 'DONE', value: workers.has(worker) }
    },
  }

  return {
    cloudflare,
    calls,
    /** The Workers the namespace holds now, by name. */
    workers: () => [...workers.keys()].sort(),
    upload: (worker: string) => workers.get(worker),
    /** The next call of this kind answers so. */
    script(call: Call, answer: Scripted) {
      scripts[call].push(answer)
    },
  }
}
