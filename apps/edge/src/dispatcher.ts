// The dispatcher's Worker: every request to an app's host passes here first (decision 0041). Its
// entrypoints `Db` and `Connectors` are the `db` and `connectors` each app version receives
// (decision 0043).

import { WorkerEntrypoint } from 'cloudflare:workers'
import type { Db as AppDb, ConnectorAnswer, DbResult, Statement } from '@conexus/app-contract'
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

/**
 * The stub the dispatcher hands in `props.connectors`: an entrypoint, because a plain object of
 * functions cannot cross into the app's `props` (decision 0047, result 4). No connection is released
 * to any app until the Hub's door for them (step 20, U4 fills this in).
 */
export class Connectors extends WorkerEntrypoint<Env> {
  call(): ConnectorAnswer {
    return { kind: 'NOT_GRANTED' }
  }

  connections(): readonly string[] {
    return []
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return serveDispatch(request, env, {
      Db: (options) => ctx.exports.Db(options),
      Connectors: (options) => ctx.exports.Connectors(options),
    })
  },
} satisfies ExportedHandler<Env>
