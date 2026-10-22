import { DETAIL_LIMITS } from '@conexus/hub-api'
import { masked } from './mask.ts'

/** A running command's lines are said at most this often; all of them once more when it exits. */
const SAID_EVERY_MS = 1000
const { outputLines, outputBytes } = DETAIL_LIMITS

/** The end of a command's output as its row shows it, and whether lines before it were left out. */
export type Tail = { output: string[]; cut: boolean }

/**
 * The end of a command's output: the last lines the row shows, at most `DETAIL_LIMITS.outputLines`
 * and `outputBytes`, kept as they arrive so a long run holds no more than that.
 */
export class ShellTail {
  #tail = ''
  #dropped = false
  #saidAt = 0

  add(output: string): void {
    const joined = this.#tail + output
    this.#tail = joined.slice(-outputBytes * 2)
    this.#dropped ||= this.#tail.length < joined.length
  }

  /** The tail of the command still running, or none if one was said within `SAID_EVERY_MS`. */
  running(): Tail | undefined {
    if (Date.now() - this.#saidAt < SAID_EVERY_MS) return undefined
    this.#saidAt = Date.now()
    return this.tail()
  }

  /** Secrets masked before the lines are cut, so one that spans a break is found. */
  tail(): Tail {
    const lines = masked(this.#tail).split('\n')
    if (lines.at(-1) === '') lines.pop()
    const kept = lines.slice(-outputLines)
    while (kept.length > 1 && Buffer.byteLength(kept.join('\n')) > outputBytes) kept.shift()
    const [only] = kept
    const long = kept.length === 1 && only !== undefined && only.length > outputBytes
    if (long) kept[0] = only.slice(-outputBytes)
    return { output: kept, cut: this.#dropped || long || kept.length < lines.length }
  }
}

/** The end of a whole output, as a command's tail keeps it. */
export function tailOf(output: string): Tail {
  const tail = new ShellTail()
  tail.add(output)
  return tail.tail()
}
