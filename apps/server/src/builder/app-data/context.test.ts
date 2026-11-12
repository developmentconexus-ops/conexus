import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { CopyMode } from '@conexus/hub-api'
import { ConnectorId, CopyId } from '@conexus/hub-api'
import { CopyName } from '../../hub/connectors/public.ts'
import { listProposalsOn } from '../../hub/copies/test-list-proposals.ts'
import {
  copiesWithoutHubDatabase,
  releasing,
  sankhyaServed,
} from '../../hub/copies/test-released.ts'
import { ordersCopy } from '../../hub/copies/test-sources.ts'
import { conversing } from '../conversation/test-conversation.ts'
import { stepped } from '../conversation/test-questions.ts'
import { dataContext, SOURCE_RULE } from './public.ts'

type View = Extract<Parameters<typeof dataContext>[0], { kind: 'COPIES' }>

function copy(
  name: string,
  columns: [string, View['released'][number]['columns'][number]['type']][],
  mode: CopyMode = { kind: 'WHOLE' },
): View['released'][number] {
  return {
    name: CopyName.parse(name),
    connector: ConnectorId.parse('sankhya'),
    source: { kind: 'QUERY', query: 'SELECT 1' },
    description: null,
    mode,
    accounts: false,
    columns: columns.map(([column, type]) => ({ name: column, type, description: null })),
  }
}

function viewOf(released: View['released'], unreleased: string[] = []): View {
  return { kind: 'COPIES', released, unreleased: unreleased.map((name) => CopyName.parse(name)) }
}

test('o bloco das cópias: nome, colunas entre aspas na caixa da definição, tipo, as não liberadas por nome, sem número nem hora', () => {
  const block = dataContext(
    viewOf(
      [
        copy(
          'vendas',
          [
            ['CODVEND', 'bigint'],
            ['cliente', 'text'],
          ],
          { kind: 'WINDOW', days: 7 },
        ),
      ],
      ['produtos'],
    ),
  )
  assert.ok(block.startsWith('## Data\n'))
  assert.ok(block.includes('- `sync.vendas` (window of 7 days'))
  assert.ok(block.includes('"CODVEND" bigint, "cliente" text'))
  assert.ok(block.includes('`sync.produtos`'))
  assert.ok(block.includes('never propose a copy that exists'))
  assert.ok(!/\d{4}-\d\d-\d\d|rows:/.test(block), 'no hour and no row count')
  assert.equal(dataContext(viewOf([], [])), '')
})

test('o bloco diz o modo', () => {
  const modes: [CopyMode, string][] = [
    [{ kind: 'WHOLE' }, 'whole copy'],
    [{ kind: 'WINDOW', days: 30 }, 'window of 30 days'],
    [{ kind: 'CHANGES' }, 'only what changed'],
  ]
  for (const [mode, words] of modes) {
    assert.ok(dataContext(viewOf([copy('c', [['ID', 'bigint']], mode)])).includes(words), words)
  }
  assert.ok(
    dataContext(viewOf([copy('c', [['ID', 'bigint']])])).includes('rereads the entire source'),
  )
  assert.ok(
    !dataContext(viewOf([copy('c', [['ID', 'bigint']], { kind: 'CHANGES' })])).includes(
      'entire source',
    ),
  )
})

test('o bloco traz a regra da fonte', () => {
  const block = dataContext(viewOf([copy('c', [['ID', 'bigint']])]))
  for (const part of ['through `db`', '`copy_propose`', '`connector_read`', SOURCE_RULE, '`42501`'])
    assert.ok(block.includes(part), part)
  assert.ok(!block.includes('Mercado Livre'))
})

test('o teto do bloco: passados 8 KB, as cópias seguintes só pelo nome', () => {
  const wide: [string, 'text'][] = Array.from({ length: 100 }, (_, at) => [`COLUNA_${at}`, 'text'])
  const released = Array.from({ length: 40 }, (_, at) =>
    copy(`cop${String(at).padStart(2, '0')}`, wide),
  )
  const block = dataContext(viewOf(released))
  assert.ok(new TextEncoder().encode(block).length <= 8 * 1024 + 600, 'near the cap')
  const listed = released.filter(({ name }) => block.includes(`- \`sync.${name}\``))
  assert.ok(listed.length > 0 && listed.length < released.length)
  const rest = released.slice(listed.length)
  for (const { name } of rest) assert.ok(block.includes(`\`sync.${name}\``), name)
  assert.ok(!block.includes(`- \`sync.${rest[0]?.name}\``))
  assert.ok(block.includes('`app_data_check` on `select * from sync.<name>` returns the columns'))
  assert.deepEqual(
    listed.map(({ name }) => name),
    released.slice(0, listed.length).map(({ name }) => name),
    'the name order is kept',
  )
})

