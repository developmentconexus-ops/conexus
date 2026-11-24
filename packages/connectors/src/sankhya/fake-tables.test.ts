import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { discoverTables, readTablePage } from '../index.ts'
import { tableReachOf } from '../kernel/conformance-tables.ts'
import { sankhya } from './definition.ts'
import { sankhyaFake } from './fake.ts'

test('o registro muda entre duas leituras: a nota alterada, criada e apagada, o XML da NF-e e a coluna nova da empresa', async () => {
  const fake = sankhyaFake()
  const reach = await tableReachOf(sankhya, fake)
  const declared = sankhya.tables?.declared ?? []
  function table(name: string) {
    return declared.find((each) => each.name === name) ?? assert.fail(name)
  }
  const columns = [
    { name: 'NUNOTA', type: 'bigint', description: null },
    { name: 'VLRNOTA', type: 'numeric', description: null },
    { name: 'DTALTER', type: 'timestamp', description: null },
  ] as const
  async function notes() {
    const page = await readTablePage({
      ...reach,
      table: table('notas'),
      columns,
      filter: { kind: 'ALL' },
      after: null,
    })
    return page.kind === 'PAGE'
      ? new Map(page.rows.map((row) => [row.NUNOTA, row]))
      : assert.fail(page.code)
  }
  function route(path: string, body: unknown = {}) {
    const url = `${sankhya.origin}/__teste/${path}`
    return fake.handle(new Request(url, { method: 'POST', body: JSON.stringify(body) }))
  }
  const before = await notes()
  assert.equal((await route('notas/100000', { acao: 'ALTERAR' })).status, 200)
  assert.equal((await route('notas/100001', { acao: 'APAGAR' })).status, 200)
  assert.equal((await route('notas/199999', { acao: 'CRIAR' })).status, 200)
  assert.equal(
    (await route('notas/123', { acao: 'APAGAR' })).status,
    404,
    'uma nota que não existe',
  )
  const after = await notes()
  assert.deepEqual(after.get('100000'), {
    NUNOTA: '100000',
    VLRNOTA: '1.00',
    DTALTER: '2026-11-20T10:00:00',
  })
  assert.notDeepEqual(before.get('100000'), after.get('100000'))
  assert.equal(after.has('100001'), false)
  assert.equal(after.get('199999')?.DTALTER, '2026-11-20T10:00:00')

  const nfe = [
    { name: 'NUNOTA', type: 'bigint', description: null },
    { name: 'XMLCANC', type: 'text', description: null },
  ] as const
  assert.equal((await route('nfe/100000')).status, 200)
  const events = await readTablePage({
    ...reach,
    table: table('notas_nfe'),
    columns: nfe,
    filter: { kind: 'ALL' },
    after: null,
  })
  assert.equal(
    events.kind === 'PAGE' ? events.rows[0]?.XMLCANC : null,
    '<procEventoNFe><evento>cancelamento 100000</evento></procEventoNFe>',
  )

  const added = z.object({ coluna: z.string() }).parse(await (await route('colunas')).json())
  const found = await discoverTables(reach)
  const wide = found.find(({ declaration }) => declaration.name === 'notas')?.columns ?? []
  assert.equal(wide.at(-1)?.name, added.coluna, 'a descoberta seguinte vê a coluna da empresa')
})
