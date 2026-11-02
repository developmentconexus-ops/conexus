import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { PADARIA_SOL_FILIAL, PADARIA_SOL_MATRIZ, sankhyaFake } from '@conexus/connectors'
import { z } from 'zod'

/** The Filial's own X-Token, so the router in front of the two doubles knows whose login it is. */
const FILIAL_X_TOKEN = 'fake-x-token-filial'
/** What the router puts before the tokens the Filial's double gives, so a call finds its double again. */
const FILIAL_TOKEN = 'filial-'

const Login = z.looseObject({ access_token: z.string() })

async function bodyOf(incoming: AsyncIterable<unknown>): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of incoming) chunks.push(z.instanceof(Buffer).parse(chunk))
  return Buffer.concat(chunks)
}

/** The incoming request as a `Request` for one double, its headers rewritten by `headers`. */
function requestFor(
  incoming: { url?: string; method?: string; headers: Record<string, unknown> },
  body: Buffer,
  headers: (name: string, value: string) => string,
): Request {
  const sent = new Headers()
  for (const [name, value] of Object.entries(incoming.headers)) {
    if (typeof value === 'string' && name !== 'host') sent.set(name, headers(name, value))
  }
  const method = incoming.method ?? 'GET'
  return new Request(`http://sankhya.test${incoming.url ?? '/'}`, {
    method,
    headers: sent,
    ...(method === 'GET' || method === 'HEAD' ? {} : { body: new Uint8Array(body) }),
  })
}

/**
 * Padaria Sol's two Sankhyas behind one origin, as the Hub reaches one connector at one origin: the
 * Matriz's double with its sales, and the Filial's with its own, told apart by the X-Token at login
 * and by the token's prefix after it. Link the Matriz with `matriz`, the Filial with `filial`.
 */
export async function salesSankhya(
  t: TestContext,
  sets = { matriz: PADARIA_SOL_MATRIZ, filial: PADARIA_SOL_FILIAL },
) {
  const matriz = sankhyaFake({ sales: sets.matriz })
  const filial = sankhyaFake({ sales: sets.filial })
  const server = createServer(async (incoming, outgoing) => {
    const body = await bodyOf(incoming)
    const bearer = String(incoming.headers.authorization ?? '')
    const isFilial =
      incoming.headers['x-token'] === FILIAL_X_TOKEN || bearer.startsWith(`Bearer ${FILIAL_TOKEN}`)
    const double = isFilial ? filial : matriz
    const request = requestFor(incoming, body, (name, value) => {
      if (!isFilial) return value
      if (name === 'x-token') return matriz.credential.xToken ?? value
      return name === 'authorization' ? value.replace(FILIAL_TOKEN, '') : value
    })
    const answered = await double.handle(request)
    let text = await answered.text()
    const login = isFilial && request.url.endsWith('/authenticate') && answered.ok
    if (login) {
      const parsed = Login.parse(JSON.parse(text))
      text = JSON.stringify({ ...parsed, access_token: `${FILIAL_TOKEN}${parsed.access_token}` })
    }
    const headers = Object.fromEntries(answered.headers)
    delete headers['content-length']
    outgoing.writeHead(answered.status, headers)
    outgoing.end(text)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const { port } = z.object({ port: z.number() }).parse(server.address())
  return {
    origin: `http://127.0.0.1:${port}`,
    matriz: matriz.credential,
    filial: { ...matriz.credential, xToken: FILIAL_X_TOKEN },
  }
}

export { PADARIA_SOL_FILIAL, PADARIA_SOL_MATRIZ, salesDatabase, soldBy } from '@conexus/connectors'
