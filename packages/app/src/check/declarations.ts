#!/usr/bin/env node
// Run at the template's build, never by the check: gives the three packages the app's type-check
// reads their types as declarations, so the check does not re-check the kit's Zod sources in every
// app (decision 0055). Usage: declarations.ts <platform folder, the one holding app/ app-contract/ connectors/>.
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import ts from 'typescript'
import { z } from 'zod'

const Manifest = z.looseObject({ exports: z.record(z.string(), z.unknown()) })

/** Each package's entry the app imports, and the `exports` key that names it. */
const ENTRIES = [
  { folder: 'app', entry: 'src/index.ts', key: '.' },
  { folder: 'app-contract', entry: 'src/index.ts', key: '.' },
  { folder: 'connectors', entry: 'src/calls.ts', key: './calls' },
] as const

/** The declaration file of an entry, relative to its package. */
function declarationOf(entry: string): string {
  return `dist/${entry.replace(/^src\//, '').replace(/\.ts$/, '.d.ts')}`
}

/**
 * `tsc --declaration --emitDeclarationOnly` over the entries, then each package's declarations in its
 * own `dist/` and its `exports` reading `{ types: dist, default: sources }`: `default` stays on the
 * sources because the check's manifest step bundles them with esbuild. Packages are resolved through
 * the platform folder's parent `node_modules`, where the workspace links them.
 */
export function declare(platform: string): void {
  const out = mkdtempSync(join(tmpdir(), 'conexus-declarations-'))
  try {
    const program = ts.createProgram({
      rootNames: ENTRIES.map(({ folder, entry }) => join(platform, folder, entry)),
      options: {
        strict: true,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        skipLibCheck: true,
        isolatedModules: true,
        allowImportingTsExtensions: true,
        types: [],
        declaration: true,
        emitDeclarationOnly: true,
        rootDir: platform,
        outDir: out,
      },
    })
    const emitted = program.emit()
    const problems = [...ts.getPreEmitDiagnostics(program), ...emitted.diagnostics]
    if (emitted.emitSkipped || problems.length > 0) {
      const text = ts.formatDiagnostics(problems, {
        getCanonicalFileName: (name) => name,
        getCurrentDirectory: () => platform,
        getNewLine: () => '\n',
      })
      throw new Error(`the SDK's declarations did not build:\n${text}`)
    }
    for (const { folder, entry, key } of ENTRIES) {
      cpSync(join(out, folder, 'src'), join(platform, folder, 'dist'), { recursive: true })
      const file = join(platform, folder, 'package.json')
      const manifest = Manifest.parse(JSON.parse(readFileSync(file, 'utf8')))
      const types = `./${declarationOf(entry)}`
      const exports = { ...manifest.exports, [key]: { types, default: manifest.exports[key] } }
      writeFileSync(file, `${JSON.stringify({ ...manifest, exports }, null, 2)}\n`)
    }
  } finally {
    rmSync(out, { recursive: true, force: true })
  }
}

if (import.meta.main) {
  const [platform] = process.argv.slice(2)
  if (platform === undefined) throw new Error('declarations.ts: the platform folder is missing')
  declare(platform)
}
