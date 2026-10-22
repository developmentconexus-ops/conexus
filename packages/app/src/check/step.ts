import { join } from 'node:path'
import type { Problem } from './report.ts'
import { WORK_FOLDER } from './report.ts'

/** How one command ended: its exit code (none when it could not start), its output, its deadline. */
export type Ran = Readonly<{ code: number | null; output: string; timedOut: boolean }>

/** Runs a command to its end or its deadline; the check's only door to processes (code C57). */
export type Runner = (
  command: string,
  args: readonly string[],
  options: Readonly<{ cwd: string; timeoutMs: number }>,
) => Promise<Ran>

/** What the browser saw of the built screens: what fails the step and what only informs. */
type Seen = Readonly<{ violations: Problem[]; rootEmpty: boolean; errors: Problem[] }>

/** Opens the built screens under the policy; `unavailable` when there is no browser to open them. */
export type Browser = (
  input: Readonly<{ folder: string; policy: string; timeoutMs: number }>,
) => Promise<Seen | Readonly<{ unavailable: string }>>

export type CheckContext = Readonly<{
  /** The app folder the model writes. */
  root: string
  /** The platform's `node_modules`, with `tsc`, `wrangler` and their kin in `.bin`. */
  tools: string
  /** Where `@conexus/app` and its contract are copied from after the install; none when the app's `node_modules` already holds them. */
  platform: string | undefined
  run: Runner
  browse: Browser
}>

/**
 * How a step ended. `platform` is no verdict on the app: the machine could not run the step (no
 * browser, the registry out of reach, the step's minute spent), and the whole check stops.
 */
export type Outcome =
  | Readonly<{ state: 'passed' }>
  | Readonly<{ state: 'failed' | 'informed'; problems: Problem[] }>
  | Readonly<{ state: 'platform'; reason: string }>

export const PASSED: Outcome = Object.freeze({ state: 'passed' })

export function workOf(ctx: Pick<CheckContext, 'root'>, ...path: string[]): string {
  return join(ctx.root, WORK_FOLDER, ...path)
}

export function problem(
  fields: Readonly<{ code: string; message: string } & Partial<Omit<Problem, 'code' | 'message'>>>,
): Problem {
  return { file: null, line: null, column: null, ...fields }
}

/** A tool's whole output as one problem, verbatim: the tool's own words, with no location of ours guessed from them. */
export function outputProblem(code: string, ran: Ran): Problem {
  return problem({ code, message: ran.output.trim() || `exited with ${ran.code}` })
}

/** A command that spent its minute is the platform's failure, not the app's (card step 14, U4). */
export function overran(step: string, ran: Ran): Outcome | undefined {
  return ran.timedOut ? { state: 'platform', reason: `${step} passed its time` } : undefined
}
