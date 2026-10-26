import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { TestContext } from 'node:test'
import { pathToFileURL } from 'node:url'
import { Worker as Thread } from 'node:worker_threads'

type Props = Readonly<{ caller: unknown; db?: unknown }>
/** An uploaded Worker as the namespace keeps it: its module, and the CPU it was uploaded with. */
type Uploaded = Readonly<{ main: Buffer; cpuMs: number }>
type Waiting = { resolve(answer: Response): void; reject(error: Error): void; db: unknown }
type Running = {
  thread: Thread
  waiting: Map<number, Waiting>
  next: number
  ready: Promise<Running>
}
type FromThread =
  | { kind: 'ready' }
  | { kind: 'db'; id: number; call: number; method: 'query' | 'batch'; args: unknown[] }
  | { kind: 'answer'; id: number; status: number; headers: [string, string][]; body: ArrayBuffer }
  | { kind: 'threw'; id: number; message: string }

/** What a thread says about one request: a `db` call to run here, its answer, or its exception. */
async function heard(running: Running, message: FromThread) {
  if (message.kind === 'ready') return
  const waiting = running.waiting.get(message.id)
  if (waiting === undefined) return
  if (message.kind === 'db') {
    const answer = await Object(waiting.db)[message.method](...message.args)
    running.thread.postMessage({ kind: 'db', call: message.call, answer })
    return
  }
  running.waiting.delete(message.id)
  if (message.kind === 'threw') waiting.reject(new Error(message.message))
  else waiting.resolve(new Response(message.body, message))
}

/**
 * Runs each uploaded Worker in its own thread, its module imported once, and cuts a request whose
 * thread stays busy past the CPU it was uploaded with, as Cloudflare does (record 0047, check 5). A
 * cut or a thread's error fails every request still waiting on it, and the next request starts a new
 * thread.
 * Time the thread waits on `db`, which runs here, is idle time, as it is outside CPU time there.
 */
export function threads(t: TestContext) {
  const folder = mkdtempSync(join(tmpdir(), 'conexus-workers-'))
  const running = new Map<string, Promise<Running>>()
  t.after(async () => {
    const over = new Error('The test ended.')
    for (const [name, ready] of [...running]) {
      const app = await ready.catch(() => undefined)
      if (app !== undefined) await stop(name, app, over)
    }
    rmSync(folder, { recursive: true, force: true })
  })
  function start(name: string, main: Buffer): Promise<Running> {
    const file = join(folder, `${name}.mjs`)
    writeFileSync(file, main)
    const thread = new Thread(new URL('./app-thread.ts', import.meta.url), {
      workerData: { module: pathToFileURL(file).href },
    })
    const ready = Promise.withResolvers<Running>()
    const started: Running = { thread, waiting: new Map(), next: 0, ready: ready.promise }
    thread.on('message', (message: FromThread) => void heard(started, message))
    thread.once('message', () => ready.resolve(started))
    thread.once('error', (error) => {
      void stop(name, started, error)
      ready.reject(error)
    })
    running.set(name, ready.promise)
    return ready.promise
  }
  function stop(name: string, app: Running, error: Error) {
    if (running.get(name) === app.ready) running.delete(name)
    for (const waiting of app.waiting.values()) waiting.reject(error)
    app.waiting.clear()
    return app.thread.terminate()
  }
  return async function serve(name: string, worker: Uploaded, request: Request, props: Props) {
    const app = await (running.get(name) ?? start(name, worker.main))
    app.next += 1
    const id = app.next
    const body = request.method === 'GET' ? null : await request.arrayBuffer()
    const answer = new Promise<Response>((resolve, reject) => {
      app.waiting.set(id, { resolve, reject, db: Object(props).db })
    })
    const before = app.thread.performance.eventLoopUtilization()
    app.thread.postMessage({
      kind: 'request',
      id,
      url: request.url,
      method: request.method,
      headers: [...request.headers],
      body,
      caller: props.caller,
    })
    const watch = setInterval(() => {
      if (app.thread.performance.eventLoopUtilization(before).active <= worker.cpuMs) return
      void stop(name, app, new Error('Worker exceeded CPU time limit.'))
    }, 5)
    try {
      return await answer
    } finally {
      clearInterval(watch)
    }
  }
}
