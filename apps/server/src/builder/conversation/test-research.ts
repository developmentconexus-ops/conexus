import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import type { TestContext } from 'node:test'
import type { Anthropic } from '../../platform/test-anthropic.ts'

/**
 * Everything the process prints on stdout and stderr while the test runs, still printed: by the
 * streams, and by `fs` on their descriptors, as the Hub's logger writes.
 */
export function printedOf(t: TestContext): string[] {
  const printed: string[] = []
  for (const out of [process.stdout, process.stderr]) {
    const write = out.write.bind(out)
    t.mock.method(out, 'write', (chunk: string | Uint8Array) => {
      printed.push(String(chunk))
      return write(chunk)
    })
  }
  for (const name of ['write', 'writeSync'] as const) {
    const real = fs[name]
    t.mock.method(fs, name, (...args: unknown[]) => {
      const [fd, chunk] = args
      if (fd === 1 || fd === 2) printed.push(String(chunk))
      return Reflect.apply(real, fs, args)
    })
  }
  return printed
}

/** A server on 127.0.0.1 that counts what reaches it and answers `reply`. */
export async function served(
  t: TestContext,
  reply: (path: string, response: http.ServerResponse) => void,
) {
  const reached: string[] = []
  const server = http.createServer((request, response) => {
    reached.push(String(request.url))
    reply(String(request.url), response)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  assert.ok(address !== null && typeof address === 'object')
  return { port: address.port, reached }
}

/** The public name reaches `port` on this machine, as a public site would; the rest as before. */
export function routedTo(t: TestContext, name: string, port: number) {
  const before = http.globalAgent
  const agent = new http.Agent()
  const connect = agent.createConnection.bind(agent)
  agent.createConnection = (options, callback) =>
    options.hostname === name || options.host === name
      ? connect({ ...options, host: '127.0.0.1', hostname: '127.0.0.1', port }, callback)
      : connect(options, callback)
  Reflect.set(http, 'globalAgent', agent)
  t.after(() => {
    Reflect.set(http, 'globalAgent', before)
    agent.destroy()
  })
}

/** The pages a researching turn reads, on a site the test serves. */
export const PAGES = ['/forno', '/encomendas', '/entrega'].map(
  (path) => `http://padaria.example.test${path}`,
)

/**
 * A provider answer that thinks, searches the web, reads `PAGES` with `web_fetch` and then answers;
 * the title call's answer is the title. Planted text goes in what must stay inside: the thinking,
 * the pages' contents, the search results' addresses and the arguments of an unknown tool.
 */
export async function researching(t: TestContext): Promise<Anthropic['answer']> {
  const site = await served(t, (path, response) =>
    response.end(`Conteúdo ${path} SECRET-PLANTED-TEXT`),
  )
  routedTo(t, 'padaria.example.test', site.port)
  let step = 0
  return (asked) => {
    if (!asked.stream) return { kind: 'text', text: 'Título' }
    step += 1
    if (step > 1) return { kind: 'text', text: 'Comparei as padarias.' }
    const results = [
      { url: 'https://secret-planted-text.example.test/', title: 'SECRET-PLANTED-TEXT' },
    ]
    return {
      kind: 'blocks',
      blocks: [
        { type: 'thinking', thinking: 'Vou pesquisar. SECRET-PLANTED-TEXT' },
        { type: 'search', query: 'apps de encomenda de padaria', results },
        ...PAGES.map((url) => ({ type: 'tool_use' as const, name: 'web_fetch', input: { url } })),
        { type: 'tool_use', name: 'planted_tool', input: { note: 'SECRET-PLANTED-TEXT' } },
      ],
    }
  }
}
