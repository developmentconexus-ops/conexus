import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BRUNO, call, memberOn } from '../../hub/identity/test-hub.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { assisting, created, talking } from './test-assistant.ts'

test('o cargo e a área', async (t) => {
  const on = await assisting(t)
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  function profile(who: { id: string }, body: object) {
    return call(
      on.hub,
      on.ana,
      'PUT',
      `/api/companies/${on.companyId}/members/${who.id}/profile`,
      body,
    )
  }
  const mine = await talking(
    t,
    on.hub,
    on.ana,
    await created(on.hub, on.ana, on.assistant, { connections: [] }),
  )
  const steps = [
    [{ jobTitle: null, department: null }, 'owner'],
    [{ jobTitle: 'Diretora comercial', department: 'Vendas' }, 'owner; Diretora comercial, Vendas'],
    [{ jobTitle: 'Diretora comercial', department: null }, 'owner; Diretora comercial'],
    [{ jobTitle: null, department: 'Vendas' }, 'owner; Vendas'],
    [{ jobTitle: null, department: null }, 'owner'],
  ] as const
  for (const [index, [body, line]] of steps.entries()) {
    assert.equal((await profile(on.ana, body)).statusCode, 200)
    assert.equal(endOf(await mine.say('Oi')), 'complete')
    assert.match(
      on.calls.at(index)?.systems.at(1)?.text ?? '',
      new RegExp(`Person: Ana Lima \\(${line}\\)\\. Today:`),
    )
  }
  await profile(on.ana, { jobTitle: 'Diretora comercial', department: 'Vendas' })
  await profile(bruno, { jobTitle: 'Analista', department: 'Compras' })
  const his = await talking(
    t,
    on.hub,
    bruno,
    await created(on.hub, bruno, on.assistant, { connections: [] }),
  )
  assert.equal(endOf(await his.say('Oi')), 'complete')
  const block = on.calls.at(steps.length)?.systems.at(1)?.text ?? ''
  assert.match(block, /Person: Bruno Reis \(member; Analista, Compras\)\. Today:/)
  assert.doesNotMatch(block, /Diretora|Vendas/)
})
