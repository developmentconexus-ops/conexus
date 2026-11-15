import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ConnectorId } from '@conexus/hub-api'
import { CONNECTORS } from '../connectors/public.ts'
import { copyPrefixOf, modelCopyName } from './naming.ts'

const MERCADO_LIVRE = ConnectorId.parse('mercado-livre')

test('o prefixo troca o hífen', () => {
  assert.equal(copyPrefixOf(MERCADO_LIVRE), 'mercado_livre_')
  assert.equal(modelCopyName(MERCADO_LIVRE, 'pedidos'), 'mercado_livre_pedidos')
})

test('cada modelo do kit cabe em 40 caracteres com o prefixo', () => {
  for (const connector of CONNECTORS)
    for (const model of connector.copy?.models ?? [])
      assert.doesNotThrow(
        () => modelCopyName(connector.id, model.id),
        `${connector.id}.${model.id}`,
      )
})
