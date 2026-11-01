#!/usr/bin/env node
// One TypeScript program of the `tipos` step, in a process of its own so its heap is the one the
// step gives it and a crash is the step's outcome: it writes the program's diagnostics as JSON to
// the file it is given, so nothing the process prints can be taken for them.
import { writeFileSync } from 'node:fs'
import { relative } from 'node:path'
import { parseArgs } from 'node:util'
import ts from 'typescript'
import { z } from 'zod'
import type { Problem } from './report.ts'
import { WORK_FOLDER } from './report.ts'
import { problem } from './step.ts'

// The starter's own options (packages/app/starter/tsconfig.json), fixed by the check so the model's
// tsconfig cannot loosen them. The SDK reaches them as declarations (check/declarations.ts).
const BASE = {
  strict: true,
  target: 'ES2022',
  module: 'ESNext',
  moduleResolution: 'bundler',
  noEmit: true,
  skipLibCheck: true,
  isolatedModules: true,
}

/**
 * Two programs from the work folder: the screens against the DOM, and the server and its shared
 * operations against the Worker's globals, so a handler that reaches for `document` fails.
 */
export const PROGRAMS = {
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

const PROGRAM_NAMES = ['screens', 'server'] as const

/** One of the programs, built by TypeScript's own compiler API. */
export function programOf(root: string, name: keyof typeof PROGRAMS): ts.Program {
  const parsed = ts.parseJsonConfigFileContent(PROGRAMS[name], ts.sys, `${root}/${WORK_FOLDER}`)
  return ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options })
}

/** One program's diagnostics, located where the compiler says. */
function diagnosticsOf(root: string, name: keyof typeof PROGRAMS): Problem[] {
  const program = programOf(root, name)
  return ts.getPreEmitDiagnostics(program).map((diagnostic) => {
    const code = `TS${diagnostic.code}`
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
    const { file, start } = diagnostic
    if (file === undefined || start === undefined) return problem({ code, message })
    const { line, character } = file.getLineAndCharacterOfPosition(start)
    return problem({
      code,
      message,
      file: relative(root, file.fileName),
      line: line + 1,
      column: character + 1,
    })
  })
}

if (import.meta.main) {
  const { positionals } = parseArgs({ allowPositionals: true })
  const [name, root, out] = z
    .tuple([z.enum(PROGRAM_NAMES), z.string().min(1), z.string().min(1)])
    .parse(positionals)
  writeFileSync(out, JSON.stringify(diagnosticsOf(root, name)))
}
