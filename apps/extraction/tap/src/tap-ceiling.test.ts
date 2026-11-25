import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Connector } from '@conexus/connectors'
import { discoverTables, sankhyaFake } from '@conexus/connectors'
import type { Bookmark } from './messages.ts'
import type { PassDeps } from './pass.ts'
import { readTable } from './pass.ts'
import { senderOf, sessionFor } from './source.ts'
import { NOW, SANKHYA } from './test-tap.ts'

function inPagesOf100(): Connector {
  const tables = SANKHYA.tables ?? assert.fail()
  const readTable = tables.readTable ?? assert.fail()
  return {
    ...SANKHYA,
    tables: { ...tables, readTable: { ...readTable, page: { rows: 100, bytes: 1_048_576 } } },
  }
}

test('o ponto é o teto lido antes da passada: a alteração de chave baixa e depois a nota nova de chave alta, entre as páginas, chegam na rodada seguinte', async () => {
  const connector = inPagesOf100()
  const fake = sankhyaFake()
  let pages = 0
  async function change(nunota: number, acao: 'ALTERAR' | 'CRIAR', dtalter: string) {
    const url = new URL(`/__teste/notas/${nunota}`, connector.origin)
    const body = JSON.stringify({ acao, dtalter })
    await fake.handle(new Request(url, { method: 'POST', body }))
  }
  const credential = { ...fake.credential }
  const send = senderOf(connector, {
    credential,
    now: () => NOW,
    fetch: async (input, init) => {
      const request = new Request(input, init)
      const paged = (await request.clone().text()).includes('FETCH NEXT')
      const answer = await fake.handle(request)
      if (paged && ++pages === 1) {
        await change(100000, 'ALTERAR', '2026-11-20 10:00:00')
        await change(999999, 'CRIAR', '2026-11-20 10:05:00')
      }
      return answer
    },
  })
  const reach = {
    connector,
    send,
    session: sessionFor(connector, { credential, send, now: () => NOW }),
    account: { ref: null },
    signal: AbortSignal.timeout(60_000),
  }
  const notas = connector.tables?.declared.find(({ name }) => name === 'notas') ?? assert.fail()
  const found = await discoverTables({ ...reach, connector })
  const columns = found.find(({ declaration }) => declaration === notas)?.columns ?? assert.fail()
  const lines: string[] = []
  const deps: PassDeps = {
    now: () => NOW,
    sleep: async () => undefined,
    random: () => 0.5,
    write: async (line) => {
      lines.push(line)
    },
  }
  const bookmarks: Record<string, Bookmark> = {}
  const run = { table: notas, columns, stream: 'notas', whole: false }
  assert.equal(await readTable(reach, run, { bookmarks, startDate: null, deps }), null)
  assert.equal(pages, 2, 'duas páginas de 100')
  lines.length = 0
  assert.equal(await readTable(reach, run, { bookmarks, startDate: null, deps }), null)
  const read = lines.flatMap((line) => {
    const message = JSON.parse(line)
    return message.type === 'RECORD' ? [message.record.nunota] : []
  })
  assert.ok(read.includes(100000), 'a alteração da chave baixa, feita depois de lida')
  assert.ok(read.includes(999999), 'a nota nova da chave alta')
})
