import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CONNECTORS, connectorSkill, toolNameOf } from '../index.ts'
import { mercadoLivre } from '../mercado-livre/definition.ts'
import { sankhya } from '../sankhya/definition.ts'
import { defineConnector } from './definition.ts'

const WRITES = 'Esta ligação lê e escreve; cada escrita pede a aprovação de uma pessoa.'
const READS_ONLY = 'Esta ligação só lê.'

test('a parte gerada: depois do cabeçalho, se a ligação escreve ou só lê, e os assuntos pelo rótulo, sem nomear ferramenta', () => {
  for (const connector of CONNECTORS) {
    const { content, references } = connectorSkill(connector)
    const writes = (connector.writes ?? []).length > 0
    assert.ok(content.startsWith(`---\nname: conexus-${connector.id}\n`), connector.id)
    const generated = content.slice(
      content.indexOf('## A ligação'),
      content.indexOf('\n\n#', content.indexOf('Os assuntos:')),
    )
    assert.ok(generated.includes(writes ? WRITES : READS_ONLY), connector.id)
    assert.ok(!generated.includes(writes ? READS_ONLY : WRITES), connector.id)
    for (const [subject, label] of Object.entries(connector.subjects))
      assert.ok(generated.includes(`- ${label} (\`${subject}\`)`), `${connector.id} ${subject}`)
    for (const operation of [...connector.operations, ...(connector.writes ?? [])])
      assert.ok(!content.includes(toolNameOf(connector, operation.id)), `names ${operation.id}`)
    assert.deepEqual(references, connector.skill.written.references)
  }
  assert.ok(connectorSkill(sankhya).content.includes(WRITES), 'the Sankhya writes')
})

test('a parte escrita não lista as operações: nenhum id nu de operação que não seja também assunto', () => {
  for (const connector of [sankhya, mercadoLivre]) {
    const { content, references } = connector.skill.written
    const text = [content, ...Object.values(references)].join('\n')
    const door = Object.keys(connector.readDoor ?? {})
    const ids = [...connector.operations, ...(connector.writes ?? [])].map(({ id }) => String(id))
    for (const id of [...ids, ...door])
      if (!(id in connector.subjects))
        assert.ok(!text.includes(`\`${id}\``), `${connector.id} lists \`${id}\``)
  }
})

test('a conformidade recusa uma parte escrita que nomeia uma ferramenta do conector', () => {
  const { id: _id, ...rest } = sankhya
  const tool = toolNameOf(sankhya, 'pedidos')
  function naming(content: string, references: Record<string, string> = {}) {
    return { ...rest, id: 'sankhya', skill: { written: { content, references } } }
  }
  assert.throws(
    () => defineConnector(naming(`---\nname: x\n---\nUse ${tool}.`)),
    /names sankhya_pedidos/,
  )
  assert.throws(
    () => defineConnector(naming('---\nname: x\n---\n', { 'vendas.md': 'sankhya_lancarPedido' })),
    /names sankhya_lancarPedido/,
  )
})
