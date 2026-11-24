import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { CompanyId, ConnectionId, PersonId } from '@conexus/hub-api'
import { z } from 'zod'
import { chooserAt } from '../access/test-principal.ts'
import { TurnKey } from './public.ts'
import { appCalls } from './test-app-calls.ts'
import { forward } from './test-connections.ts'

const NOTE = '1234567890123.123456'
const BIG = '12345678901234567890'

/** The double, with its exact note's value sent as `BIG`: a provider's number past 2^53, written as it came. */
function sendingBig(t: TestContext) {
  return async (origin: string) => {
    const server = createServer(async (incoming, outgoing) => {
      const chunks: Buffer[] = []
      for await (const chunk of incoming) chunks.push(z.instanceof(Buffer).parse(chunk))
      const answered = await forward(origin, incoming, Buffer.concat(chunks))
      const { 'content-length': _, ...headers } = answered.headers
      outgoing.writeHead(answered.status, headers)
      outgoing.end(answered.body.toString('utf8').replaceAll(NOTE, BIG))
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    t.after(() => {
      server.closeAllConnections()
      server.close()
    })
    return `http://127.0.0.1:${z.object({ port: z.number() }).parse(server.address()).port}`
  }
}

async function readNote(t: TestContext, through?: (origin: string) => Promise<string>) {
  const on = await appCalls(t, through === undefined ? {} : { through })
  const matriz = ConnectionId.parse(await on.connect('Matriz', false))
  const scope = chooserAt(
    {
      companyId: CompanyId.parse(on.companyId),
      personId: PersonId.parse(on.ana.id),
      place: { kind: 'COMPANY' },
    },
    [matriz],
  )
  const answered = await on.hub.connectors.assistant.read(scope, {
    connectionId: matriz,
    turn: TurnKey.parse(randomUUID()),
    operation: 'consultar',
    input: { sql: `SELECT VLRNOTA FROM TGFCAB WHERE VLRNOTA = '${NOTE}'` },
  })
  assert.equal(answered.kind, 'OK')
  return z
    .object({ linhas: z.array(z.object({ VLRNOTA: z.unknown() })) })
    .parse(answered.kind === 'OK' && answered.value)
    .linhas.map((row) => row.VLRNOTA)
}

test('o número grande: chega ao Hub como o texto que o provedor mandou, pois o Sankhya declara números exatos', async (t) => {
  assert.deepEqual(new Set(await readNote(t)), new Set([NOTE]))
  assert.deepEqual(new Set(await readNote(t, sendingBig(t))), new Set([BIG]))
})
