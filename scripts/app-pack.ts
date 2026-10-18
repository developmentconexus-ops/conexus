// app-pack: builds a version folder a person sends to a Projeto (step 9): manifest.json, the entry
// module and assets/. `node scripts/app-pack.ts <source> <out> [<assets to replace>]`; the third
// folder replaces files of the source's assets/ by the same path (recados-2 changes only the color).
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

function pack(source: string, out: string, replace: string | undefined) {
  const manifest = Manifest.parse(JSON.parse(readFileSync(join(source, 'manifest.json'), 'utf8')))
  const outdir = bundle(source)
  try {
    rmSync(out, { recursive: true, force: true })
    cpSync(join(source, ASSETS_FOLDER), join(out, ASSETS_FOLDER), { recursive: true })
    if (replace !== undefined) {
      for (const path of filesUnder(replace)) {
        const target = join(out, ASSETS_FOLDER, path)
        if (!existsSync(target)) fail(`${path} replaces no file of ${source}`)
        cpSync(join(replace, path), target)
      }
    }
    cpSync(join(outdir, 'index.js'), join(out, manifest.entry))
    cpSync(join(source, 'manifest.json'), join(out, 'manifest.json'))
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

const [source, out, replace] = process.argv.slice(2)
if (source === undefined || out === undefined) fail('usage: app-pack <source> <out> [<assets>]')
pack(resolve(source), resolve(out), replace === undefined ? undefined : resolve(replace))
