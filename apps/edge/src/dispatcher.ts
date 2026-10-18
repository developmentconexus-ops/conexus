// The dispatcher's Worker: every request to an app's host passes here first (decision 0041). Its
// entrypoint `Db` is the `db` each app version receives (decision 0043).

import { WorkerEntrypoint } from 'cloudflare:workers'
import type { Db as AppDb, DbResult, Statement } from '@conexus/app-contract'
import type { DbProps } from './db.ts'
import { dbOf } from './db.ts'
import { serveDispatch } from './dispatch.ts'

/**
 * The stub the dispatcher hands in `props.db`, bound to one login: the app can reach no other, and
 * the key never leaves this Worker.
 */
export class Db extends WorkerEntrypoint<Env, DbProps> {
  query(text: string, values: readonly unknown[] = []): Promise<DbResult> {
    return dbOf(this.env.APP_LOGIN_KEY, this.ctx.props).query(text, values)
  }

  batch(statements: readonly Statement[]): ReturnType<AppDb['batch']> {
    return dbOf(this.env.APP_LOGIN_KEY, this.ctx.props).batch(statements)
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return serveDispatch(request, env, { Db: (options) => ctx.exports.Db(options) })
  },
} satisfies ExportedHandler<Env>
