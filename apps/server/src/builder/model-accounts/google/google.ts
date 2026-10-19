import type { ChildProcess } from 'node:child_process'
import { spawn } from 'node:child_process'
import { createHash, randomBytes } from 'node:crypto'
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { ProviderId } from '@conexus/hub-api'
import { z } from 'zod'
import type { CliProxy } from '../../../platform/config.ts'
import type { FailureLog } from '../../../platform/failure.ts'
import { Failure } from '../../../platform/failure.ts'
import { Credential } from '../../../platform/seal.ts'
import type { SignInFlow } from '../sign-ins.ts'

const READY_MS = 20_000
const LOGIN_MS = 120_000
const POLL_MS = 500

export type Process = { child: ChildProcess; dir: string; port: number; key: string }
export type Deps = { cliProxy: CliProxy; log: FailureLog }

const AuthUrl = z.object({ url: z.url(), state: z.string().min(1) })
const AuthStatus = z.object({ status: z.string().optional() })

async function freePort(): Promise<number> {
  const server = createServer()
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const address = server.address()
  await new Promise((resolve) => server.close(resolve))
  if (address === null || typeof address === 'string') throw new Failure('CLIPROXY_UNAVAILABLE')
  return address.port
}

// The process listens on 127.0.0.1 alone, its panel off, its logins in its own folder (C57, S36).
function configOf(port: number, key: string, dir: string): string {
  return [
    'config-version: 8',
    'server:',
    '  host: "127.0.0.1"',
    `  port: ${port}`,
    'management:',
    '  allow-remote: false',
    `  secret-key: "${key}"`,
    '  disable-control-panel: true',
    '  disable-auto-update-panel: true',
    'oauth:',
    `  auth-dir: "${join(dir, 'auths')}"`,
    '',
  ].join('\n')
}

function management(process: Pick<Process, 'port' | 'key'>, path: string, init: RequestInit = {}) {
  return fetch(`http://127.0.0.1:${process.port}/v0/management${path}`, {
    ...init,
    signal: AbortSignal.timeout(READY_MS),
    headers: { authorization: `Bearer ${process.key}`, 'content-type': 'application/json' },
  })
}

export async function end(process: Process) {
  if (process.child.exitCode === null && process.child.signalCode === null) {
    const exited = new Promise((resolve) => process.child.once('exit', resolve))
    process.child.kill('SIGKILL')
    await exited
  }
  await rm(process.dir, { recursive: true, force: true })
}

/**
 * The program, by its sha256, on a free port of 127.0.0.1, dying with the Hub (S37). A `login`
 * is put in its folder first, for a process that calls Google as an account (step 12 U10).
 */
export async function launch(deps: Deps, login?: Credential): Promise<Process> {
  const binary = await readFile(deps.cliProxy.binary).catch((cause) => {
    throw new Failure('CLIPROXY_BINARY_REFUSED', { cause })
  })
  const sha256 = createHash('sha256').update(binary).digest('hex')
  if (sha256 !== deps.cliProxy.sha256) throw new Failure('CLIPROXY_BINARY_REFUSED')
  const dir = await mkdtemp(join(tmpdir(), 'conexus-cliproxy-'))
  if (login !== undefined) {
    const auths = join(dir, 'auths')
    await mkdir(auths, { mode: 0o700 })
    await writeFile(join(auths, 'login.json'), login.reveal(), { mode: 0o600 })
  }
  const port = await freePort()
  const key = randomBytes(24).toString('base64url')
  const config = join(dir, 'config.yaml')
  await writeFile(config, configOf(port, key, dir), { mode: 0o600 })
  // Its output can name the person's Google account: it goes nowhere (S41).
  const args = ['--pdeathsig', 'KILL', '--', deps.cliProxy.binary, '--config', config]
  const child = spawn('setpriv', [...args, '--local-model', '--no-browser'], {
    cwd: dir,
    stdio: 'ignore',
  })
  // A login left waiting never holds the Hub open: it dies with it, or when its window ends.
  child.unref()
  const started = { child, dir, port, key }
  child.once('error', (error) => deps.log.error({ port, cause: error.name }, 'CLIPROXY_STOPPED'))
  const deadline = Date.now() + READY_MS
  while (Date.now() < deadline && child.exitCode === null) {
    // biome-ignore lint/plugin: until the process listens its port refuses connections, which is the state this poll waits out; the deadline raises CLIPROXY_UNAVAILABLE
    const ready = await management(started, '/get-auth-status').catch(() => undefined)
    if (ready?.ok) return started
    await sleep(POLL_MS)
  }
  await end(started)
  throw new Failure('CLIPROXY_UNAVAILABLE', { details: { reason: 'NOT_READY' } })
}

