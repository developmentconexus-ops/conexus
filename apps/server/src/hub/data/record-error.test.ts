import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readerAt } from '../access/test-principal.ts'
import { rolesWorld } from './test-company.ts'

test('um erro que não é de indisponibilidade não é engolido', async (t) => {
  const w = await rolesWorld(t)
  await w.on.hub.test.asOwner(`create function data.refuse_read() returns trigger language plpgsql as $$
    begin raise exception 'bad' using errcode = '23514'; end $$`)
  await w.on.hub.test.asOwner(
    'create trigger refuse before insert on data.data_read for each row execute function data.refuse_read()',
  )
  const scope = readerAt({
    companyId: w.on.companyId,
    personId: w.brunoId,
    place: { kind: 'COMPANY' },
  })
  await assert.rejects(() =>
    w.on.hub.data(scope, { thread: null }).read({ kind: 'TABLE', table: 'sankhya_vendas' }),
  )
  assert.deepEqual(
    await w.on.hub.test.asOwner('select * from data.data_read where company_id = $1', [
      w.on.companyId,
    ]),
    [],
  )
  assert.ok(!w.on.hub.lines.some(({ message }) => message === 'DATA_READ_UNRECORDED'))
})
