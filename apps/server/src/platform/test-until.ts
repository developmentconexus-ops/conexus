import assert from 'node:assert/strict'
import { setTimeout as sleep } from 'node:timers/promises'

/** Resolves once `holds` is true, asked again every 50 ms; fails naming `what` past `ms`. */
export async function until(holds: () => boolean | Promise<boolean>, what: string, ms = 10_000) {
  const deadline = Date.now() + ms
  while (!(await holds())) {
    assert.ok(Date.now() < deadline, `${what} within ${ms} ms`)
    await sleep(50)
  }
}
