import { createHash } from 'node:crypto'
import { z } from 'zod'
import { cappedText } from './capped-text.ts'
import type { Config } from './config.ts'
import type { FailureLog } from './failure.ts'

// Measured in decision 0043: 1,000 files and 10 MB took 14.9 s; the whole upload gets four times that.
export const CLOUDFLARE_DEADLINE_MS = 60_000
const REPLY_CAP_BYTES = 1024 * 1024
// Cloudflare's code for a Worker whose module throws, or runs too long, when it starts.
const NOT_STARTING = 10_021
// Cloudflare's code for a script the namespace does not hold.
const NO_SCRIPT = 10_007

/** What Cloudflare said: a refusal leaves no effect, silence may leave one. */
export type CloudflareAnswer<T> =
  | { kind: 'DONE'; value: T }
  | { kind: 'REFUSED' }
  | { kind: 'NO_ANSWER' }

/** One file of a version's folder, by its path there: the entry module, or a file under `assets/`. */
export type WorkerFile = Readonly<{ path: string; bytes: Uint8Array; mediaType: string }>

export type WorkerUpload = Readonly<{
  worker: string
  mainModule: string
  compatibilityDate: string
  files: readonly WorkerFile[]
  tags: readonly string[]
  cpuMs: number
}>

export type CloudflareApps = {
  /** Uploads the Worker, or answers that its code does not start (decision 0046). */
  upload(input: WorkerUpload): Promise<CloudflareAnswer<'UPLOADED' | 'NOT_STARTING'>>
  /** Removes the Worker; one already gone is removed. A caller's signal can end the wait sooner. */
  remove(worker: string, signal?: AbortSignal): Promise<CloudflareAnswer<'REMOVED'>>
  /** Whether the namespace holds the Worker: a removed one answers `script: null` (0043, check 5). */
  exists(worker: string): Promise<CloudflareAnswer<boolean>>
}

const Reply = z.looseObject({
  success: z.boolean(),
  errors: z.array(z.looseObject({ code: z.number() })).default([]),
  result: z.unknown(),
})
type Reply = z.infer<typeof Reply>
const Session = z.looseObject({
  jwt: z.string().min(1),
  buckets: z.array(z.array(z.string())).default([]),
})
const Completion = z.looseObject({ jwt: z.string().min(1).optional() })
const Script = z.looseObject({ script: z.unknown() })

const ASSET_PREFIX = 'assets/'

/** Cloudflare names a static file by the first 32 hex digits of its SHA-256. */
function assetHash(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex').slice(0, 32)
}

/** A reply read up to the cap; past it, or unreadable, it is silence (code C59). */
async function readReply(response: Response): Promise<Reply | undefined> {
  const text = await cappedText(response.body, REPLY_CAP_BYTES)
  if (text === undefined) return undefined
  try {
    const parsed = Reply.safeParse(JSON.parse(text))
    return parsed.success ? parsed.data : undefined
  } catch {
    return undefined
  }
}

type Api = { account: string; scripts: string; token: string; log: FailureLog }
type Sent = { kind: 'REPLY'; status: number; reply: Reply } | { kind: 'NO_ANSWER' }
type Call = {
  method: string
  body?: FormData
  json?: unknown
  bearer?: string
  signal: AbortSignal
}

/** One request; a reply past the cap, unreadable or never come is silence. */
async function send(api: Api, url: string, init: Call): Promise<Sent> {
  const headers = new Headers({ Authorization: `Bearer ${init.bearer ?? api.token}` })
  if (init.json !== undefined) headers.set('Content-Type', 'application/json')
  try {
    const response = await fetch(url, {
      method: init.method,
      headers,
      body: init.json === undefined ? init.body : JSON.stringify(init.json),
      signal: init.signal,
    })
    const reply = await readReply(response)
    if (reply === undefined) {
      api.log.error({ reason: 'unreadable', status: response.status }, 'CLOUDFLARE_FAILED')
      return { kind: 'NO_ANSWER' }
    }
    return { kind: 'REPLY', status: response.status, reply }
  } catch (error) {
    api.log.error({ reason: error instanceof Error ? error.name : 'unknown' }, 'CLOUDFLARE_FAILED')
    return { kind: 'NO_ANSWER' }
  }
}

/** A server error is silence; any other refusal is logged by its codes, never its text. */
function refused(api: Api, sent: Sent): { kind: 'REFUSED' } | { kind: 'NO_ANSWER' } {
  if (sent.kind === 'NO_ANSWER' || sent.status >= 500) return { kind: 'NO_ANSWER' }
  const codes = sent.reply.errors.map((error) => error.code).join(',')
  api.log.error({ status: sent.status, codes }, 'CLOUDFLARE_REFUSED')
  return { kind: 'REFUSED' }
}

type Asset = WorkerFile & { hash: string }

/** Sends the files of one bucket the session asked for; the last answers the completion token. */
async function uploadBucket(
  api: Api,
  input: { bucket: string[]; byHash: Map<string, Asset>; session: string; signal: AbortSignal },
): Promise<CloudflareAnswer<string | undefined>> {
  const form = new FormData()
  for (const hash of input.bucket) {
    const file = input.byHash.get(hash)
    if (file === undefined) return { kind: 'REFUSED' }
    const base64 = Buffer.from(file.bytes).toString('base64')
    form.append(hash, new File([base64], hash, { type: file.mediaType }))
  }
  const sent = await send(api, `${api.account}/workers/assets/upload?base64=true`, {
    method: 'POST',
    body: form,
    bearer: input.session,
    signal: input.signal,
  })
  if (sent.kind !== 'REPLY' || !sent.reply.success) return refused(api, sent)
  return { kind: 'DONE', value: Completion.parse(sent.reply.result ?? {}).jwt }
}

