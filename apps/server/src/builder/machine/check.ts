import { CHECK_LIMITS, CheckReport, STEP_NAMES } from '@conexus/app/check'
import type { FailureLog } from '../../platform/failure.ts'
import type { Result } from '../../platform/result.ts'
import { parsedWith } from './pack.ts'
import { quoted } from './scripts.ts'

/** Where the template puts the check program (decision 0055): a tool of the machine, read only. */
export const CHECK_PROGRAM = '/opt/conexus/check'

/**
 * How long the command may run: each step's own minute (card step 14, "Os limites"), and one more
 * for the program's start and the copies between steps, which no step's budget covers (code C57).
 */
const CHECK_BUDGET_MS = (STEP_NAMES.length + 1) * CHECK_LIMITS.stepMs

export type TimedExec = (
  script: string,
  timeoutMs: number,
) => Promise<{ exitCode: number; stdout: string; stderr: string }>

/** The machine checked nothing: no verdict on the app, and no attempt of the turn's. */
export type CheckPlatformFailed = 'CHECK_PLATFORM_FAILED'

/**
 * Runs the check program over the app folder, and reads its report at
 * the boundary (code C27). Anything else (a refused command, the program's exit 2, a reply that is
 * not a report) is the platform's failure, logged with its reason (code C50).
 */
export async function checkIn(
  input: Readonly<{
    exec: TimedExec
    program: string
    workdir: string
    log: FailureLog
  }>,
): Promise<Result<CheckReport, CheckPlatformFailed>> {
  const { exec, program, workdir, log } = input
  const script = `${quoted(program)} --root ${quoted(workdir)}`
  const failed = { ok: false, error: 'CHECK_PLATFORM_FAILED' } as const
  let ran: Awaited<ReturnType<TimedExec>>
  try {
    ran = await exec(script, CHECK_BUDGET_MS)
  } catch (cause) {
    log.error({ reason: 'COMMAND', cause: String(cause).slice(0, 500) }, 'CHECK_PLATFORM_FAILED')
    return failed
  }
  if (ran.exitCode !== 0) {
    const reason = ran.stderr.trim().slice(-500)
    log.error({ reason: 'EXIT', exitCode: ran.exitCode, detail: reason }, 'CHECK_PLATFORM_FAILED')
    return failed
  }
  const report = parsedWith(CheckReport, ran.stdout)
  if (!report.success) {
    log.error({ reason: 'REPORT' }, 'CHECK_PLATFORM_FAILED')
    return failed
  }
  return { ok: true, value: report.data }
}
