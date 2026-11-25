import { spawn } from 'node:child_process'

/** What `git` did that no answer of the repository explains: it ran past its budget, or it failed. */
export class GitFault extends Error {
  readonly kind: 'timeout' | 'failed' | 'too-large'

  constructor(kind: GitFault['kind'], message: string, cause?: unknown) {
    super(message, { cause })
    this.name = 'GitFault'
    this.kind = kind
  }
}

// No system or user configuration, no hooks and no prompt: what the server's git does depends only
// on the repository and the arguments it is given.
// `spawn` types `env` as `NodeJS.ProcessEnv`, which the edge's generated declarations give required
// keys in the programs that include them; copying onto a bare object keeps the literal untyped there.
const ENVIRONMENT: NodeJS.ProcessEnv = Object.assign(Object.create(null), {
  PATH: '/usr/local/bin:/usr/bin:/bin',
  LC_ALL: 'C',
  GIT_CONFIG_NOSYSTEM: '1',
  GIT_CONFIG_GLOBAL: '/dev/null',
  GIT_ATTR_NOSYSTEM: '1',
  GIT_TERMINAL_PROMPT: '0',
})

export type GitOptions = {
  /** Killed with SIGKILL when it runs past this (code C57). */
  timeoutMs: number
  /** The most stdout read; past it the process is killed (code C59). */
  maxOutput: number
  input?: Uint8Array | string
  /** Exit codes besides 0 that are an answer, such as 1 for "no"; counted only with a silent stderr. */
  answers?: readonly number[]
}

export type GitOutput = { code: number; stdout: Buffer }

/** Runs `git` with `args` and reads its answer; a refusal of git itself is a `GitFault`. */
export function runGit(args: readonly string[], options: GitOptions): Promise<GitOutput> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', ['-c', 'core.hooksPath=/dev/null', ...args], {
      env: ENVIRONMENT,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: options.timeoutMs,
      killSignal: 'SIGKILL',
    })
    const stdout: Buffer[] = []
    const stderr: Buffer[] = []
    let size = 0
    child.stdout.on('data', (chunk: Buffer) => {
      size += chunk.byteLength
      if (size > options.maxOutput) child.kill('SIGKILL')
      else stdout.push(chunk)
    })
    child.stderr.on('data', (chunk: Buffer) => stderr.push(chunk))
    child.on('error', (cause) => reject(new GitFault('failed', 'git did not start', cause)))
    child.on('close', (code, signal) => {
      const errors = Buffer.concat(stderr).toString('utf8').slice(0, 2_000)
      if (size > options.maxOutput) reject(new GitFault('too-large', 'git wrote past its cap'))
      else if (signal === 'SIGKILL') reject(new GitFault('timeout', 'git ran past its budget'))
      else if (code === 0 || (options.answers?.includes(code ?? -1) && errors === ''))
        resolve({ code: code ?? 0, stdout: Buffer.concat(stdout) })
      else reject(new GitFault('failed', `git exited ${code}: ${errors}`))
    })
    child.stdin.on('error', () => undefined)
    child.stdin.end(options.input ?? '')
  })
}
