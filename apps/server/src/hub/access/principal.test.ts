import assert from 'node:assert/strict'
import { test } from 'node:test'
import { rolesWorld } from '../copies/test-readers.ts'
import { operationLeaf, Principal, principalFor, tableLeaf } from './public.ts'

test('um Principal só sai de principalFor', async (t) => {
  const w = await rolesWorld(t, 'NONE')
  const made = principalFor({
    ...{ consumer: 'assistant', companyId: w.on.companyId, personId: w.brunoId },
    ...{ place: { kind: 'COMPANY' }, choice: { kind: 'ANY' } },
  })
  const fields = {
    ...{ consumer: made.consumer, companyId: made.companyId, personId: made.personId },
    ...{ place: made.place, declared: made.declared },
  }
  // @ts-expect-error: an object of the Principal's shape is not a Principal
  const literal: Principal = fields
  // @ts-expect-error: the Principal's constructor is private
  const built = new Principal(fields)
  assert.ok(made instanceof Principal)
  assert.ok(!(literal instanceof Principal))
  assert.deepEqual([made.place, made.declared], [{ kind: 'COMPANY' }, undefined])
  assert.ok(built instanceof Principal, 'only the compiler refuses the constructor')
})

test('may diz o teto e o fora do alcance', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  const sankhya = w.on.connectionId
  const view = await w.on.hub.access.viewOf(
    principalFor({
      ...{ consumer: 'assistant', companyId: w.on.companyId, personId: w.brunoId },
      ...{ place: { kind: 'COMPANY' }, choice: { kind: 'ANY' } },
    }),
  )
  assert.deepEqual(view.may(tableLeaf('sankhya_vendas'), 'WRITE'), {
    kind: 'REFUSED',
    reason: 'ABOVE_CEILING',
  })
  assert.deepEqual(view.may(operationLeaf(sankhya, 'clientes'), 'READ'), {
    kind: 'REFUSED',
    reason: 'OUT_OF_REACH',
  })
  assert.deepEqual(view.may(operationLeaf(sankhya, 'pedidos'), 'READ'), {
    kind: 'ALLOWED',
    ceiling: 'READ',
  })
})
