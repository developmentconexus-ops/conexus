// app-pack: builds a version folder a person sends to a Projeto (step 9): manifest.json, the entry
// module and assets/. `node scripts/app-pack.ts <source> <out> [<overlay>]`; the overlay's
// manifest.json and assets/ files replace the source's by the same path, an asset only its own
// manifest names is added, and an overlay with its own wrangler.jsonc is bundled in place of the
// source's Worker (recados-2 changes only the color; the step 10 defects change one piece of
// Recados each).
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, resolve } from 'node:path'
import { APP_LIMITS, ASSETS_FOLDER, Manifest, versionFiles } from '@conexus/app-contract'
import { spawnCommand } from './command.ts'

const ROOT = resolve(import.meta.dirname, '..')
const WRANGLER = join(ROOT, 'node_modules/.bin/wrangler')
const BUNDLE_DEADLINE_MS = 120_000

function filesUnder(folder: string): string[] {
  return readdirSync(folder, { recursive: true, encoding: 'utf8' })
    .filter((path) => statSync(join(folder, path)).isFile())
    .map((path) => path.split('\\').join('/'))
}

function fail(message: string): never {
  console.error(`app-pack: ${message}`)
  process.exit(1)
}

/** The bundle comes from wrangler's own dry run, the way it would deploy the Worker (code C75). */
function bundle(source: string): string {
  const outdir = mkdtempSync(join(tmpdir(), 'conexus-app-pack-'))
  const run = spawnCommand(
    WRANGLER,
    [
      'deploy',
      '--dry-run',
      '--minify',
      '--outdir',
      outdir,
      '--config',
      join(source, 'wrangler.jsonc'),
    ],
    { cwd: source, deadline: BUNDLE_DEADLINE_MS },
  )
  if (run.status !== 0) fail(`wrangler did not bundle ${source}:\n${run.output}`)
  return outdir
}

/** The overlay's files that belong to the version: its manifest and assets, not its Worker's source. */
function versionPartsOf(overlay: string | undefined): { from: string; path: string }[] {
  if (overlay === undefined) return []
  return filesUnder(overlay)
    .filter((path) => path === 'manifest.json' || path.startsWith(`${ASSETS_FOLDER}/`))
    .map((path) => ({ from: join(overlay, path), path }))
}

function pack(source: string, out: string, overlay: string | undefined) {
  const worker =
    overlay !== undefined && existsSync(join(overlay, 'wrangler.jsonc')) ? overlay : source
  const outdir = bundle(worker)
  let manifest: Manifest
  try {
    rmSync(out, { recursive: true, force: true })
    cpSync(join(source, ASSETS_FOLDER), join(out, ASSETS_FOLDER), { recursive: true })
    cpSync(join(source, 'manifest.json'), join(out, 'manifest.json'))
    const parts = versionPartsOf(overlay)
    for (const { from, path } of parts) cpSync(from, join(out, path))
    manifest = Manifest.parse(JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8')))
    cpSync(join(outdir, 'index.js'), join(out, manifest.entry))
  } finally {
    rmSync(outdir, { recursive: true, force: true })
  }
  const found = filesUnder(out).filter((path) => path !== 'manifest.json')
  const expected = versionFiles(manifest)
  const differs = found.length !== expected.length || expected.some((p) => !found.includes(p))
  if (differs)
    fail(`the folder holds ${found.sort().join(', ')}; the manifest names ${expected.join(', ')}`)
  const bytes = found.reduce((sum, path) => sum + statSync(join(out, path)).size, 0)
  if (bytes > APP_LIMITS.bytes || found.length > APP_LIMITS.files)
    fail('the version passes the limits')
  console.log(`app-pack: ${relative(ROOT, out)}, ${found.length} files, ${bytes} bytes`)
}

const [source, out, overlay] = process.argv.slice(2)
if (source === undefined || out === undefined) fail('usage: app-pack <source> <out> [<overlay>]')
pack(resolve(source), resolve(out), overlay === undefined ? undefined : resolve(overlay))
