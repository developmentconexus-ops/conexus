import { cpSync, existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { APP_COMPATIBILITY_DATE, ASSETS_FOLDER, Manifest } from '@conexus/app-contract'
import { CHECK_LIMITS } from './report.ts'
import type { CheckContext, Outcome } from './step.ts'
import { outputProblem, overran, PASSED, problem, workOf } from './step.ts'

/** The screens, built by the app's own Vite and its config, into the work folder. */
export async function telas(ctx: CheckContext): Promise<Outcome> {
  const vite = join(ctx.root, 'node_modules/.bin/vite')
  const args = ['build', '--outDir', workOf(ctx, 'dist'), '--emptyOutDir', '--logLevel', 'error']
  const ran = await ctx.run(vite, args, { cwd: ctx.root, timeoutMs: CHECK_LIMITS.stepMs })
  const late = overran('telas', ran)
  if (late !== undefined) return late
  if (ran.code !== 0)
    return { state: 'failed', problems: [outputProblem(ctx, 'BUILD_FAILED', ran)] }
  return PASSED
}

function filesUnder(folder: string): string[] {
  return readdirSync(folder, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(folder, join(entry.parentPath, entry.name)))
    .sort()
}

/** The Worker the version runs: the contract's runtime over the app's handlers, never the app's own entry. */
function workerSource(ctx: CheckContext, manifest: Manifest): string {
  const handlers = existsSync(join(ctx.root, 'server/handlers.ts'))
  return [
    "import { serveApp } from '@conexus/app-contract'",
    handlers ? "import { handlers } from '../../server/handlers.ts'" : 'const handlers = {}',
    `export default serveApp({ manifest: ${JSON.stringify(manifest)}, handlers })`,
  ].join('\n')
}

/**
 * The version's folder: the manifest with the built screens as its assets, the Worker bundled by
 * wrangler's own dry run the way it deploys (code C75), and the screens under `assets/`.
 */
export async function worker(ctx: CheckContext): Promise<Outcome> {
  const dist = workOf(ctx, 'dist')
  const operations = Manifest.parse(JSON.parse(readFileSync(workOf(ctx, 'manifest.json'), 'utf8')))
  const manifest = Manifest.safeParse({ ...operations, assets: filesUnder(dist) })
  if (!manifest.success) {
    const message = `The built screens do not fit the manifest: ${manifest.error.message}`
    return { state: 'failed', problems: [problem({ code: 'WORKER_FAILED', message })] }
  }
  writeFileSync(workOf(ctx, 'worker.ts'), workerSource(ctx, manifest.data))
  writeFileSync(
    workOf(ctx, 'wrangler.json'),
    JSON.stringify({
      name: 'app',
      main: 'worker.ts',
      compatibility_date: APP_COMPATIBILITY_DATE[1],
    }),
  )
  const bundle = workOf(ctx, 'bundle')
  const args = ['deploy', '--dry-run', '--minify', '--outdir', bundle, '--config', 'wrangler.json']
  const ran = await ctx.run(join(ctx.tools, '.bin/wrangler'), args, {
    cwd: workOf(ctx),
    timeoutMs: CHECK_LIMITS.stepMs,
  })
  const late = overran('worker', ran)
  if (late !== undefined) return late
  if (ran.code !== 0)
    return { state: 'failed', problems: [outputProblem(ctx, 'WORKER_FAILED', ran)] }
  const version = workOf(ctx, 'version')
  rmSync(version, { recursive: true, force: true })
  cpSync(dist, join(version, ASSETS_FOLDER), { recursive: true })
  cpSync(join(bundle, 'worker.js'), join(version, manifest.data.entry))
  writeFileSync(join(version, 'manifest.json'), JSON.stringify(manifest.data))
  return PASSED
}
