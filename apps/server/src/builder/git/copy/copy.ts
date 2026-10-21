import { Readable } from 'node:stream'
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import type { CompanyId, ProjectId } from '@conexus/hub-api'
import type { Config } from '../../../platform/config.ts'
import { Sha } from '../context.ts'

const CALL_MS = 60_000
const DELETE_BATCH = 1_000
/** The version number in the key has eight digits, so the newest key sorts last. */
const VERSION_DIGITS = 8

type CopiedVersion = { version: number; sha: Sha; bundle: Buffer }

/** The private bucket that keeps a bundle of each version, apart from the server's disk (decision 0051). */
export type GitCopy = {
  /** Puts a version's bundle under its own key; the same version put twice is the same object. */
  put(input: {
    companyId: CompanyId
    projectId: ProjectId
    version: number
    sha: Sha
    bundle: Uint8Array
  }): Promise<void>
  /** The newest copy of a Projeto, or null when it has none; a copy past `maxBytes` is refused. */
  latest(input: {
    companyId: CompanyId
    projectId: ProjectId
    maxBytes: number
  }): Promise<CopiedVersion | null>
  removeProject(input: { companyId: CompanyId; projectId: ProjectId }): Promise<void>
}

/** The reply's bytes, or null once it passes `cap`: the rest is never read (code C59). */
async function readCapped(body: unknown, cap: number): Promise<Buffer | null> {
  if (!(body instanceof Readable)) return null
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of body) {
    size += chunk.byteLength
    if (size > cap) {
      body.destroy()
      return null
    }
    chunks.push(chunk)
  }
  return Buffer.concat(chunks)
}

function prefixOf({
  companyId,
  projectId,
}: {
  companyId: CompanyId
  projectId: ProjectId
}): string {
  return `git/${companyId}/${projectId}/`
}

export function copyKey(input: {
  companyId: CompanyId
  projectId: ProjectId
  version: number
  sha: Sha
}): string {
  return `${prefixOf(input)}${String(input.version).padStart(VERSION_DIGITS, '0')}-${input.sha}.bundle`
}

function call<T>(send: (abortSignal: AbortSignal) => Promise<T>): Promise<T> {
  return send(AbortSignal.timeout(CALL_MS))
}

/** The one adapter to R2 (C56): S3's calls, each with a deadline, and a reply read to a cap (C57, C59). */
export function createGitCopy(
  config: Pick<Config, 'cloudflareAccountId' | 'gitCopyBucket' | 'gitCopyKey'>,
  endpoint?: string,
): GitCopy {
  const [accessKeyId = '', secretAccessKey = ''] = config.gitCopyKey.reveal().split(/\s+/)
  const client = new S3Client({
    region: 'auto',
    endpoint: endpoint ?? `https://${config.cloudflareAccountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    maxAttempts: 3,
    forcePathStyle: true,
  })
  const Bucket = config.gitCopyBucket
  async function keysOf(prefix: string): Promise<string[]> {
    const keys: string[] = []
    for (let token: string | undefined; ; ) {
      const page = await call((abortSignal) =>
        client.send(
          new ListObjectsV2Command({ Bucket, Prefix: prefix, ContinuationToken: token }),
          { abortSignal },
        ),
      )
      keys.push(
        ...(page.Contents ?? []).flatMap((object) =>
          object.Key === undefined ? [] : [object.Key],
        ),
      )
      token = page.NextContinuationToken
      if (token === undefined) return keys.sort()
    }
  }

  return {
    async put(input) {
      await call((abortSignal) =>
        client.send(new PutObjectCommand({ Bucket, Key: copyKey(input), Body: input.bundle }), {
          abortSignal,
        }),
      )
    },
    async latest(input) {
      const key = (await keysOf(prefixOf(input))).at(-1)
      const named = key === undefined ? null : /\/(\d{8})-([0-9a-f]{40})\.bundle$/.exec(key)
      if (key === undefined || named === null) return null
      const got = await call((abortSignal) =>
        client.send(new GetObjectCommand({ Bucket, Key: key }), { abortSignal }),
      )
      const bundle = await readCapped(got.Body, input.maxBytes)
      return bundle === null
        ? null
        : { version: Number(named[1]), sha: Sha.parse(named[2]), bundle }
    },
    async removeProject(input) {
      const keys = await keysOf(prefixOf(input))
      for (let at = 0; at < keys.length; at += DELETE_BATCH) {
        const deleted = await call((abortSignal) =>
          client.send(
            new DeleteObjectsCommand({
              Bucket,
              Delete: { Objects: keys.slice(at, at + DELETE_BATCH).map((Key) => ({ Key })) },
            }),
            { abortSignal },
          ),
        )
        // R2 answers 200 with the keys it refused: a removal that leaves one has not finished.
        if (deleted.Errors?.length) {
          throw new Error(`R2 refused to delete ${deleted.Errors.length} of the Projeto's copies`)
        }
      }
    },
  }
}
