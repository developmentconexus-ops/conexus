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

/**
 * The note `execute_command` writes into its result when it cut the output for the model: Mastra
 * 1.78.0 `dist/workspace-*.js`, from `workspace/tools/output-helpers.ts` (`applyTail`,
 * `applyTokenLimit`, `applyTokenLimitSandwich`, `noteDroppedOutput`). Mastra says the cut only there: its
 * `data-sandbox-exit` has no such field, the tool has no option to leave the note out, and the
 * streamed lines without it are transient, never stored.
 */
const MASTRA_CUT =
  /^\[(?:showing last \d+ of \d+ lines|(?:\.\.\.)?output truncated\b.*|(?:stdout|stderr): the first \d+ bytes were dropped;.*)\]$/

/**
 * The output alone of `execute_command`'s result, which Mastra 1.78.0 writes for the model around
 * the two streams (`formatCommandOutput`, `appendTerminalLine` and `executeCommand`, in
 * `dist/workspace-*.js` from `workspace/tools/execute-command.ts`): a `stdout:` and a `stderr:`
 * header when stderr has lines, `(no output)` when neither has, and after a command that failed a
 * last line with its exit code, which `data-sandbox-exit` holds, a cancelled run's note before it.
 * The streams themselves are never stored apart: `data-sandbox-stdout` and `-stderr` are transient.
 */
function printedOf(result: string, exitCode: number | null): string {
  if (result === '(no output)') return ''
  let text = result
  if (exitCode !== null && text.endsWith(`Exit code: ${exitCode}`)) {
    const lines = text.split('\n').slice(0, -1)
    if (/^(?:Command aborted: |The run was cancelled )/.test(lines.at(-1) ?? '')) lines.pop()
    text = lines.join('\n').replace(/\n+$/, '')
  }
  if (text.startsWith('stderr:\n')) return text.slice('stderr:\n'.length)
  const both = text.startsWith('stdout:\n') ? text.lastIndexOf('\n\nstderr:\n') : -1
  if (both === -1) return text
  const stdout = text.slice('stdout:\n'.length, both)
  const stderr = text.slice(both + '\n\nstderr:\n'.length)
  return stdout.endsWith('\n') ? stdout + stderr : `${stdout}\n${stderr}`
}

/**
 * The end of a command's result as Mastra keeps it, as a command's tail keeps it: its output
 * alone, and only what follows Mastra's last note of a cut, which the row says with `cut`.
 */
export function tailOf(result: string, exitCode: number | null): Tail {
  const printed = printedOf(result, exitCode)
  const lines = printed.split('\n')
  const note = lines.findLastIndex((line) => MASTRA_CUT.test(line))
  const tail = new ShellTail()
  tail.add(note === -1 ? printed : lines.slice(note + 1).join('\n'))
  const kept = tail.tail()
  return { output: kept.output, cut: kept.cut || note !== -1 }
}
