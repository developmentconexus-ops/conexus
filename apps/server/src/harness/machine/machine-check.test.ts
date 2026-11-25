import assert from 'node:assert/strict'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { STEP_NAMES } from '@conexus/app/check'
import { CONVERSATION, world } from './test-machine.ts'

const REPORT = {
  ok: true,
  steps: STEP_NAMES.map((name) => ({ name, state: 'passed', problems: [] })),
}

/** A machine whose check program is a script of the test's: it keeps its arguments and does `body`. */
async function machineChecking(t: TestContext, body: string) {
  const tools = mkdtempSync(join(tmpdir(), 'conexus-check-program-'))
  t.after(() => rmSync(tools, { recursive: true, force: true }))
  const program = join(tools, 'check')
  writeFileSync(program, `#!/bin/sh\nprintf '%s\\n' "$@" > ${tools}/args\n${body}\n`)
  chmodSync(program, 0o755)
  const machine = await world(t, 5_000, undefined, undefined, { checkProgram: program })
  await machine.open()
  return { ...machine, args: () => readFileSync(join(tools, 'args'), 'utf8').split('\n') }
}

test('Machines.check: roda o programa na pasta do app e lê o relatório', async (t) => {
  const { machines, args, folder } = await machineChecking(t, `echo '${JSON.stringify(REPORT)}'`)
  assert.deepEqual(await machines.check({ conversationId: CONVERSATION }), {
    ok: true,
    value: REPORT,
  })
  assert.deepEqual(args().slice(0, 2), ['--root', join(folder, 'app')])
})

test('Machines.check: o programa sem relatório, ou que diz que a máquina falhou, é CHECK_PLATFORM_FAILED', async (t) => {
  const failed = { ok: false, error: 'CHECK_PLATFORM_FAILED' }
  const platform = await machineChecking(t, "echo 'navegador: Chromium did not start' >&2; exit 2")
  assert.deepEqual(await platform.machines.check({ conversationId: CONVERSATION }), failed)
  const garbled = await machineChecking(t, 'echo \'{"ok": true}\'')
  assert.deepEqual(await garbled.machines.check({ conversationId: CONVERSATION }), failed)
})
