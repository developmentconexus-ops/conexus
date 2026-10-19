// One uploaded app Worker in its own thread, as the namespace runs each Worker in its own isolate:
// a request comes in as a message, its `db` calls go back to the main thread, and the answer leaves
// as a message. The main thread cuts the thread when it passes its CPU limit (apps-edge.ts).
import { parentPort, workerData } from 'node:worker_threads'

type Incoming =
  | {
      kind: 'request'
      id: number
      url: string
      method: string
      headers: [string, string][]
      body: ArrayBuffer | null
      caller: unknown
    }
  | { kind: 'db'; call: number; answer: unknown }

const port = parentPort
if (port === null) throw new Error('app-thread runs only as a worker thread')
const worker = await import(String(workerData.module))
port.postMessage({ kind: 'ready' })
const waiting = new Map<number, (answer: unknown) => void>()
let calls = 0

function dbCall(id: number, method: 'query' | 'batch', args: unknown[]) {
  calls += 1
  const call = calls
  return new Promise((resolve) => {
    waiting.set(call, resolve)
    port?.postMessage({ kind: 'db', id, call, method, args })
  })
}

async function serve(message: Extract<Incoming, { kind: 'request' }>) {
  const request = new Request(message.url, {
    method: message.method,
    headers: message.headers,
    body: message.body,
  })
  const db = {
    query: (...args: unknown[]) => dbCall(message.id, 'query', args),
    batch: (...args: unknown[]) => dbCall(message.id, 'batch', args),
  }
  try {
    const response: Response = await worker.default.fetch(
      request,
      {},
      {
        props: { caller: message.caller, db },
      },
    )
    const body = await response.arrayBuffer()
    port?.postMessage(
      {
        kind: 'answer',
        id: message.id,
        status: response.status,
        headers: [...response.headers],
        body,
      },
      [body],
    )
  } catch (error) {
    port?.postMessage({ kind: 'threw', id: message.id, message: String(Object(error).message) })
  }
}

port.on('message', (message: Incoming) => {
  if (message.kind === 'db') {
    waiting.get(message.call)?.(message.answer)
    waiting.delete(message.call)
  } else void serve(message)
})
