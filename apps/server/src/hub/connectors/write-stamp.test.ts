import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { writing } from './test-write.ts'

test('o pedido leva a data e a hora do relógio do envio, em Brasília, e o hash do registro não muda com o relógio', async (t) => {
  let now = new Date('2026-11-09T02:30:00Z')
  const on = await writing(t, { clock: () => now })
  assert.equal((await on.ask(on.byAna())).kind, 'OK')
  now = new Date('2026-11-09T13:05:00Z')
  assert.equal((await on.ask(on.byAna())).kind, 'OK')
  assert.deepEqual(
    on.fake
      .orders()
      .map(({ body }) => z.object({ data: z.string(), hora: z.string() }).parse(body)),
    [
      { data: '08/11/2026', hora: '23:30' },
      { data: '09/11/2026', hora: '10:05' },
    ],
  )
  const [first, second] = await on.ledger()
  assert.ok(first?.input_hash)
  assert.equal(first.input_hash, second?.input_hash)
})

test('o pedido que chega sem data e hora recebe a recusa gravada inteira, vira REFUSED e o dublê não guarda nada', async (t) => {
  const on = await writing(t, {
    order: async (request, real) => {
      const { data, hora, ...unstamped } = z.looseObject({}).parse(await request.clone().json())
      assert.equal(typeof data, 'string')
      assert.equal(typeof hora, 'string')
      return real(request.url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(unstamped),
      })
    },
  })
  const answered = await on.ask(on.byAna())
  assert.partialDeepStrictEqual(answered, {
    kind: 'REFUSED',
    native: {
      status: 400,
      code: 'BAD_REQUEST',
      message:
        'Ocorreu algum erro inesperado! Campos não informados no : [data, hora] - Consulte o server.log para maiores informações!',
    },
  })
  assert.equal(on.fake.orders().length, 0)
  assert.equal((await on.ledger())[0]?.state, 'REFUSED')
})
