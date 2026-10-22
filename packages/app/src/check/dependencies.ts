import { cpSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { CHECK_LIMITS } from './report.ts'
import type { CheckContext, Outcome } from './step.ts'
import { overran, PASSED, problem } from './step.ts'

/** What the platform puts in every app's `node_modules` itself: the SDK, never from the registry. */
const PLATFORM_PACKAGES = ['@conexus/app', '@conexus/app-contract']

// npm's codes for a registry it could not reach: the machine's fault, not the app's.
const UNREACHABLE = new Set(['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'])

const NpmError = z.object({ error: z.object({ code: z.string(), summary: z.string() }) })

/**
 * npm's error as `npm ci --json` prints it on stdout (npm 11, `lib/utils/output-error.js`): its code
 * and summary. Output that is not that (npm itself crashed) is the summary, with a code that says so.
 */
function npmErrorOf(output: string): { code: string; summary: string } {
  try {
    const parsed = NpmError.safeParse(JSON.parse(output))
    if (parsed.success) return parsed.data.error
  } catch (error) {
    return { code: 'NPM_OUTPUT_UNREADABLE', summary: `${String(error)}: ${output.trim()}` }
  }
  return { code: 'NPM_OUTPUT_UNREADABLE', summary: output.trim() }
}

/** The platform's packages go in after the install, which clears `node_modules`. */
function placePlatform(ctx: CheckContext) {
  if (ctx.platform === undefined) return
  for (const name of PLATFORM_PACKAGES) {
    const folder = name.split('/')[1] ?? name
    cpSync(join(ctx.platform, folder), join(ctx.root, 'node_modules', name), {
      recursive: true,
      filter: (path) => !/\/(node_modules|starter|check)(\/|$)|\.test\.ts$/.test(path),
    })
  }
}

/**
 * The install from the lockfile, with no package's scripts: npm refuses a `package.json` its
 * lockfile does not match, and says why as a code. Which libraries an app uses is the app's own
 * choice; the machine reaches only npm, and the app runs inside the Worker's isolation.
 */
export async function dependencies(ctx: CheckContext): Promise<Outcome> {
  // The template's npm cache holds the starter's packages, so only another is fetched.
  const flags = ['--ignore-scripts', '--prefer-offline', '--no-audit', '--no-fund']
  const ran = await ctx.run('npm', ['ci', '--json', '--loglevel=silent', ...flags], {
    cwd: ctx.root,
    timeoutMs: CHECK_LIMITS.stepMs,
  })
  const late = overran('dependências', ran)
  if (late !== undefined) return late
  if (ran.code === 0) {
    placePlatform(ctx)
    return PASSED
  }
  const { code, summary } = npmErrorOf(ran.output)
  if (UNREACHABLE.has(code) || /^E5\d\d$/.test(code)) {
    return { state: 'platform', reason: 'npm could not reach the registry' }
  }
  const message = `${code}: ${summary}`
  return { state: 'failed', problems: [problem({ code: 'INSTALL_FAILED', message })] }
}
