import { execFileSync, spawnSync } from 'node:child_process'

const DEFAULT_DEADLINE_MS = 30_000

function deadlineMs(): number {
  const override = Number(process.env.CONEXUS_COMMAND_DEADLINE_MS)
  return Number.isInteger(override) && override > 0 ? override : DEFAULT_DEADLINE_MS
}

function timedOut(file: string, deadline: number): never {
  console.error(`${file} did not answer within ${deadline} ms`)
  process.exit(1)
}

/** Runs `file` and returns its standard output; a command that outlives its deadline ends the script. */
export function runCommand(
  file: string,
  args: string[],
  options: { cwd: string; stderr?: 'pipe' | 'ignore'; deadline?: number },
): string {
  const deadline = options.deadline ?? deadlineMs()
  try {
    return execFileSync(file, args, {
      cwd: options.cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', options.stderr ?? 'ignore'],
      timeout: deadline,
      killSignal: 'SIGKILL',
    })
  } catch (error) {
    if (error instanceof Error && Reflect.get(error, 'code') === 'ETIMEDOUT') {
      timedOut(file, deadline)
    }
    throw error
  }
}

export function spawnCommand(
  file: string,
  args: string[],
  options: { cwd: string; deadline: number },
): { status: number | null; output: string } {
  const run = spawnSync(file, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    timeout: options.deadline,
    killSignal: 'SIGKILL',
  })
  if (run.error !== undefined && Reflect.get(run.error, 'code') === 'ETIMEDOUT') {
    timedOut(file, options.deadline)
  }
  return { status: run.status, output: `${run.stdout}${run.stderr}` }
}