test('as cópias não responderam: a vista diz FAILED e o bloco é a linha; sem cópia, sem bloco', async (t) => {
  const served = await sankhyaServed(t)
  const on = await conversing(t, stepped([]), served.change)
  const released = await releasing(t, on, served, ['vendas'], [])
  const { companyId, projectId } = released
  const copies = copiesWithoutHubDatabase(on.hub)
  const view = await copies.projectView({ companyId, projectId })
  assert.deepEqual(view, { kind: 'FAILED' })
  assert.equal(
    dataContext(view),
    "The company's copies did not answer now; do not assume there are none. Try again before you tell the person a copy is missing.",
  )
  const real = await on.hub.copies.projectView({ companyId, projectId })
  assert.ok(real.kind === 'COPIES')
  assert.deepEqual(real.released, [])
  assert.deepEqual(real.unreleased, ['vendas'])
})

test('o bloco não muda com a rodada, e liberar outra cópia o muda', async (t) => {
  const served = await sankhyaServed(t)
  const on = await conversing(t, stepped([]), served.change)
  const released = await releasing(t, on, served, ['vendas', 'vendedores'], ['vendas'])
  const { companyId, projectId, personId, ids } = released
  const first = dataContext(await on.hub.copies.projectView({ companyId, projectId }))
  assert.ok(first.includes('"CODVEND" bigint'))
  assert.ok(first.includes('`sync.vendedores`'), 'the unreleased one by name')
  assert.ok(!first.includes('- `sync.vendedores`'))
  const vendas = ids.get('vendas')
  assert.ok(vendas)
  const again = await on.hub.copies.run({ companyId, copyId: vendas }, AbortSignal.timeout(60_000))
  assert.notEqual(again.kind, 'GONE')
  assert.equal(dataContext(await on.hub.copies.projectView({ companyId, projectId })), first)
  const other = ids.get('vendedores')
  assert.ok(other)
  await on.hub.copies.grant({ companyId, personId, projectId, copyId: other })
  const after = dataContext(await on.hub.copies.projectView({ companyId, projectId }))
  assert.notEqual(after, first)
  assert.ok(after.includes('- `sync.vendedores`'))
})

test('a origem e as descrições', async (t) => {
  const on = await listProposalsOn(t)
  const fixed = ordersCopy(true)
  const definition = { ...fixed, source: { ...fixed.source, input: { status: 'paid' } } }
  const proposed = await on.propose({ definition })
  assert.equal(proposed.kind, 'PROPOSED', JSON.stringify(proposed))
  const made = await on.enable(on.ana, Object(proposed).proposalId)
  assert.equal(made.statusCode, 201, made.body)
  const ids = { companyId: on.companyId, projectId: on.projectId }
  const first = dataContext(await on.hub.copies.projectView(ids))
  for (const part of [
    '- `sync.ml_pedidos` (only what changed',
    'from the read `pedidos` (Pedidos) of `mercado-livre`, fixed input {"status":"paid"}.',
    'Os pedidos de cada loja.',
    `Columns: "_account" text (the account's id in the connector), "_account_name" text (the connection's name in Conexus), "id" bigint (O número do pedido), "status" text, "atualizado" timestamp`,
  ])
    assert.ok(first.includes(part), `${part}\n${first}`)
  const copyId = CopyId.parse(Object(made.json()).copy.id)
  const again = await on.hub.copies.run(
    { companyId: on.companyId, copyId },
    AbortSignal.timeout(60_000),
  )
  assert.notEqual(again.kind, 'GONE')
  assert.equal(dataContext(await on.hub.copies.projectView(ids)), first, 'a run changes nothing')
  // A query's copy names no SQL; three copies of 25 described columns fit in the 8 KB.
  function described(at: number) {
    return {
      ...copy(`c${at}`, []),
      description: 'Os dados que o app lê desta cópia',
      accounts: true,
      columns: Array.from({ length: 25 }, (_, n) => ({
        name: `coluna_${n}`,
        type: 'text',
        description: `O campo ${n} como o sistema o chama`,
      })),
    }
  }
  const block = dataContext(viewOf([described(1), described(2), described(3)]))
  assert.ok(block.includes('from the query of `sankhya`.'))
  assert.ok(!block.includes('SELECT 1'))
  assert.ok(new TextEncoder().encode(block).length <= 8 * 1024)
  for (const at of [1, 2, 3]) assert.ok(block.includes(`- \`sync.c${at}\``), `c${at} listed`)
})
