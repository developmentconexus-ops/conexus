import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { STARTER_DIR } from '@conexus/app/starter'
import { z } from 'zod'

const Manifest = z.object({
  dependencies: z.record(z.string(), z.string()).default({}),
  devDependencies: z.record(z.string(), z.string()).default({}),
})

/**
 * The packages an app may import without asking: the ones the starter's `package.json` declares,
 * which is the one list (code C26).
 */
export const PREAPPROVED_PACKAGES: ReadonlySet<string> = (() => {
  const manifest = Manifest.parse(
    JSON.parse(readFileSync(join(STARTER_DIR, 'package.json'), 'utf8')),
  )
  return new Set([...Object.keys(manifest.dependencies), ...Object.keys(manifest.devDependencies)])
})()
