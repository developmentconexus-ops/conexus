import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { STARTER_DIR } from '../starter.ts'
import { PROGRAMS } from './program.ts'

test('o tsconfig do starter tem as opções do check, para o tsc do modelo dar o veredito do check', () => {
  const starter = JSON.parse(readFileSync(join(STARTER_DIR, 'tsconfig.json'), 'utf8'))
  const { paths: starterPaths, ...starterOptions } = starter.compilerOptions
  const { paths: checkPaths, ...checkOptions } = PROGRAMS.screens.compilerOptions
  assert.deepEqual(starterOptions, checkOptions)
  assert.deepEqual(starterPaths, { '@/*': ['./src/*'] })
  assert.deepEqual(checkPaths, { '@/*': ['../../src/*'] })
})
