#!/usr/bin/env node
// One TypeScript program of the `tipos` step, in a process of its own so its heap is the one the
// step gives it and a crash is the step's outcome: it prints the program's diagnostics as JSON.
import { relative } from 'node:path'
import { parseArgs } from 'node:util'
import ts from 'typescript'
import { z } from 'zod'
import type { Problem } from './report.ts'
import { WORK_FOLDER } from './report.ts'
import { problem } from './step.ts'

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

const PROGRAM_NAMES = ['screens', 'server'] as const

/** One program's diagnostics from TypeScript's own compiler API, located where it says. */
function diagnosticsOf(root: string, name: keyof typeof PROGRAMS): Problem[] {
  const parsed = ts.parseJsonConfigFileContent(PROGRAMS[name], ts.sys, `${root}/${WORK_FOLDER}`)
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
      file: relative(root, file.fileName),
      line: line + 1,
      column: character + 1,
    })
  })
}

const { positionals } = parseArgs({ allowPositionals: true })
const [name, root] = z.tuple([z.enum(PROGRAM_NAMES), z.string().min(1)]).parse(positionals)
process.stdout.write(JSON.stringify(diagnosticsOf(root, name)))
