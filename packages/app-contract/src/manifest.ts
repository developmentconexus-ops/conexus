import { z } from 'zod'
import { APP_LIMITS } from './limits.ts'

// The manifest of a version, contract 1 (zero or more operations, decision 0055): what the Hub checks when it receives a version and what the
// app's runtime checks on every call, from one schema (code C26). Its vocabulary of shapes is the old
// manifest's (string, number, boolean, object, array, at most six levels); a shape may admit null.

const MAX_DEPTH = 6
const MAX_PATH = 512

/** A property or operation name: letters and digits, starting with a letter. */
const Name = z.string().regex(/^[A-Za-z][A-Za-z0-9_]{0,63}$/)

/** The name of an operation, marked so a port takes it only from here (code C23). */
export const OperationName = Name.brand<'OperationName'>()
export type OperationName = z.infer<typeof OperationName>

/** A relative path of the version's folder: no empty, `.` or `..` segment, never absolute. */
export const FilePath = z
  .string()
  .max(MAX_PATH)
  .regex(/^[A-Za-z0-9_-][A-Za-z0-9._-]*(\/[A-Za-z0-9_-][A-Za-z0-9._-]*)*$/)
  .refine((path) => !path.split('/').some((segment) => segment === '.' || segment === '..'))

const nullable = z.literal(true).optional()
const length = z.int().min(0).max(1_000_000).optional()
const bound = z.number().optional()

export type Shape =
  | Readonly<{
      type: 'string'
      enum?: string[]
      minLength?: number
      maxLength?: number
      nullable?: true
    }>
  | Readonly<{ type: 'integer' | 'number'; minimum?: number; maximum?: number; nullable?: true }>
  | Readonly<{ type: 'boolean'; nullable?: true }>
  | Readonly<{ type: 'array'; items: Shape; maxItems?: number; nullable?: true }>
  | Readonly<{
      type: 'object'
      properties: Record<string, Shape>
      required?: string[]
      nullable?: true
    }>

export const Shape: z.ZodType<Shape> = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('string'),
    enum: z.array(z.string()).min(1).optional(),
    minLength: length,
    maxLength: length,
    nullable,
  }),
  z.strictObject({ type: z.enum(['integer', 'number']), minimum: bound, maximum: bound, nullable }),
  z.strictObject({ type: z.literal('boolean'), nullable }),
  z.strictObject({
    type: z.literal('array'),
    get items() {
      return Shape
    },
    maxItems: length,
    nullable,
  }),
  z
    .strictObject({
      type: z.literal('object'),
      get properties() {
        return z.record(Name, Shape)
      },
      required: z.array(Name).optional(),
      nullable,
    })
    .refine(
      (shape) => (shape.required ?? []).every((key) => Object.hasOwn(shape.properties, key)),
      {
        message: 'required names a property not declared',
      },
    ),
])

function depthOf(shape: Shape): number {
  if (shape.type === 'array') return 1 + depthOf(shape.items)
  if (shape.type === 'object') {
    return 1 + Math.max(0, ...Object.values(shape.properties).map(depthOf))
  }
  return 1
}

const Operation = z.strictObject({ input: Shape, output: Shape })

/**
 * A statement that ends, splits or reconfigures the migrations' one transaction (0046): a COMMIT
 * would keep the earlier migrations alone, and a SET would lift the statement's time ceiling.
 * Read at the statement's first word, past any leading comment.
 */
const SESSION_CONTROL =
  /^(?:\s|--[^\n]*\n|\/\*[\s\S]*?\*\/)*(?:begin|start|commit|end|rollback|abort|savepoint|release|prepare|set|reset|discard)\b/i

const Migration = z.strictObject({
  id: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/),
  // One statement per item, so a migration is applied whole in one transaction (0043, check 11).
  statements: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .refine((statement) => !SESSION_CONTROL.test(statement)),
    )
    .min(1),
})

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length
}

export const Manifest = z
  .strictObject({
    contract: z.literal(1),
    entry: FilePath.refine((path) => path.endsWith('.js')),
    operations: z
      .record(OperationName, Operation)
      .refine((operations) =>
        Object.values(operations).every(
          ({ input, output }) => depthOf(input) <= MAX_DEPTH && depthOf(output) <= MAX_DEPTH,
        ),
      ),
    migrations: z.array(Migration).refine((list) => unique(list.map(({ id }) => id))),
    assets: z
      .array(FilePath)
      .max(APP_LIMITS.files)
      .refine((paths) => unique(paths)),
  })
  .refine((manifest) => !manifest.assets.includes(manifest.entry))
export type Manifest = z.infer<typeof Manifest>

/** Where the static files sit in a version's folder, beside the manifest and the entry module. */
export const ASSETS_FOLDER = 'assets'

/** Every file a version's folder must hold besides `manifest.json`, by its path in the folder. */
export function versionFiles(manifest: Manifest): string[] {
  return [manifest.entry, ...manifest.assets.map((path) => `${ASSETS_FOLDER}/${path}`)]
}

/** The runtime check of one value against its shape, built from the manifest's own words. */
export function schemaOf(shape: Shape): z.ZodType {
  const base = baseSchemaOf(shape)
  return shape.nullable === true ? base.nullable() : base
}

function baseSchemaOf(shape: Shape): z.ZodType {
  switch (shape.type) {
    case 'string': {
      let text = z.string()
      if (shape.minLength !== undefined) text = text.min(shape.minLength)
      if (shape.maxLength !== undefined) text = text.max(shape.maxLength)
      const allowed = shape.enum
      return allowed === undefined ? text : text.refine((value) => allowed.includes(value))
    }
    case 'integer':
    case 'number': {
      let number = shape.type === 'integer' ? z.int() : z.number()
      if (shape.minimum !== undefined) number = number.min(shape.minimum)
      if (shape.maximum !== undefined) number = number.max(shape.maximum)
      return number
    }
    case 'boolean':
      return z.boolean()
    case 'array': {
      const list = z.array(schemaOf(shape.items))
      return shape.maxItems === undefined ? list : list.max(shape.maxItems)
    }
    case 'object': {
      const required = new Set(shape.required ?? [])
      const fields = Object.entries(shape.properties).map(([key, property]) => {
        const field = schemaOf(property)
        return [key, required.has(key) ? field : field.optional()] as const
      })
      return z.strictObject(Object.fromEntries(fields))
    }
    default:
      return shape satisfies never
  }
}
