import { VERSION_FOLDER } from '@conexus/app/check'
import { APP_LIMITS, Manifest, mediaTypeOf, versionFiles } from '@conexus/app-contract'
import type { VersionFileInput } from '@conexus/hub-api'
import { z } from 'zod'
import type { Result } from '../../platform/result.ts'
import { quoted } from './scripts.ts'

/** The version a passing check left, as the send takes it (security S2). */
export type VersionFolder = { manifest: Manifest; files: VersionFileInput[] }

/** Why there is no version to send: past `APP_LIMITS`, a link or other non-regular file, or no valid version. */
export type PackRefused = 'TOO_LARGE' | 'NOT_REGULAR' | 'VERSION_INVALID'

const MANIFEST = 'manifest.json'

function packMain(): void {
  const fs = process.getBuiltinModule('node:fs')
  const { O_RDONLY, O_DIRECTORY, O_NOFOLLOW, O_NONBLOCK } = fs.constants
  const [root = '', path = '', maxFiles = '0', maxBytes = '0'] = process.argv.slice(1)
  const files: { dir: number; name: string; path: string; size: number }[] = []
  let count = 0
  let bytes = 0
  function stop(error: string): never {
    process.stdout.write(JSON.stringify({ error }))
    process.exit(0)
  }
  function open(dir: number, name: string): number {
    try {
      return fs.openSync(`/proc/self/fd/${dir}/${name}`, O_RDONLY | O_DIRECTORY | O_NOFOLLOW)
    } catch (error) {
      stop(Reflect.get(Object(error), 'code') === 'ENOENT' ? 'MISSING' : 'NOT_REGULAR')
    }
  }
  function walk(dir: number, prefix: string): void {
    for (const entry of fs.readdirSync(`/proc/self/fd/${dir}`, { withFileTypes: true })) {
      const at = `${prefix}${entry.name}`
      if (entry.isDirectory()) walk(open(dir, entry.name), `${at}/`)
      else if (!entry.isFile()) stop('NOT_REGULAR')
      else {
        const size = fs.lstatSync(`/proc/self/fd/${dir}/${entry.name}`).size
        // APP_LIMITS counts the files beside the manifest; the manifest has the same byte cap.
        if (at !== 'manifest.json') {
          count += 1
          bytes += size
        }
        if (count > Number(maxFiles) || bytes > Number(maxBytes) || size > Number(maxBytes)) {
          stop('TOO_LARGE')
        }
        files.push({ dir, name: entry.name, path: at, size })
      }
    }
  }
  let dir = fs.openSync(root, O_RDONLY | O_DIRECTORY | O_NOFOLLOW)
  for (const step of path.split('/')) dir = open(dir, step)
  walk(dir, '')
  const read = files.map((file) => {
    const fd = fs.openSync(
      `/proc/self/fd/${file.dir}/${file.name}`,
      O_RDONLY | O_NOFOLLOW | O_NONBLOCK,
    )
    const found = fs.fstatSync(fd)
    if (!found.isFile()) stop('NOT_REGULAR')
    if (found.size > file.size) stop('TOO_LARGE')
    return { path: file.path, base64: fs.readFileSync(fd).toString('base64') }
  })
  process.stdout.write(JSON.stringify({ files: read }))
}

/**
 * The program the machine runs to hand the version over: every step of the path and every entry
 * opened without following a link, every file counted against `APP_LIMITS` before any is read, and
 * a file that changed into something else since refused (security S2, code C59).
 */
const PACK_PROGRAM = `${packMain}\npackMain()`

const Packed = z.union([
  z.strictObject({ files: z.array(z.strictObject({ path: z.string(), base64: z.base64() })) }),
  z.strictObject({ error: z.enum(['TOO_LARGE', 'NOT_REGULAR', 'MISSING']) }),
])

/** Runs a shell script in the machine. */
export type Exec = (script: string) => Promise<{ exitCode: number; stdout: string; stderr: string }>

/** `text` as JSON read by `schema`; text that is not JSON is the same refusal as a wrong shape. */
export function parsedWith<T>(schema: z.ZodType<T>, text: string): z.ZodSafeParseResult<T> {
  try {
    return schema.safeParse(JSON.parse(text))
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
    return schema.safeParse(undefined)
  }
}

const invalid = { ok: false, error: 'VERSION_INVALID' } as const

/** The version folder of the app folder `workdir`, read once from the machine. */
export async function packIn(
  exec: Exec,
  workdir: string,
): Promise<Result<VersionFolder, PackRefused>> {
  const limits = `${APP_LIMITS.files} ${APP_LIMITS.bytes}`
  const script = `node -e ${quoted(PACK_PROGRAM)} ${quoted(workdir)} ${quoted(VERSION_FOLDER)} ${limits}`
  const ran = await exec(script)
  if (ran.exitCode !== 0) throw new Error(`pack failed: ${ran.stderr.slice(-500)}`)
  const reply = parsedWith(Packed, ran.stdout)
  if (!reply.success) return invalid
  const packed = reply.data
  if ('error' in packed)
    return packed.error === 'MISSING' ? invalid : { ok: false, error: packed.error }
  const text = packed.files.find(({ path }) => path === MANIFEST)?.base64 ?? ''
  const manifest = parsedWith(Manifest, Buffer.from(text, 'base64').toString('utf8'))
  if (!manifest.success) return invalid
  const files = packed.files.filter(({ path }) => path !== MANIFEST)
  const expected = new Set(versionFiles(manifest.data))
  if (files.length !== expected.size || !files.every(({ path }) => expected.has(path)))
    return invalid
  return {
    ok: true,
    value: {
      manifest: manifest.data,
      files: files.map(({ path, base64 }) => ({ path, mediaType: mediaTypeOf(path), base64 })),
    },
  }
}
