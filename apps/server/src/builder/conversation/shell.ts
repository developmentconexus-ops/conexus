import type { MessagePart } from '@conexus/hub-api'
import { SHELL_MAX_BYTES, SHELL_MAX_LINES } from '@conexus/hub-api'
import { masked } from './mask.ts'

/**
 * The end of a command's output: the last lines the screen shows, at most `SHELL_MAX_LINES` and
 * `SHELL_MAX_BYTES`, kept as they arrive so a long run holds no more than that.
 */
export class ShellTail {
  #tail = ''

  add(output: string): void {
    this.#tail = (this.#tail + output).slice(-SHELL_MAX_BYTES * 2)
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
