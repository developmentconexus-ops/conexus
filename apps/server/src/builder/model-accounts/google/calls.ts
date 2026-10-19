import { and, eq } from 'drizzle-orm'
import type { Database, Scope } from '../../../platform/database.ts'
import { Failure } from '../../../platform/failure.ts'
import type { Credential, SealKeys } from '../../../platform/seal.ts'
import { seal } from '../../../platform/seal.ts'
import { sealContext } from '../accounts.ts'
import { modelAccount } from '../tables.ts'
import type { Process, Deps as ProcessDeps } from './google.ts'
import { end, launch, loginFileOf } from './google.ts'

const IDLE_MS = 10 * 60 * 1000

export type GoogleAccount = {
  id: string
  companyId: string
  personId: string | null
  provider: string
  revision: number
  credential: Credential
}

type Running = {
  process: Process
  account: GoogleAccount
  scope: Scope
  timer: NodeJS.Timeout | undefined
  /** The calls running through the process now; it is idle only at none. */
  calls: number
}
type Deps = ProcessDeps & { database: Database; sealKeys: SealKeys; idleMs?: number }

/**
 * The login the process holds, written back sealed when CLIProxy refreshed it, at the revision the
 * account had (the same rule as the subscription's tokens): a row changed meanwhile keeps its own.
 */
async function resealed(deps: Deps, running: Running): Promise<void> {
  const { account, scope, process } = running
  const login = await loginFileOf(process).catch(() => undefined)
  if (login === undefined || login.reveal() === account.credential.reveal()) return
  const sealed = seal(deps.sealKeys, sealContext({ ...account, kind: 'google_cliproxy' }), login)
  await deps.database.command(scope, (tx) =>
    tx
      .update(modelAccount)
      .set({
        sealed: Buffer.from(sealed.blob),
        keyId: sealed.keyId,
        revision: account.revision + 1,
      })
      .where(and(eq(modelAccount.id, account.id), eq(modelAccount.revision, account.revision))),
  )
}

/**
 * Google's calls of an account through CLIProxyAPI (decision 0049, criterion 29): one process per
 * account, started on its first call and reused, on 127.0.0.1 with a key of its own and its login
 * in a folder only the Hub reads (C57, S36). It stops once no call has run for `idleMs`, counted
 * from the last call's end, and when `stop()` runs at the program's end, the login resealed first
 * (S32), the folder removed.
 */
export function googleCalls(deps: Deps) {
  const idleMs = deps.idleMs ?? IDLE_MS
  const running = new Map<string, Promise<Running>>()

  async function close(id: string, found: Promise<Running>) {
    if (running.get(id) === found) running.delete(id)
    const each = await found.catch(() => undefined)
    if (each === undefined) return
    clearTimeout(each.timer)
    try {
      await resealed(deps, each)
    } catch (error) {
      deps.log.error(
        { port: each.process.port, cause: Object(error).name },
        'CLIPROXY_RESEAL_FAILED',
      )
    } finally {
      await end(each.process)
      deps.log.info({ port: each.process.port }, 'CLIPROXY_STOPPED')
    }
  }

  async function start(account: GoogleAccount, scope: Scope): Promise<Running> {
    try {
      const process = await launch(deps, account.credential)
      deps.log.info({ port: process.port }, 'CLIPROXY_STARTED')
      return { process, account, scope, timer: undefined, calls: 0 }
    } catch (error) {
      if (error instanceof Failure) throw error
      throw new Failure('CLIPROXY_UNAVAILABLE', { details: { reason: 'START' }, cause: error })
    }
  }

  /** Counts the idle time again, from now, when no call runs through the process. */
  function idle(id: string, found: Promise<Running>, each: Running) {
    clearTimeout(each.timer)
    if (each.calls > 0 || running.get(id) !== found) return
    each.timer = setTimeout(() => void close(id, found), idleMs)
    each.timer.unref()
  }

  async function open(account: GoogleAccount, scope: Scope) {
    let found = running.get(account.id)
    const alive =
      found &&
      (await found.then(
        (each) => each.process.child.exitCode === null,
        () => false,
      ))
    if (found !== undefined && alive === false) {
      void close(account.id, found)
      found = undefined
    }
    if (found === undefined) {
      const starting = start(account, scope)
      found = starting
      running.set(account.id, starting)
      starting.catch(() => {
        if (running.get(account.id) === starting) running.delete(account.id)
      })
    }
    const opened = found
    const each = await opened
    idle(account.id, opened, each)
    function hold() {
      each.calls += 1
      clearTimeout(each.timer)
      let held = true
      return () => {
        if (!held) return
        held = false
        each.calls -= 1
        idle(account.id, opened, each)
      }
    }
    return { url: `http://127.0.0.1:${each.process.port}/v1`, apiKey: each.process.key, hold }
  }

  return {
    open,
    async stop() {
      await Promise.all([...running].map(([id, found]) => close(id, found)))
    },
  }
}
