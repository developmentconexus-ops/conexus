// Defect: a version written in docs/reference/boundaries.md, or in a "Mastra N.N.N" comment in
// code, keeps naming a release the lockfile no longer installs, so a reader trusts a library line
// that was read at another version (code C75). A package the lockfile does not hold is a candidate
// read from the registry and is not checked. Tests and fixtures record when something was seen and
// are not checked. Refusals are proved by planting each one in check-boundaries.test.ts.
// Revalidate by 2027-04-25, or when boundaries.md names a package by a new display name.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { z } from 'zod'

const root = resolve(process.argv[2] ?? '.')
const SKIPPED = new Set(['node_modules', '.git', 'dist', 'coverage'])
const CODE = /\.[cm]?tsx?$/
const OBSERVATION = /\.test\.[cm]?tsx?$|fixtures?\.[cm]?tsx?$/
const VERSION = String.raw`\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?`

/** The display names boundaries.md writes before a version, and the package each one means. */
const PACKAGES: Record<string, string> = {
  'Better Auth': 'better-auth',
  'TanStack Router': '@tanstack/react-router',
  'TanStack Query': '@tanstack/react-query',
  'React Email': 'react-email',
  'React Hook Form': 'react-hook-form',
  renderer: '@react-email/render',
  Fastify: 'fastify',
  Drizzle: 'drizzle-orm',
  Mastra: '@mastra/core',
  '@mastra/fastify': '@mastra/fastify',
  '@neon/sdk': '@neon/sdk',
  Zod: 'zod',
  pg: 'pg',
  esbuild: 'esbuild',
  wrangler: 'wrangler',
  Node: 'node',
}

const lock = z
  .object({ packages: z.record(z.string(), z.object({ version: z.string().optional() })) })
  .parse(JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8')))

function installed(name: string): string | undefined {
  if (name !== 'node') return lock.packages[`node_modules/${name}`]?.version
  const nvmrc = join(root, '.nvmrc')
  return existsSync(nvmrc) ? readFileSync(nvmrc, 'utf8').trim().replace(/^v/, '') : undefined
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    if (SKIPPED.has(name)) return []
    const path = join(dir, name)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

const problems: string[] = []
function check(where: string, name: string, written: string) {
  const real = installed(PACKAGES[name] ?? name)
  if (real !== undefined && real !== written)
    problems.push(`boundaries-pin-stale: ${where}: ${name} ${written} is ${real} in the lockfile`)
}

const NAMES = Object.keys(PACKAGES)
  .sort((a, b) => b.length - a.length)
  .map((name) => name.replace(/[/@]/g, '\\$&'))
  .join('|')
const PIN = new RegExp(String.raw`(?<![\w-])\`?(${NAMES})\`?\s+(${VERSION})(?![\w.])`, 'g')

const boundaries = 'docs/reference/boundaries.md'
if (existsSync(join(root, boundaries))) {
  readFileSync(join(root, boundaries), 'utf8')
    .split('\n')
    .forEach((line, index) => {
      for (const [, name = '', version = ''] of line.matchAll(PIN)) {
        // "Node 24.8.0" in a sentence is the release that added an API, not the installed one.
        if (name === 'Node' && !line.startsWith('## ')) continue
        check(`${boundaries}:${index + 1}`, name, version)
      }
    })
}

const MASTRA_COMMENT = /Mastra (\d+\.\d+\.\d+)/g
for (const folder of ['apps', 'packages', 'scripts']) {
  if (!existsSync(join(root, folder))) continue
  for (const path of walk(join(root, folder))) {
    const file = relative(root, path)
    if (!CODE.test(file) || OBSERVATION.test(file) || file.startsWith('scripts/check-boundaries'))
      continue
    readFileSync(path, 'utf8')
      .split('\n')
      .forEach((line, index) => {
        for (const [, version = ''] of line.matchAll(MASTRA_COMMENT))
          check(`${file}:${index + 1}`, 'Mastra', version)
      })
  }
}

if (problems.length > 0) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log('check-boundaries: pins match the lockfile')
