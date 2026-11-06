// A Worker for the clone test: the real dispatch path, with the `DISPATCHER` namespace stood in by
// a local entrypoint, so the app's `props` cross workerd's own structured clone as on Cloudflare.

import { WorkerEntrypoint } from 'cloudflare:workers'
import type { AppProps, ToolProps } from '@conexus/app-contract'
import { serveDispatch } from '../src/dispatch.ts'
import dispatcher, { Connectors, Db, ToolData } from '../src/dispatcher.ts'
import { APP_ORIGIN, TOOLS_AUD, TOOLS_ORIGIN, VERSION_CALL } from '../src/test-edge.ts'
import type { ToolDataProps } from '../src/tools.ts'
import { serveTool } from '../src/tools.ts'

export { Connectors, Db, ToolData }

function hubDouble(input: RequestInfo | URL, operation?: string): Response {
  const { pathname } = new URL(String(input))
  if (pathname === '/api/app-connector-calls/connections') {
    return Response.json({ names: ['matriz'] })
  }
  if (pathname === '/api/app-connector-calls') {
    return Response.json({ kind: 'OK', value: { rows: [] } })
  }
  if (pathname === '/api/tool-connector-calls') {
    return Response.json(
      operation === 'pedidos'
        ? { kind: 'OK', value: { linhas: [1, 2, 3] } }
        : { kind: 'NOT_DECLARED' },
    )
  }
  return Response.json(VERSION_CALL)
}

/** What the `HUB` binding of the dispatcher's own entrypoints reaches. */
export class HubDouble extends WorkerEntrypoint<Env> {
  async fetch(request: Request): Promise<Response> {
    const body = request.method === 'POST' ? await request.clone().json() : {}
    return hubDouble(request.url, Object(body).operation)
  }
}

/**
 * A saved tool: counts the rows of `pedidos`, or asks for an operation its version did not declare
 * when the input says so, so the rejection crosses workerd's RPC as on Cloudflare.
 */
export class Tool extends WorkerEntrypoint<Env, ToolProps> {
  async fetch(request: Request) {
    const { operation } = Object(await request.json())
    const read = Object(await this.ctx.props.data.read(String(operation), {}))
    return Response.json({ total: read.linhas.length })
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

// What the dispatcher's own entry asked of the tools' namespace, which `/entry/` serves.
let toolsReached = 0

export default {
  async fetch(request: Request, _env: Env, ctx: ExecutionContext) {
    const env = {
      HUB_PUBLIC_ORIGIN: 'https://hub.conexus.fun',
      APPS_DOMAIN: 'conexusapp.tech',
      TOOLS_ACCESS_AUD: TOOLS_AUD,
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
      TOOLS: {
        get: (_name: string, args: { props: ToolProps }) => ctx.exports.Tool(args),
      },
    } satisfies Env
    const url = new URL(request.url)
    if (url.pathname.startsWith('/entry/')) {
      const tools = new Request(`${TOOLS_ORIGIN}/${url.pathname.slice('/entry/'.length)}`, request)
      const counted = {
        ...env,
        TOOLS: {
          get: (name: string, args: { props: ToolProps }) => {
            toolsReached += 1
            return env.TOOLS.get(name, args)
          },
        },
      }
      const response = await dispatcher.fetch(tools, counted, ctx)
      return new Response(response.body, {
        status: response.status,
        headers: { 'x-tools-reached': String(toolsReached) },
      })
    }
    if (url.pathname.startsWith('/tool/')) {
      const tools = new Request(`${TOOLS_ORIGIN}/${url.pathname.slice('/tool/'.length)}`, request)
      const exports = {
        ToolData: (options: { props: ToolDataProps }) => ctx.exports.ToolData(options),
      }
      return serveTool(tools, env, exports, { aud: TOOLS_AUD })
    }
    return serveDispatch(new Request(`${APP_ORIGIN}${url.pathname}`, request), env, {
      Db: (options) => ctx.exports.Db(options),
      Connectors: (options) => ctx.exports.Connectors(options),
    })
  },
} satisfies ExportedHandler<Env>
