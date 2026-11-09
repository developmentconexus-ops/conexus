import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CONNECTORS } from '../index.ts'
import { Rows } from './rows.ts'

test('a marca many: toda leitura do kit devolve linhas e a leva; nenhuma escrita a leva', () => {
  assert.ok(CONNECTORS.length > 0)
  for (const connector of CONNECTORS) {
    const reads = [...connector.operations, ...Object.values(connector.readDoor ?? {})]
    assert.ok(reads.length > 0, connector.id)
    for (const read of reads) {
      assert.equal(read.many, true, `${connector.id}.${read.id}`)
      const empty = read.answer({ status: 404, body: undefined })
      if (empty.kind === 'OK') assert.equal(Rows.safeParse(empty.value).success, true, read.id)
    }
    for (const write of connector.writes ?? [])
      assert.equal(write.many, undefined, `${connector.id}.${write.id}`)
  }
})
