// Defect: a pull request adds a dependency nobody sees, so the review cannot ask whether it is one
// of the expensive choices (delivery L16).
// The refusal to hide one is proved by planting a new dependency in list-new-dependencies.test.ts.
// Revalidate by 2027-04-13, or when a dependency can enter outside a package.json.
import { appendFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runCommand } from './command.ts'

const SECTIONS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index === -1 ? undefined : process.argv[index + 1]
}

const base = option('--base')
if (base === undefined) {
  console.error('list-new-dependencies: --base <ref> is required')
  process.exit(2)
}
const root = resolve(option('--root') ?? '.')

function git(...args: string[]): string {
  return runCommand('git', args, { cwd: root })
}

function manifests(ref: string): string[] {
  return git('ls-tree', '-r', '--name-only', ref)
    .split('\n')
    .filter((file) => file === 'package.json' || file.endsWith('/package.json'))
}

function dependencies(ref: string, file: string): Map<string, string> {
  let manifest: Record<string, Record<string, string> | undefined>
  try {
    manifest = JSON.parse(git('show', `${ref}:${file}`))
  } catch {
    return new Map()
  }
  return new Map(
    SECTIONS.flatMap((section) =>
      Object.entries(manifest[section] ?? {}).map(
        ([name, range]) => [`${section} ${name}`, range] as const,
      ),
    ),
  )
}

const added: string[] = []
for (const file of manifests('HEAD')) {
  const before = dependencies(base, file)
  for (const [key, range] of dependencies('HEAD', file)) {
    if (before.has(key)) continue
    const [section = '', name = ''] = key.split(' ')
    added.push(`| \`${name}\` | \`${range}\` | ${section} | \`${file}\` |`)
  }
}

const summary =
  added.length === 0
    ? 'No new dependency in this pull request.\n'
    : `## New dependencies\n\n| Name | Range | Section | Package |\n| --- | --- | --- | --- |\n${added.join('\n')}\n`
console.log(summary)
const summaryFile = process.env.GITHUB_STEP_SUMMARY
if (summaryFile !== undefined && summaryFile !== '') appendFileSync(summaryFile, summary)
