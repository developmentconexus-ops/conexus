import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { z } from 'zod'

/** The row of `withRows` that carries a value the tests look for in the model's copy and the saved file. */
export const PLANTED = 'VALOR-PLANTADO-NA-RESPOSTA'

/** The double's executeQuery answering `rows` rows of two columns, the row 400 carrying `PLANTED`; the rest as the double does. */
export async function withRows(t: TestContext, origin: string, rows: number) {
  const server = createServer(async (incoming, outgoing) => {
    const chunks: Buffer[] = []
    for await (const chunk of incoming) chunks.push(z.instanceof(Buffer).parse(chunk))
    const body = Buffer.concat(chunks)
    if (body.includes('DbExplorerSP.executeQuery')) {
      const table = Array.from({ length: rows }, (_, n) => [
        n,
        n === 400 ? PLANTED : `Empresa ${n}`,
      ])
      outgoing.writeHead(200, { 'content-type': 'application/json' }).end(
        JSON.stringify({
          serviceName: 'DbExplorerSP.executeQuery',
          status: '1',
          pendingPrinting: 'false',
          responseBody: {
            fieldsMetadata: [{ name: 'N' }, { name: 'NOME' }],
            rows: table,
            burstLimit: false,
          },
        }),
      )
      return
    }
    const headers = Object.entries(incoming.headers).flatMap(([name, value]) =>
      typeof value === 'string' && name !== 'host'
        ? [[name, value] satisfies [string, string]]
        : [],
    )
    const answered = await fetch(`${origin}${incoming.url}`, {
      method: incoming.method,
      headers,
      redirect: 'manual',
      ...(incoming.method === 'GET' ? {} : { body }),
    })
    outgoing.writeHead(answered.status, Object.fromEntries(answered.headers))
    outgoing.end(Buffer.from(await answered.arrayBuffer()))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  return `http://127.0.0.1:${z.object({ port: z.number() }).parse(server.address()).port}`
}
