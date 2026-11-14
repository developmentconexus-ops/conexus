import assert from 'node:assert/strict'
import { test } from 'node:test'
import { sankhya } from '../sankhya/definition.ts'
import { lerInventario } from '../sankhya/inventory.ts'
import { defineConnector } from './definition.ts'

function withInventory(read: unknown) {
  const { id: _id, ...rest } = sankhya
  return () => defineConnector({ ...rest, id: 'sankhya', inventory: Object(read) })
}

test('o kit recusa uma leitura do inventário que não é leitura ou que repete um id', () => {
  assert.doesNotThrow(withInventory({ read: lerInventario }))
  assert.throws(
    withInventory({ read: { ...lerInventario, class: 'write' } }),
    /Inventory read not read/,
  )
  const door = sankhya.readDoor?.consultar
  assert.ok(door)
  assert.throws(
    withInventory({ read: { ...lerInventario, id: door.id } }),
    /Inventory read repeats operation id/,
  )
  const [declared] = sankhya.operations
  assert.ok(declared)
  assert.throws(
    withInventory({ read: { ...lerInventario, id: declared.id } }),
    /Inventory read repeats operation id/,
  )
})
