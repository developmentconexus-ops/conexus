import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { CONNECTORS } from '../index.ts'
import { sankhya } from '../sankhya/definition.ts'
import type { ConnectorCopy } from './copy.ts'
import { CopyName, copyPrefixOf } from './copy.ts'
import { defineConnector } from './definition.ts'

const Unchecked = z.custom<ConnectorCopy>()

function withModel(change: (definition: ConnectorCopy['models'][number]['definition']) => unknown) {
  const { copy, id: _id, ...rest } = sankhya
  assert.ok(copy)
  const [model] = copy.models
  assert.ok(model)
  const models = [{ ...model, definition: change(model.definition) }]
  return () =>
    defineConnector({ ...rest, id: 'sankhya', copy: Unchecked.parse({ read: copy.read, models }) })
}

test('o kit recusa o modelo sem descrição de tabela', () => {
  assert.throws(
    withModel(({ description: _table, ...definition }) => definition),
    /Copy template without description/,
  )
})

test('o kit recusa o modelo com uma coluna sem descrição', () => {
  assert.throws(
    withModel(({ columns: [first, ...others], ...definition }) => ({
      ...definition,
      columns: [{ name: first?.name, type: first?.type }, ...others],
    })),
    /Copy template column without description: clientes\.CODPARC/,
  )
})

test('cada modelo do kit cabe em 40 caracteres com o prefixo do conector', () => {
  for (const connector of CONNECTORS)
    for (const model of connector.copy?.models ?? [])
      assert.ok(
        CopyName.safeParse(`${copyPrefixOf(connector.id)}${model.id}`).success,
        `${connector.id}.${model.id}`,
      )
})

test('o prefixo troca o hífen', () => {
  assert.equal(copyPrefixOf('mercado-livre'), 'mercado_livre_')
})
