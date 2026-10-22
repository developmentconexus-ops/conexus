#!/usr/bin/env node
// The check program the machine runs as /opt/conexus/check (decision 0055): it prints the report
// of the app folder on stdout and exits 0, or says on stderr why the machine could not check it and
// exits 2, which the server reads as CHECK_PLATFORM_FAILED.
import { parseArgs } from 'node:util'
import { z } from 'zod'
import { browseInChromium } from './browser.ts'
import { spawnRunner } from './command.ts'
import { PackageGrant } from './report.ts'
import { runCheck } from './run.ts'

const PLATFORM_FAILED = 2

const { values } = parseArgs({
  options: {
    root: { type: 'string' },
    tools: { type: 'string' },
    platform: { type: 'string' },
    grants: { type: 'string' },
  },
})

const Options = z.object({
  root: z.string().min(1),
  tools: z.string().min(1),
  platform: z.string().min(1),
  grants: z.string(),
})

try {
  const options = Options.parse(values)
  const result = await runCheck({
    ...options,
    grants: z.array(PackageGrant).parse(JSON.parse(options.grants)),
    run: spawnRunner,
    browse: browseInChromium,
  })
  if (result.ok) process.stdout.write(`${JSON.stringify(result.value)}\n`)
  else process.stderr.write(`${result.error}\n`)
  process.exitCode = result.ok ? 0 : PLATFORM_FAILED
} catch (error) {
  process.stderr.write(
    `the check stopped: ${error instanceof Error ? error.stack : String(error)}\n`,
  )
  process.exitCode = PLATFORM_FAILED
}
