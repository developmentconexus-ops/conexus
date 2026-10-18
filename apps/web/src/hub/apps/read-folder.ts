import { APP_LIMITS } from '@conexus/app-contract'
import type { VersionFileInput } from '@conexus/hub-api'

const MANIFEST = 'manifest.json'
const MEDIA_TYPES: Record<string, string> = {
  js: 'text/javascript',
  mjs: 'text/javascript',
  json: 'application/json',
  css: 'text/css',
  html: 'text/html',
  txt: 'text/plain',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  ico: 'image/x-icon',
  woff2: 'font/woff2',
  wasm: 'application/wasm',
}

/** The folder a person picked, read and ready to send. */
export type Folder = {
  name: string
  count: number
  bytes: number
  manifest: unknown
  files: VersionFileInput[]
}

/** The folder is not one to send: the failure code that says why, from the failure table. */
export type FolderRefusal = 'APP_VERSION_INVALID' | 'APP_VERSION_TOO_LARGE'

export type FolderRead = { folder: Folder } | { refusal: FolderRefusal }

function mediaTypeOf(file: File, path: string): string {
  if (file.type !== '') return file.type
  return MEDIA_TYPES[path.split('.').at(-1)?.toLowerCase() ?? ''] ?? 'application/octet-stream'
}

async function base64Of(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (let at = 0; at < bytes.length; at += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(at, at + 0x8000))
  }
  return btoa(binary)
}

/** Each picked file under its path inside the folder: the picked folder's own name is dropped. */
function inside(files: File[]) {
  return files.map((file) => ({
    file,
    path: file.webkitRelativePath.split('/').slice(1).join('/'),
  }))
}

async function manifestOf(file: File): Promise<unknown> {
  try {
    return JSON.parse(await file.text())
  } catch {
    return undefined
  }
}

/**
 * Reads what `npm run app:pack` made: `manifest.json` is the manifest, every other file is sent
 * with its path. The files sent are checked against the ceiling, as the Hub counts them, before
 * any is read.
 */
export async function readFolder(picked: File[]): Promise<FolderRead> {
  const name = picked[0]?.webkitRelativePath.split('/')[0] ?? ''
  const bytes = picked.reduce((sum, file) => sum + file.size, 0)
  const entries = inside(picked)
  const sent = entries.filter((entry) => entry.path !== MANIFEST).map(({ file }) => file)
  const sentBytes = sent.reduce((sum, file) => sum + file.size, 0)
  if (sent.length > APP_LIMITS.files || sentBytes > APP_LIMITS.bytes) {
    return { refusal: 'APP_VERSION_TOO_LARGE' }
  }
  const manifestFile = entries.find((entry) => entry.path === MANIFEST)
  const manifest = manifestFile && (await manifestOf(manifestFile.file))
  if (manifest === undefined) return { refusal: 'APP_VERSION_INVALID' }
  const files = await Promise.all(
    entries
      .filter((entry) => entry.path !== MANIFEST)
      .map(async ({ file, path }) => ({
        path,
        mediaType: mediaTypeOf(file, path),
        base64: await base64Of(file),
      })),
  )
  return { folder: { name, count: picked.length, bytes, manifest, files } }
}

/** "3 arquivos · 1,2 MB", as the person reads what they picked. */
export function sizeOf(folder: Pick<Folder, 'count' | 'bytes'>): string {
  const files = folder.count === 1 ? '1 arquivo' : `${folder.count} arquivos`
  const size =
    folder.bytes < 1024 * 1024
      ? `${Math.max(1, Math.round(folder.bytes / 1024)).toLocaleString('pt-BR')} KB`
      : `${(folder.bytes / (1024 * 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`
  return `${files} · ${size}`
}