async function loggedIn(process: Process, state: string): Promise<boolean> {
  const deadline = Date.now() + LOGIN_MS
  while (Date.now() < deadline) {
    const reply = await management(process, `/get-auth-status?state=${encodeURIComponent(state)}`)
    const { status } = AuthStatus.parse(await reply.json().catch(() => ({})))
    if (status === 'ok') return true
    if (status === 'error') return false
    await sleep(POLL_MS)
  }
  return false
}

export async function loginFileOf(process: Process): Promise<Credential> {
  const auths = join(process.dir, 'auths')
  const [file] = (await readdir(auths)).filter((name) => name.endsWith('.json'))
  if (file === undefined)
    throw new Failure('MODEL_ACCOUNT_REFUSED', { details: { provider: 'google' } })
  return Credential.parse(await readFile(join(auths, file), 'utf8'))
}

async function finish(process: Process, state: string, code: string): Promise<Credential> {
  try {
    const posted = await management(process, '/oauth-callback', {
      method: 'POST',
      body: JSON.stringify({ provider: 'antigravity', redirect_url: code, state }),
    })
    if (!posted.ok || !(await loggedIn(process, state)))
      throw new Failure('MODEL_ACCOUNT_REFUSED', { details: { provider: 'google' } })
    return await loginFileOf(process)
  } catch (error) {
    if (error instanceof Failure) throw error
    throw new Failure('CLIPROXY_UNAVAILABLE', { details: { reason: 'LOGIN' }, cause: error })
  }
}

/**
 * Google's sign-in through CLIProxyAPI's Antigravity login (decision 0049, criteria 21, 22): one
 * process per sign-in, stopped when its login ends or when CLIProxy's window does, its folder with it. The
 * login file it writes is the credential, sealed whole; the account is `google`, in Google's queue.
 */
export function googleSignIn(deps: Deps): SignInFlow {
  const running = new Map<string, Process & { timer: NodeJS.Timeout }>()
  async function stop(state: string) {
    const process = running.get(state)
    if (process === undefined) return
    running.delete(state)
    clearTimeout(process.timer)
    await end(process)
    deps.log.info({ port: process.port }, 'CLIPROXY_STOPPED')
  }
  return {
    provider: ProviderId.parse('google'),
    seconds: deps.cliProxy.loginSeconds,
    async start() {
      const process = await launch(deps)
      deps.log.info({ port: process.port }, 'CLIPROXY_STARTED')
      let parsed: ReturnType<typeof AuthUrl.safeParse>
      try {
        const reply = await management(process, '/antigravity-auth-url')
        parsed = AuthUrl.safeParse(await reply.json())
      } catch (cause) {
        await end(process)
        throw new Failure('CLIPROXY_UNAVAILABLE', { details: { reason: 'NO_URL' }, cause })
      }
      if (!parsed.success) {
        await end(process)
        throw new Failure('CLIPROXY_UNAVAILABLE', { details: { reason: 'NO_URL' } })
      }
      const { url, state } = parsed.data
      const timer = setTimeout(() => void stop(state), deps.cliProxy.loginSeconds * 1000)
      timer.unref()
      running.set(state, { ...process, timer })
      return { url, pending: Credential.parse(state) }
    },
    async complete(pending, code) {
      const state = pending.reveal()
      const process = running.get(state)
      const typed = code.trim()
      const given = URL.canParse(typed) ? new URL(typed).searchParams.get('state') : null
      try {
        if (process === undefined || given !== state)
          throw new Failure('MODEL_ACCOUNT_SIGN_IN_EXPIRED')
        return await finish(process, state, typed)
      } finally {
        await stop(state)
      }
    },
  }
}
