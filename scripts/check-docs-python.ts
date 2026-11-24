// Defect: a Python dependency of apps/extraction (decision 0074) has no row in the stack map, or the
// check cannot read the pyproject.toml it sits in. check-docs-stack.ts asks this file for the names.
// The file is parsed as TOML (smol-toml, so a quoted key, a dotted key, an inline table or an
// indented line reads as TOML says), then read by the places a requirement can sit: [project]
// dependencies and optional-dependencies (PEP 621), [dependency-groups] (PEP 735) and
// [build-system] requires (PEP 518). A value of another shape there, or tool.uv.dev-dependencies,
// is refused as `stack-python-unread`, never skipped. Refusals are proved in check-docs-stack.test.ts.
// Revalidate by 2027-04-13, or when apps/extraction moves its dependencies out of these places.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'smol-toml'
import { z } from 'zod'

export const PYTHON_PROJECT = 'apps/extraction/pyproject.toml'

const Requirements = z.array(z.string())
const Pyproject = z.looseObject({
  project: z
    .looseObject({
      dependencies: Requirements.optional(),
      'optional-dependencies': z.record(z.string(), Requirements).optional(),
    })
    .optional(),
  'dependency-groups': z
    .record(
      z.string(),
      z.array(z.union([z.string(), z.looseObject({ 'include-group': z.string() })])),
    )
    .optional(),
  'build-system': z.looseObject({ requires: Requirements.optional() }).optional(),
  tool: z
    .looseObject({ uv: z.looseObject({ 'dev-dependencies': z.never().optional() }).optional() })
    .optional(),
})
type Pyproject = z.infer<typeof Pyproject>

const REQUIREMENT_NAME = /^([A-Za-z0-9][A-Za-z0-9._-]*)/

/** PEP 503: the name a package index and a row of the stack map agree on. */
function normalized(name: string): string {
  return name.toLowerCase().replace(/[-_.]+/g, '-')
}

/** Every requirement string of a read file; an `include-group` entry points at a group and names no package. */
function requirements(file: Pyproject): string[] {
  const groups = Object.values(file['dependency-groups'] ?? {})
  const optional = Object.values(file.project?.['optional-dependencies'] ?? {})
  return [
    ...(file.project?.dependencies ?? []),
    ...optional.flat(),
    ...groups.flat().filter((item) => typeof item === 'string'),
    ...(file['build-system']?.requires ?? []),
  ]
}

/** The names a pyproject.toml declares, normalized, and what the check cannot read of it. */
export function pythonDependencies(root: string): { names: string[]; unread: string[] } {
  const path = join(root, PYTHON_PROJECT)
  if (!existsSync(path)) return { names: [], unread: [] }
  let toml: unknown
  try {
    toml = parse(readFileSync(path, 'utf8'))
  } catch {
    return { names: [], unread: ['not valid TOML'] }
  }
  const read = Pyproject.safeParse(toml)
  if (!read.success) {
    return { names: [], unread: read.error.issues.map((issue) => issue.path.join('.')) }
  }
  const named = requirements(read.data).map((item) => ({
    item,
    name: item.match(REQUIREMENT_NAME)?.[1],
  }))
  return {
    names: [
      ...new Set(named.flatMap(({ name }) => (name === undefined ? [] : [normalized(name)]))),
    ],
    unread: named
      .filter(({ name }) => name === undefined)
      .map(({ item }) => `requirement "${item}"`),
  }
}