/** Uploads the static files Cloudflare does not hold yet; the answer is the token the Worker names. */
async function uploadAssets(
  api: Api,
  input: WorkerUpload,
  signal: AbortSignal,
): Promise<CloudflareAnswer<string | undefined>> {
  const assets = input.files
    .filter((file) => file.path.startsWith(ASSET_PREFIX))
    .map((file) => ({ ...file, hash: assetHash(file.bytes) }))
  if (assets.length === 0) return { kind: 'DONE', value: undefined }
  const manifest = Object.fromEntries(
    assets.map((file) => [
      `/${file.path.slice(ASSET_PREFIX.length)}`,
      { hash: file.hash, size: file.bytes.byteLength },
    ]),
  )
  const opened = await send(api, `${api.scripts}/${input.worker}/assets-upload-session`, {
    method: 'POST',
    json: { manifest },
    signal,
  })
  const session = opened.kind === 'REPLY' ? Session.safeParse(opened.reply.result) : undefined
  if (opened.kind !== 'REPLY' || !opened.reply.success || !session?.success) {
    return refused(api, opened)
  }
  const byHash = new Map(assets.map((file) => [file.hash, file]))
  let token = session.data.jwt
  for (const bucket of session.data.buckets) {
    const sent = await uploadBucket(api, { bucket, byHash, session: session.data.jwt, signal })
    if (sent.kind !== 'DONE') return sent
    token = sent.value ?? token
  }
  return { kind: 'DONE', value: token }
}

/** The Worker's metadata: no binding, its static files first, its CPU limit and its tags. */
function metadataOf(input: WorkerUpload, assetsToken: string | undefined) {
  const assets =
    assetsToken === undefined
      ? {}
      : {
          assets: {
            jwt: assetsToken,
            config: { run_worker_first: false, not_found_handling: 'none' },
          },
        }
  return {
    main_module: input.mainModule,
    compatibility_date: input.compatibilityDate,
    bindings: [],
    ...assets,
    limits: { cpu_ms: input.cpuMs },
    tags: input.tags,
  }
}

async function upload(
  api: Api,
  input: WorkerUpload,
): Promise<CloudflareAnswer<'UPLOADED' | 'NOT_STARTING'>> {
  const signal = AbortSignal.timeout(CLOUDFLARE_DEADLINE_MS)
  const main = input.files.find((file) => file.path === input.mainModule)
  if (main === undefined) return { kind: 'REFUSED' }
  const assets = await uploadAssets(api, input, signal)
  if (assets.kind !== 'DONE') return assets
  const form = new FormData()
  const metadata = JSON.stringify(metadataOf(input, assets.value))
  form.append('metadata', new Blob([metadata], { type: 'application/json' }))
  form.append(
    input.mainModule,
    new File([new Uint8Array(main.bytes)], input.mainModule, {
      type: 'application/javascript+module',
    }),
  )
  const sent = await send(api, `${api.scripts}/${input.worker}`, {
    method: 'PUT',
    body: form,
    signal,
  })
  if (sent.kind === 'REPLY' && sent.reply.success) return { kind: 'DONE', value: 'UPLOADED' }
  if (sent.kind === 'REPLY' && sent.reply.errors.some((error) => error.code === NOT_STARTING)) {
    return { kind: 'DONE', value: 'NOT_STARTING' }
  }
  return refused(api, sent)
}

async function remove(
  api: Api,
  worker: string,
  budget?: AbortSignal,
): Promise<CloudflareAnswer<'REMOVED'>> {
  const deadline = AbortSignal.timeout(CLOUDFLARE_DEADLINE_MS)
  const signal = budget === undefined ? deadline : AbortSignal.any([deadline, budget])
  const sent = await send(api, `${api.scripts}/${worker}`, { method: 'DELETE', signal })
  const gone =
    sent.kind === 'REPLY' &&
    (sent.reply.success || sent.reply.errors.some((error) => error.code === NO_SCRIPT))
  return gone ? { kind: 'DONE', value: 'REMOVED' } : refused(api, sent)
}

async function exists(api: Api, worker: string): Promise<CloudflareAnswer<boolean>> {
  const signal = AbortSignal.timeout(CLOUDFLARE_DEADLINE_MS)
  const sent = await send(api, `${api.scripts}/${worker}`, { method: 'GET', signal })
  if (sent.kind === 'REPLY' && sent.status === 404) return { kind: 'DONE', value: false }
  if (sent.kind !== 'REPLY' || !sent.reply.success) return refused(api, sent)
  const script = Script.safeParse(sent.reply.result)
  return { kind: 'DONE', value: script.success && script.data.script != null }
}

/**
 * The one adapter to Cloudflare's API for the apps: only it holds the token, which leaves only in
 * its requests (code C56, security S36). A version is a Worker `v-<id>` in the namespace, with its
 * static files served before it (decision 0043).
 */
export function createCloudflareApps(deps: { config: Config; log: FailureLog }): CloudflareApps {
  const { cloudflareApiUrl, cloudflareAccountId, appsNamespace, cloudflareAppsToken } = deps.config
  const account = `${cloudflareApiUrl}/accounts/${cloudflareAccountId}`
  const api: Api = {
    account,
    scripts: `${account}/workers/dispatch/namespaces/${appsNamespace}/scripts`,
    token: cloudflareAppsToken.reveal(),
    log: deps.log,
  }
  return Object.freeze({
    upload: (input: WorkerUpload) => upload(api, input),
    remove: (worker: string, signal?: AbortSignal) => remove(api, worker, signal),
    exists: (worker: string) => exists(api, worker),
  })
}
