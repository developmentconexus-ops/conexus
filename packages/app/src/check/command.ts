import { spawn } from 'node:child_process'
import { stripVTControlCharacters } from 'node:util'
import type { Runner } from './step.ts'

/** The most of a command's output kept, in characters (Conexus OS `e0353c36` `check/exec.ts:7`); the first problems come first. */
const OUTPUT_CHARS = 4_000_000

function killGroup(pid: number | undefined) {
  if (pid === undefined) return
  try {
    process.kill(-pid, 'SIGKILL')
  } catch (error) {
    if (Reflect.get(Object(error), 'code') !== 'ESRCH') throw error
  }
}

/**
 * Each command in its own process group, killed whole at its deadline, so nothing it started
 * outlives the step (code C57).
 */
export function spawnRunner(
  ...[command, args, { cwd, timeoutMs }]: Parameters<Runner>
): ReturnType<Runner> {
  return new Promise((done) => {
    let output = ''
    let timedOut = false
    const child = spawn(command, [...args], {
      cwd,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    function keep(chunk: unknown) {
      if (output.length < OUTPUT_CHARS) output += String(chunk)
    }
    child.stdout.on('data', keep)
    child.stderr.on('data', keep)
    const timer = setTimeout(() => {
      timedOut = true
      killGroup(child.pid)
    }, timeoutMs)
    child.once('error', (error) => {
      clearTimeout(timer)
      done({ code: null, output: error.message, timedOut })
    })
    child.once('close', (code) => {
      clearTimeout(timer)
      killGroup(child.pid)
      done({ code, output: stripVTControlCharacters(output), timedOut })
    })
  })
}
