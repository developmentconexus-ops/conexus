import { createServer } from 'node:http'
import { z } from 'zod'

const Port = z.object({ port: z.number() })

/** The fake on a local port, for the Hub's executor and the QA: node:http on 127.0.0.1, closed with every connection. */
export async function serveOnLoopback(
  handle: (request: Request) => Promise<Response>,
): Promise<Readonly<{ origin: string; close(): Promise<void> }>> {
  const server = createServer((incoming, outgoing) => {
    const chunks: Buffer[] = []
    incoming.on('data', (chunk: Buffer) => chunks.push(chunk))
    incoming.on('end', async () => {
      const headers = Object.entries(incoming.headers).flatMap(([name, value]) =>
        typeof value === 'string' ? [[name, value] satisfies [string, string]] : [],
      )
      const request = new Request(new URL(incoming.url ?? '/', 'http://127.0.0.1'), {
        method: incoming.method,
        headers,
        body: incoming.method === 'GET' ? undefined : Buffer.concat(chunks),
      })
      const response = await handle(request)
      outgoing.writeHead(response.status, Object.fromEntries(response.headers))
      outgoing.end(Buffer.from(await response.arrayBuffer()))
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = Port.parse(server.address())
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve) => {
        server.close(() => resolve())
        server.closeAllConnections()
      }),
  }
}
