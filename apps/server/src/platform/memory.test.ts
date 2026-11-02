import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Scalar } from './failure.ts'
import { watchMemory } from './memory.ts'

test('a linha HUB_MEMORY do minuto traz o atraso do laço e o processador', async (t) => {
  const lines: { fields: Record<string, Scalar>; message: string }[] = []
  const log = {
    info: (fields: Record<string, Scalar>, message: string) => lines.push({ fields, message }),
    error: () => undefined,
  }
  t.mock.timers.enable({ apis: ['setInterval'] })
  watchMemory(log)
  const busyUntil = Date.now() + 50
  while (Date.now() < busyUntil) Math.sqrt(Math.random())
  await new Promise((resolve) => setTimeout(resolve, 30))
  t.mock.timers.tick(60_000)
  const [line] = lines
  assert.equal(line?.message, 'HUB_MEMORY')
  assert.ok(Number(line?.fields.loopDelayP99Ms) > 0, String(line?.fields.loopDelayP99Ms))
  assert.ok(Number(line?.fields.cpuPercent) > 0, String(line?.fields.cpuPercent))
  assert.equal(typeof line?.fields.heapUsedMib, 'number')
})
