// A Worker for the clone test: the real dispatch path, with the `DISPATCHER` namespace stood in by
// a local entrypoint, so the app's `props` cross workerd's own structured clone as on Cloudflare.

import { WorkerEntrypoint } from 'cloudflare:workers'
import type { AppProps } from '@conexus/app-contract'
import { serveDispatch } from '../src/dispatch.ts'
import { Connectors, Db } from '../src/dispatcher.ts'
import { APP_ORIGIN, VERSION_CALL } from '../src/test-edge.ts'

export { Connectors, Db }

function hubDouble(input: RequestInfo | URL): Response {
  const { pathname } = new URL(String(input))
  if (pathname === '/api/app-connector-calls/connections') {
    return Response.json({ names: ['matriz'] })
  }
  if (pathname === '/api/app-connector-calls') {
    return Response.json({ kind: 'OK', value: { rows: [] } })
  }
  return Response.json(VERSION_CALL)
}

/** What the `HUB` binding of the dispatcher's own entrypoints reaches. */
export class HubDouble extends WorkerEntrypoint<Env> {
  fetch(request: Request): Response {
    return hubDouble(request.url)
  }
}

/** The app: answers what its `connectors` stub said. */
export class App extends WorkerEntrypoint<Env, AppProps> {
  async fetch() {
    const { connectors } = this.ctx.props
    return Response.json({
      answer: await connectors.call('sankhya', 'pedidos', {}),
      connections: await connectors.connections('mercado-livre'),
    })
  }
}

export default {
  fetch(request: Request, _env: Env, ctx: ExecutionContext) {
    const env = {
      HUB_PUBLIC_ORIGIN: 'https://hub.conexus.fun',
      APPS_DOMAIN: 'conexusapp.tech',
      APP_LOGIN_KEY: 'k'.repeat(43),
      HUB: {
        fetch: async (input: RequestInfo | URL) => hubDouble(input),
        connect(): Socket {
          throw new Error('the dispatcher never opens a socket to the Hub')
        },
      },
      DISPATCHER: {
        get: (_name: string, args: { props: AppProps }) => ctx.exports.App(args),
      },
    } satisfies Env
    const url = new URL(request.url)
    return serveDispatch(new Request(`${APP_ORIGIN}${url.pathname}`, request), env, {
      Db: (options) => ctx.exports.Db(options),
      Connectors: (options) => ctx.exports.Connectors(options),
    })
  },
} satisfies ExportedHandler<Env>
