import { z } from 'zod'
import { APP_LIMITS } from './limits.ts'

// The manifest of a version, contract 1 (decision 0055): the shipping list the Hub reads when it
// receives a version, its entry, its static files and its migrations (code C26).

const MAX_PATH = 512

/** A relative path of the version's folder: no empty, `.` or `..` segment, never absolute. */
export const FilePath = z
  .string()
  .max(MAX_PATH)
  .regex(/^[A-Za-z0-9_-][A-Za-z0-9._-]*(\/[A-Za-z0-9_-][A-Za-z0-9._-]*)*$/)
  .refine((path) => !path.split('/').some((segment) => segment === '.' || segment === '..'))

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
    // The shapes of the operations, which the manifests before decision 0055's amendment held:
    // accepted so they stay valid (0019), never read. The app's Worker checks every call with the
    // app's own Zod (`serveApp`).
    operations: z.record(z.string(), z.unknown()).optional(),
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
