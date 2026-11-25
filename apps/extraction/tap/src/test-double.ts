import { once } from 'node:events'
import { setTimeout as sleep } from 'node:timers/promises'
import { sankhyaFake } from '@conexus/connectors'
import { REQUEST_TIMEOUT_MS, runTap, writeLine } from './tap.ts'

async function served(): Promise<number> {
  const fake = sankhyaFake()
  const { origin, close } = await fake.serve()
  const { credential } = fake
  process.stdout.write(`${JSON.stringify({ origin, credential })}\n`)
  await once(process, 'SIGTERM')
  await close()
  return 0
}

async function toDouble(origin: string, input: string | URL | Request, init?: RequestInit) {
  const request = new Request(input, init)
  const { pathname, search } = new URL(request.url)
  const body = request.method === 'GET' ? undefined : await request.arrayBuffer()
  return globalThis.fetch(new URL(`${pathname}${search}`, origin), {
    method: request.method,
    headers: request.headers,
    body,
    signal: request.signal,
  })
}

const [mode, origin = '', ...rest] = process.argv.slice(2)
process.exitCode =
  mode === 'serve'
    ? await served()
    : await runTap(rest, {
        fetch: (input, init) => toDouble(origin, input, init),
        now: Date.now,
        sleep: (ms) => sleep(ms),
        random: Math.random,
        write: writeLine,
        log: (line) => {
          process.stderr.write(`${line}\n`)
        },
        timeoutMs: REQUEST_TIMEOUT_MS,
      })
