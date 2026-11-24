import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CONNECTORS } from '../index.ts'
import { sankhya } from '../sankhya/definition.ts'
import { defineConnector } from './definition.ts'

test('nenhum modelo: o kit não oferece modelo de cópia e recusa o conector que ainda declare um', () => {
  for (const connector of CONNECTORS) assert.equal('copy' in connector, false, connector.id)
  const { id: _id, ...rest } = sankhya
  const declaring = { ...rest, id: 'sankhya', copy: { read: sankhya.check, models: [] } }
  assert.throws(() => defineConnector(declaring), /declares no copy models/)
})
