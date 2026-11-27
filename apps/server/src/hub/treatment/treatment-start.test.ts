import assert from 'node:assert/strict'
import { test } from 'node:test'
import { OF_NOTAS, treatmentOn } from './test-treatment.ts'

const BOTH = ['tratado__sankhya_notas', 'tratado__sankhya_parceiros']

test('a partida pede só os modelos que existem: o que some entre a abertura e a partida fica na seleção da rodada e fora da especificação', async (t) => {
  const on = await treatmentOn(t)
  const venda = await on.proposed(OF_NOTAS)
  await on.approved(venda.id, venda.version)
  // The model goes in the transaction that opens the run: after its selection was read, before its start.
  await on.rows(
    `create function treatment.vanish() returns trigger language plpgsql security definer as $$
     begin delete from treatment.model where name = 'venda'; return new; end $$`,
  )
  await on.rows(
    `create trigger vanish after insert on treatment.run for each row execute function treatment.vanish()`,
  )

  await on.copyEnded()

  const [run] = await on.treatRuns()
  assert.ok(run !== undefined)
  assert.deepEqual(run.select, [...BOTH, 'negocio__venda'])
  assert.equal(run.state, 'RUNNING')
  const spec = on.specIn(run.id)
  assert.deepEqual(spec.select, BOTH)
  assert.deepEqual(
    spec.models.map((model) => model.name),
    BOTH,
  )
})
