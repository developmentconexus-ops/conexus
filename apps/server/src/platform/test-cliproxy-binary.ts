import { createHash } from 'node:crypto'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { CliProxy } from './config.ts'

type Double = CliProxy & { control: string }
let cliProxyDouble: Double | undefined

/**
 * The CLIProxy double (test-cliproxy.ts) as a program, run by this Node, with its sha256; `control`
 * is the folder of its `mode` and `runs` files.
 */
export function testCliProxy(): Double {
  if (cliProxyDouble !== undefined) return cliProxyDouble
  const dir = mkdtempSync(join(tmpdir(), 'conexus-cliproxy-bin-'))
  // Every test of the process shares it, so it goes when the process ends.
  process.once('exit', () => rmSync(dir, { recursive: true, force: true }))
  const binary = join(dir, 'cli-proxy-api')
  const double = join(import.meta.dirname, 'test-cliproxy.ts')
  const text = `#!/bin/sh\nexec "${process.execPath}" "${double}" --control "${dir}" "$@"\n`
  writeFileSync(binary, text, { mode: 0o700 })
  cliProxyDouble = { binary, control: dir, sha256: createHash('sha256').update(text).digest('hex') }
  return cliProxyDouble
}
