import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CONNECTORS } from '../index.ts'
import { sankhya } from '../sankhya/definition.ts'
import { defineConnector } from './definition.ts'

test('a classe da credencial: o Sankhya compartilhável, o Mercado Livre e o HubSpot exclusiva; um login sem a classe é recusado', () => {
  const classes = Object.fromEntries(
    CONNECTORS.map((connector) => [connector.id, connector.auth.credentialClass]),
  )
  assert.deepEqual(classes, {
    sankhya: 'SHAREABLE',
    'mercado-livre': 'EXCLUSIVE',
    hubspot: 'EXCLUSIVE',
  })
  const { id: _id, auth, ...rest } = sankhya
  const { credentialClass: _class, ...unclassed } = auth
  const without = { ...rest, id: 'sankhya', auth: { ...unclassed, credentialClass: undefined } }
  assert.throws(() => defineConnector(Object(without)), /credentialClass|Invalid/)
})
