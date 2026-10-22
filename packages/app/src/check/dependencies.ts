import { cpSync, existsSync, readdirSync, readFileSync } from 'node:fs'
import { isBuiltin } from 'node:module'
import { join, relative } from 'node:path'
import ts from 'typescript'
import { z } from 'zod'
import { STARTER_DIR } from '../starter.ts'
import type { Problem } from './report.ts'
import { CHECK_LIMITS } from './report.ts'
import type { CheckContext, Outcome } from './step.ts'
import { outputProblem, overran, PASSED, problem } from './step.ts'

/** What the platform puts in every app's `node_modules` itself: the SDK, never from the registry. */
const PLATFORM_PACKAGES = ['@conexus/app', '@conexus/app-contract']
const IMPORTABLE = new Set(['@conexus/app'])

/** One exact version, as npm writes it with `--save-exact`: no range, tag or URL. */
const EXACT = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

const Versions = z.record(z.string(), z.string())
const PackageJson = z.looseObject({
  dependencies: Versions.optional(),
  devDependencies: Versions.optional(),
})

// npm's codes for a registry it could not reach: the machine's fault, not the app's.
const UNREACHABLE =
  /npm error code (?:ENOTFOUND|ECONNREFUSED|ECONNRESET|ETIMEDOUT|EAI_AGAIN|E5\d\d)/

const SOURCE = /\.(?:[cm]?[jt]sx?)$/

function refused(fields: Omit<Parameters<typeof problem>[0], 'code'>): Problem {
  return problem({ code: 'DEPENDENCY_NOT_APPROVED', ...fields })
}

function lineOf(text: string, needle: string, from: number): number | null {
  const at = text.indexOf(needle, from)
  return at < 0 ? null : text.slice(0, at).split('\n').length
}

/**
 * What the app may declare: the starter's packages at their versions, read from the starter the
 * check ships with (the one owner of that list, code C26), and the Projeto's grants.
 */
function allowedOf(ctx: CheckContext): Set<string> {
  const starter = PackageJson.parse(
    JSON.parse(readFileSync(join(STARTER_DIR, 'package.json'), 'utf8')),
  )
  const approved = Object.entries(starter.dependencies ?? {}).map(([name, version]) => ({
    name,
    version,
  }))
  return new Set([...approved, ...ctx.grants].map(({ name, version }) => `${name}@${version}`))
}

/** Each declared package against the allowed list and an exact version, located in the file. */
function declaredProblems(ctx: CheckContext, text: string, declared: Map<string, string>) {
  const allowed = allowedOf(ctx)
  const problems: Problem[] = []
  for (const [name, version] of declared) {
    const line = lineOf(text, `"${name}"`, 0)
    if (!EXACT.test(version)) {
      const message = `${name} "${version}" is not one exact version; write it as x.y.z.`
      problems.push(refused({ file: 'package.json', line, message }))
    } else if (!allowed.has(`${name}@${version}`)) {
      const message = `${name}@${version} is not approved for this Projeto; ask the person for it.`
      problems.push(refused({ file: 'package.json', line, message }))
    }
  }
  return problems
}

function sourcesOf(folder: string): string[] {
  if (!existsSync(folder)) return []
  return readdirSync(folder, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && SOURCE.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((path) => !path.includes('/node_modules/'))
}

/** The package a bare specifier names, or none for a relative path, the `@/` alias or a built-in. */
function packageOf(specifier: string): string | undefined {
  if (/^[./]|^@\/|:/.test(specifier) || isBuiltin(specifier)) return undefined
  const parts = specifier.split('?')[0]?.split('/') ?? []
  return (specifier.startsWith('@') ? parts.slice(0, 2) : parts.slice(0, 1)).join('/')
}

/** Every import in `src/`, `server/` and `shared/` names a declared package (TypeScript's own scanner). */
function importProblems(ctx: CheckContext, declared: Map<string, string>): Problem[] {
  const problems: Problem[] = []
  for (const path of ['src', 'server', 'shared'].flatMap((each) =>
    sourcesOf(join(ctx.root, each)),
  )) {
    const text = readFileSync(path, 'utf8')
    const { importedFiles } = ts.preProcessFile(text, true, true)
    for (const { fileName, pos } of importedFiles) {
      const name = packageOf(fileName)
      if (name === undefined || declared.has(name) || IMPORTABLE.has(name)) continue
      const before = text.slice(0, pos).split('\n')
      problems.push(
        refused({
          file: relative(ctx.root, path),
          line: before.length,
          column: (before.at(-1)?.length ?? 0) + 1,
          message: `${name} is imported but not declared in package.json.`,
        }),
      )
    }
  }
  return problems
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
 * The `package.json` against the starter's list and the grants (never a file of the app's tree), each version
 * exact and each import declared; then the install from the lockfile, with no package's scripts.
 */
export async function dependencies(ctx: CheckContext): Promise<Outcome> {
  const path = join(ctx.root, 'package.json')
  const text = existsSync(path) ? readFileSync(path, 'utf8') : '{}'
  let parsed: z.ZodSafeParseResult<z.infer<typeof PackageJson>>
  try {
    parsed = PackageJson.safeParse(JSON.parse(text))
  } catch (error) {
    const message = `package.json is not JSON: ${String(error)}`
    return { state: 'failed', problems: [problem({ code: 'PACKAGE_JSON_INVALID', message })] }
  }
  if (!parsed.success) {
    const message = `package.json: ${parsed.error.message}`
    return { state: 'failed', problems: [problem({ code: 'PACKAGE_JSON_INVALID', message })] }
  }
  const { dependencies = {}, devDependencies = {} } = parsed.data
  const declared = new Map(Object.entries({ ...dependencies, ...devDependencies }))
  const problems = [...declaredProblems(ctx, text, declared), ...importProblems(ctx, declared)]
  if (problems.length > 0) return { state: 'failed', problems }
  // The template's npm cache holds the starter's packages, so only a granted one is fetched.
  const flags = ['--ignore-scripts', '--prefer-offline', '--no-audit', '--no-fund']
  const ran = await ctx.run('npm', ['ci', ...flags], {
    cwd: ctx.root,
    timeoutMs: CHECK_LIMITS.stepMs,
  })
  const late = overran('dependências', ran)
  if (late !== undefined) return late
  if (UNREACHABLE.test(ran.output))
    return { state: 'platform', reason: 'npm could not reach the registry' }
  if (ran.code !== 0)
    return { state: 'failed', problems: [outputProblem(ctx, 'INSTALL_FAILED', ran)] }
  placePlatform(ctx)
  return PASSED
}
