import type { MessagePart } from '@conexus/hub-api'
import { SHELL_MAX_BYTES, SHELL_MAX_LINES } from '@conexus/hub-api'
import { masked } from './mask.ts'

/** A running command's lines are said at most this often; all of them once more when it exits. */
const SAID_EVERY_MS = 1000

/**
 * The end of a command's output: the last lines the screen shows, at most `SHELL_MAX_LINES` and
 * `SHELL_MAX_BYTES`, kept as they arrive so a long run holds no more than that.
 */
export class ShellTail {
  #tail = ''
  #saidAt = 0

  add(output: string): void {
    this.#tail = (this.#tail + output).slice(-SHELL_MAX_BYTES * 2)
  }

  /** The `shell` part of the command still running, with no exit code, or none if one was said within `SAID_EVERY_MS`. */
  running(call: string): MessagePart | undefined {
    if (Date.now() - this.#saidAt < SAID_EVERY_MS) return undefined
    this.#saidAt = Date.now()
    return this.part(call, null)
  }

  /** The `shell` part for the command's end: secrets masked before the lines are cut, so one that spans a break is found. */
  part(call: string, exitCode: number | null): MessagePart {
    const lines = masked(this.#tail).split('\n')
    if (lines.at(-1) === '') lines.pop()
    const kept = lines.slice(-SHELL_MAX_LINES)
    while (kept.length > 1 && Buffer.byteLength(kept.join('\n')) > SHELL_MAX_BYTES) kept.shift()
    const [only] = kept
    if (kept.length === 1 && only !== undefined) kept[0] = only.slice(-SHELL_MAX_BYTES)
    return { type: 'shell', toolId: call, lines: kept, exitCode }
  }
}
