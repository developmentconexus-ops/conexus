import type { AppProps } from '@conexus/app-contract'
import { FAILURES } from '@conexus/hub-api'
import type { DbProps } from './db.ts'
import type { Exports } from './dispatch.ts'
import { serveDispatch } from './dispatch.ts'

// Doubles of the two bindings, answering as the contract does: the Hub through its VPC service and
// the namespace that holds the apps' Workers.
export const HOST = 'pedidos--empresa-a'
export const APP_ORIGIN = `https://${HOST}.conexusapp.tech`
export const CODE = 'c'.repeat(43)
export const SESSION = 's'.repeat(43)
export const BINDING = 'b'.repeat(43)
export const CALLER = {
  personId: 'p1',
  personName: 'Ana Souza',
  projectId: 'J'.repeat(32),
  projectName: 'Pedidos',
  access: { kind: 'BUILDER' },
} as const

type App = (request: Request, ctx: { props: AppProps }) => Response | Promise<Response>
type Hub = (request: Request) => Response | Promise<Response>

export function problem(code: keyof typeof FAILURES): Response {
  const { status, phrase } = FAILURES[code]
  return Response.json(
    { type: 'about:blank', title: phrase, status, code, traceId: 't1' },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )
}

/** What the Hub answers for a Projeto with no version on the air: the example app of step 8. */
export const EXAMPLE_CALL = { caller: CALLER, version: { example: true }, database: null } as const
/** What the Hub answers for a Projeto with a version on the air. */
export const VERSION_CALL = {
  caller: CALLER,
  version: { worker: `v-${'V'.repeat(32)}` },
  database: {
    host: 'ep-exemplo.neon.tech',
    database: 'neondb',
    login: `app_${CALLER.projectId}_run`,
  },
} as const

/** A Hub that admits the session and names `CALLER`, with no version on the air. */
function admits(): Response {
  return Response.json(EXAMPLE_CALL)
}

function greets(_request: Request, ctx: { props: AppProps }): Response {
  return new Response(`Olá, ${ctx.props.caller.personName}.`)
}

/** The dispatcher with both doubles; every call each double received is kept. */
export function edge(doubles: { hub?: Hub; app?: App; missingScript?: boolean } = {}) {
  const hub = doubles.hub ?? admits
  const app = doubles.app ?? greets
  const hubCalls: Request[] = []
  const appCalls: {
    name: string
    args: { props: AppProps }
    options: unknown
    request: Request
  }[] = []
  const dbBindings: DbProps[] = []
  const exports: Exports = {
    Db({ props }) {
      dbBindings.push(props)
      return {
        async query() {
          return { rows: [] }
        },
        async batch() {
          return { results: [] }
        },
      }
    },
    Connectors() {
      return {
        async call() {
          return { kind: 'NOT_GRANTED' }
        },
        async connections() {
          return []
        },
      }
    },
  }
  const env = {
    HUB_PUBLIC_ORIGIN: 'https://hub.conexus.fun',
    APPS_DOMAIN: 'conexusapp.tech',
    APP_LOGIN_KEY: 'k'.repeat(43),
    HUB: {
      async fetch(input: RequestInfo | URL, init?: RequestInit) {
        const request = new Request(input, init)
        hubCalls.push(request.clone())
        return hub(request)
      },
      connect(): Socket {
        throw new Error('the dispatcher never opens a socket to the Hub')
      },
    },
    DISPATCHER: {
      get(name: string, args: { props: AppProps }, options: unknown) {
        // Stands for a namespace that raises "Worker not found" from `get`; one that raises it from the
        // stub's `fetch` lands in the same `try` of the dispatcher's `toApp`, so the 502 page is the same.
        if (doubles.missingScript) throw new Error(`Worker not found: ${name}`)
        return {
          async fetch(input: RequestInfo | URL, init?: RequestInit) {
            const request = new Request(input, init)
            appCalls.push({ name, args, options, request: request.clone() })
            return app(request, args)
          },
          connect(): Socket {
            throw new Error('the dispatcher never opens a socket to an app')
          },
        }
      },
    },
  } satisfies Env
  return {
    hubCalls,
    appCalls,
    dbBindings,
    fetch(path: string, init: RequestInit = {}, origin = APP_ORIGIN): Promise<Response> {
      return serveDispatch(new Request(`${origin}${path}`, init), env, exports)
    },
  }
}

/** What a page of the dispatcher says, without the frame every page shares. */
export async function pageText(response: Response): Promise<string> {
  const html = await response.text()
  return /<main>(.*)<\/main>/.exec(html)?.[1] ?? html
}
