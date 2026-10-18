import type { AppProps } from '@conexus/app-contract'
import { FAILURES } from '@conexus/hub-api'
import dispatcher from './dispatcher.ts'

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

/** A Hub that admits the session and names `CALLER`. */
function admits(): Response {
  return Response.json({ caller: CALLER })
}

function greets(_request: Request, ctx: { props: AppProps }): Response {
  return new Response(`Olá, ${ctx.props.caller.personName}.`)
}

/** The dispatcher with both doubles; every call each double received is kept. */
export function edge(doubles: { hub?: Hub; app?: App } = {}) {
  const hub = doubles.hub ?? admits
  const app = doubles.app ?? greets
  const hubCalls: Request[] = []
  const appCalls: { name: string; args: unknown; options: unknown; request: Request }[] = []
  const env = {
    HUB_PUBLIC_ORIGIN: 'https://hub.conexus.fun',
    APPS_DOMAIN: 'conexusapp.tech',
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
    fetch(path: string, init: RequestInit = {}, origin = APP_ORIGIN): Promise<Response> {
      return dispatcher.fetch(new Request(`${origin}${path}`, init), env)
    },
  }
}

/** What a page of the dispatcher says, without the frame every page shares. */
export async function pageText(response: Response): Promise<string> {
  const html = await response.text()
  return /<main>(.*)<\/main>/.exec(html)?.[1] ?? html
}
