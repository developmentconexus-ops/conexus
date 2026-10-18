import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { join } from 'node:path'
import type { Readable } from 'node:stream'
import type { LogLine } from '../../../../scripts/log-line.ts'
import { parseLogLine } from '../../../../scripts/log-line.ts'
import type { Lifetime } from './test-database.ts'
import { freePort } from './test-database.ts'

const MAIN = join(import.meta.dirname, '..', 'main.ts')
const PASSWORD_PRELOAD = join(import.meta.dirname, 'test-password-preload.ts')
export type HubProcess = {
  lines: LogLine[]
  /** Resolves on the first line with this message; rejects when the Hub ends without one. */
  until(message: string): Promise<void>
  exited: Promise<number | null>
  kill(signal: NodeJS.Signals): void
}

/**
 * Runs the Hub's program with `env` and `args`, reading both of its pipes. When the test ends, the
 * program is killed if it still runs, and any line it printed outside the log format fails the test.
 */
export function startHub(
  t: Lifetime,
  env: Record<string, string>,
  args: string[] = [],
): HubProcess {
  const child = spawn(process.execPath, ['--import', PASSWORD_PRELOAD, MAIN, ...args], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const lines: LogLine[] = []
  // The test reporter refuses a raw line from an in-process test (scripts/test-reporter.ts); a
  // spawned Hub's pipes reach no reporter, so this is the same rule for them, decided by the same
  // function (code C50, C54, C72).
  const raw: string[] = []
  const waiting = new Map<string, PromiseWithResolvers<void>>()
  function waiterFor(message: string) {
    const waiter = waiting.get(message) ?? Promise.withResolvers<void>()
    waiting.set(message, waiter)
    return waiter
  }
  function read(stream: Readable) {
    let rest = ''
    stream.on('data', (chunk: Buffer) => {
      const texts = `${rest}${chunk}`.split('\n')
      rest = texts.pop() ?? ''
      for (const text of texts.filter(Boolean)) take(text)
    })
    stream.on('end', () => {
      if (rest !== '') take(rest)
    })
  }
  function take(text: string) {
    const line = parseLogLine(text)
    if (line === undefined) raw.push(text)
    else {
      lines.push(line)
      waiterFor(String(line.msg)).resolve()
    }
  }
  read(child.stdout)
  read(child.stderr)
  const closed = once(child, 'close').then(([code]: unknown[]) => {
    for (const [message, waiter] of waiting) {
      waiter.reject(new Error(`the Hub ended without ${message}`))
    }
    return typeof code === 'number' ? code : null
  })
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL')
    await closed
    assert.deepEqual(raw, [], 'the Hub printed lines outside the log format')
  })
  return {
    lines,
    until: (message) => waiterFor(message).promise,
    exited: closed,
    kill: (signal) => child.kill(signal),
  }
}

/** A Hub serving on a free port, listening; `stop` ends it as Compose does and expects exit 0. */
export async function spawnHub(t: Lifetime, env: Record<string, string>) {
  const port = await freePort()
  const edgePort = await freePort()
  const hub = startHub(t, { ...env, HUB_PORT: String(port), HUB_EDGE_PORT: String(edgePort) })
  await hub.until('LISTENING')
  return {
    port,
    edgePort,
    lines: hub.lines,
    stop: async () => {
      hub.kill('SIGTERM')
      assert.equal(await hub.exited, 0)
    },
  }
}
