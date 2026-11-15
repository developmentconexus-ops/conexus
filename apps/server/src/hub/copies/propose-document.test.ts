import assert from 'node:assert/strict'
import { test } from 'node:test'
import { copiesOn } from './test-copies.ts'
import { listProposalsOn } from './test-list-proposals.ts'
import { definitionOf, grantMatriz, proposalRows, proposeAs } from './test-proposals.ts'
import { catalogWith, ordersCopy } from './test-sources.ts'

const CPF = '52998224725'

/** Mercado Livre's `pedidos` with no personal path declared, so its buyer's document reaches the page of proof. */
const undeclared = catalogWith((connector) => ({
  ...connector,
  operations: connector.operations.map((operation) =>
    operation.id === 'pedidos' ? { ...operation, personal: [] } : operation,
  ),
}))

/** `clientes` over TGFPAR, whose CGC_CPF the double leaves empty or invalid: a valid CPF stands in where it is empty, under the name X. */
function partnersAs(on: Awaited<ReturnType<typeof copiesOn>>, document: string | null) {
  const model = definitionOf(on, 'clientes')
  const [codparc, dtalter] = ['CODPARC', 'DTALTER'].map((name) => {
    const found = model.columns.find((column) => column.name === name)
    assert.ok(found, name)
    return found
  })
  assert.ok(codparc && dtalter)
  const text = { type: 'text' as const, description: 'O documento do parceiro.' }
  const columns =
    document === null ? [codparc, dtalter] : [codparc, { name: 'X', ...text }, dtalter]
  const select =
    document === null
      ? 'CODPARC, DTALTER'
      : `CODPARC, COALESCE(NULLIF(CGC_CPF, ''), '${document}') AS X, DTALTER`
  return {
    ...model,
    source: { kind: 'QUERY' as const, sql: `SELECT ${select} FROM TGFPAR` },
    columns,
  }
}

test('uma proposta da versão 1 com CGC_CPF AS X é recusada com a coluna X', async (t) => {
  const on = await copiesOn(t)
  await grantMatriz(on)
  const answer = await proposeAs(on, { name: 'sankhya_parceiros', definition: partnersAs(on, CPF) })
  assert.deepEqual(answer, { kind: 'COPY_PERSONAL_NOT_KEPT', connection: 'Matriz', column: 'X' })
  assert.deepEqual(await proposalRows(on), [])
  const logged = on.hub.lines.filter((line) => line.message === 'COPY_DOCUMENT_REFUSED')
  assert.equal(logged.length, 1)
  assert.ok(!JSON.stringify(logged).includes(CPF), 'the log carries the column, never a cell')
})

test('a mesma sem a coluna é aceita', async (t) => {
  const on = await copiesOn(t)
  await grantMatriz(on)
  const answer = await proposeAs(on, {
    name: 'sankhya_parceiros',
    definition: partnersAs(on, null),
  })
  assert.equal(answer.kind, 'PROPOSED', JSON.stringify(answer))
})

test('uma proposta da versão 2 com uma coluna de CNPJ sem caminho declarado é recusada', async (t) => {
  const on = await listProposalsOn(t, { catalog: undeclared })
  const id = { name: 'id', type: 'bigint', path: 'id', description: 'O número do pedido' }
  const document = {
    name: 'documento',
    type: 'text',
    path: 'buyer.billing_info.doc_number',
    description: 'O documento do comprador',
  }
  const definition = { ...ordersCopy(false), columns: [id, document] }
  const answer = await on.propose({ name: 'mercado_livre_documento', definition })
  assert.deepEqual(answer, {
    kind: 'COPY_PERSONAL_NOT_KEPT',
    connection: 'Loja A',
    column: 'documento',
  })
  assert.deepEqual(await on.proposalRows(), [])
  assert.equal(on.hub.lines.filter((line) => line.message === 'COPY_DOCUMENT_REFUSED').length, 1)
})
