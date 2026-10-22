import { existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import ts from 'typescript'
import type { Problem } from './report.ts'
import type { CheckContext, Outcome } from './step.ts'
import { PASSED, problem, workOf } from './step.ts'

// The starter's own options (packages/app/starter/tsconfig.json), fixed by the check so the model's
// tsconfig cannot loosen them; `allowImportingTsExtensions` reads the SDK, which ships its sources.
const BASE = {
  strict: true,
  target: 'ES2022',
  module: 'ESNext',
  moduleResolution: 'bundler',
  noEmit: true,
  skipLibCheck: true,
  isolatedModules: true,
  allowImportingTsExtensions: true,
}

/**
 * Two programs from the work folder: the screens against the DOM, and the server and its shared
 * operations against the Worker's globals, so a handler that reaches for `document` fails.
 */
const PROGRAMS = {
  screens: {
    compilerOptions: {
      ...BASE,
      jsx: 'react-jsx',
      lib: ['ES2022', 'DOM', 'DOM.Iterable'],
      types: ['vite/client'],
      paths: { '@/*': ['../../src/*'] },
    },
    include: ['../../src'],
  },
  server: {
    compilerOptions: { ...BASE, lib: ['ES2022', 'WebWorker'], types: [] },
    include: ['../../server', '../../shared'],
  },
}

/** One program's diagnostics from TypeScript's own compiler API, located where it says. */
function diagnosticsOf(ctx: CheckContext, name: keyof typeof PROGRAMS): Problem[] {
  const parsed = ts.parseJsonConfigFileContent(PROGRAMS[name], ts.sys, workOf(ctx))
  const program = ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options })
  return ts.getPreEmitDiagnostics(program).map((diagnostic) => {
    const code = `TS${diagnostic.code}`
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
    const { file, start } = diagnostic
    if (file === undefined || start === undefined) return problem({ code, message })
    const { line, character } = file.getLineAndCharacterOfPosition(start)
    return problem({
      code,
      message,
      file: relative(ctx.root, file.fileName),
      line: line + 1,
      column: character + 1,
    })
  })
}

export async function tipos(ctx: CheckContext): Promise<Outcome> {
  const serverSide = ['server', 'shared'].some((folder) => existsSync(join(ctx.root, folder)))
  const names = serverSide ? (['screens', 'server'] as const) : (['screens'] as const)
  const problems = names.flatMap((name) => diagnosticsOf(ctx, name))
  return problems.length > 0 ? { state: 'failed', problems } : PASSED
}
