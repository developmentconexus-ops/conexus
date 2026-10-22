import { Manifest, OperationName, Shape } from '@conexus/app-contract'
import { z } from 'zod'
import type { Operations } from './operations.ts'
import type { Result } from './result.ts'

/** Why a manifest could not be made: the operation and the place in its shape, or the part. */
export type ManifestRefused =
  | Readonly<{
      code: 'MANIFEST_SHAPE_UNSUPPORTED'
      operation: OperationName
      path: readonly string[]
    }>
  | Readonly<{ code: 'MANIFEST_INVALID'; path: readonly string[] }>

// The Zod nodes the manifest's shapes can say. Anything else (a union of objects, a transform, a
// default, a refinement) is refused, not dropped, so what a handler's types promise is what the
// runtime checks.
const SAYABLE = new Set([
  'string',
  'number',
  'boolean',
  'array',
  'object',
  'enum',
  'nullable',
  'optional',
])

const Fields = z.record(z.string(), z.unknown())

/** A place in a schema as its reader counts it: property names, and `[]` for an array's item. */
function pathOf(jsonPath: readonly PropertyKey[]): string[] {
  const path: string[] = []
  for (let at = 0; at < jsonPath.length; at += 1) {
    if (jsonPath[at] === 'properties') {
      path.push(String(jsonPath[at + 1]))
      at += 1
    } else if (jsonPath[at] === 'items') path.push('[]')
  }
  return path
}

/** `{type: [t, 'null']}` or `{anyOf: [node, {type: 'null'}]}` is the manifest's `nullable: true`. */
function nullableOf(fields: Readonly<Record<string, unknown>>) {
  const { type, anyOf, ...rest } = fields
  if (Array.isArray(type) && type.length === 2 && type.includes('null')) {
    return { ...rest, type: type.find((kind) => kind !== 'null'), nullable: true }
  }
  if (Array.isArray(anyOf) && anyOf.length === 2) {
    const nodes = anyOf.map((node) => Fields.safeParse(node).data)
    const none = nodes.findIndex((node) => node?.type === 'null' && Object.keys(node).length === 1)
    const inner = nodes[1 - none]
    if (none >= 0 && inner !== undefined) return { ...inner, nullable: true }
  }
  return fields
}

/**
 * Zod's JSON Schema as the manifest's `Shape` reads it: `z.int()` bounds itself to the safe integers
 * (the manifest means that by `integer`) and a strict object says `additionalProperties: false`
 * (a shape's objects are always strict). Every other keyword stays, for `Shape` to refuse.
 */
function normalized(node: unknown): unknown {
  const parsed = Fields.safeParse(node)
  if (!parsed.success) return node
  const fields = nullableOf(parsed.data)
  const integer = fields.type === 'integer'
  const kept = Object.entries(fields).filter(
    ([key, value]) =>
      key !== '$schema' &&
      !(key === 'additionalProperties' && value === false) &&
      !(integer && key === 'minimum' && value === -Number.MAX_SAFE_INTEGER) &&
      !(integer && key === 'maximum' && value === Number.MAX_SAFE_INTEGER),
  )
  return Object.fromEntries(
    kept.map(([key, value]) => {
      if (key === 'items') return [key, normalized(value)]
      const properties = key === 'properties' ? Fields.safeParse(value).data : undefined
      if (properties === undefined) return [key, value]
      return [
        key,
        Object.fromEntries(
          Object.entries(properties).map(([name, property]) => [name, normalized(property)]),
        ),
      ]
    }),
  )
}

function shapeOf(schema: z.ZodType): Result<Shape, string[]> {
  const unsayable: string[][] = []
  const json = z.toJSONSchema(schema, {
    io: 'input',
    unrepresentable: 'any',
    override({ zodSchema, path }) {
      const { type, checks = [] } = zodSchema._zod.def
      if (!SAYABLE.has(type) || checks.some((check) => check._zod.def.check === 'custom')) {
        unsayable.push(pathOf(path))
      }
    },
  })
  const first = unsayable[0]
  if (first !== undefined) return { ok: false, error: first }
  const shape = Shape.safeParse(normalized(json))
  if (shape.success) return { ok: true, value: shape.data }
  return { ok: false, error: pathOf(shape.error.issues[0]?.path ?? []) }
}

function unsupported(operation: OperationName, path: string[]): Result<never, ManifestRefused> {
  return { ok: false, error: { code: 'MANIFEST_SHAPE_UNSUPPORTED', operation, path } }
}

/**
 * The manifest of an app from its operations, written in Zod (decision 0055): the shapes come from
 * `z.toJSONSchema` (`io: 'input'`), read by the contract's own `Shape`, and the whole by `Manifest`,
 * so what is returned is what the Hub will accept. No operations is an app without a server.
 */
export function manifestOf(
  app: Readonly<{
    operations?: Operations
    migrations: Manifest['migrations']
    assets: Manifest['assets']
  }>,
): Result<Manifest, ManifestRefused> {
  const operations: Record<string, { input: Shape; output: Shape }> = {}
  for (const [name, spec] of Object.entries(app.operations ?? {})) {
    const operation = OperationName.safeParse(name)
    if (!operation.success)
      return { ok: false, error: { code: 'MANIFEST_INVALID', path: ['operations', name] } }
    const input = shapeOf(spec.input)
    if (!input.ok) return unsupported(operation.data, ['input', ...input.error])
    const output = shapeOf(spec.output)
    if (!output.ok) return unsupported(operation.data, ['output', ...output.error])
    operations[name] = { input: input.value, output: output.value }
  }
  const manifest = Manifest.safeParse({
    contract: 1,
    entry: 'worker.js',
    operations,
    migrations: app.migrations,
    assets: app.assets,
  })
  if (manifest.success) return { ok: true, value: manifest.data }
  const path = (manifest.error.issues[0]?.path ?? []).map(String)
  return { ok: false, error: { code: 'MANIFEST_INVALID', path } }
}
