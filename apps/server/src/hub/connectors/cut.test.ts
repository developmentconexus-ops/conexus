import assert from 'node:assert/strict'
import { test } from 'node:test'
import { shaped } from './test-app-calls.ts'

function row(n: number) {
  return { codigo: n, nome: `Empresa ${n}` }
}

test('o corte: 500 linhas viram 20 inteiras com complete falso; menos de 20 e sem mais ficam completas', () => {
  const cut = shaped({ linhas: Array.from({ length: 500 }, (_, n) => row(n)), temMais: false })
  assert.equal(Object(cut.value).linhas.length, 20)
  assert.equal(cut.complete, false)
  const small = shaped({ linhas: [row(1), row(2)], temMais: false })
  assert.deepEqual([Object(small.value).linhas.length, small.complete], [2, true])
  assert.equal(shaped({ linhas: [row(1)], temMais: true }).complete, false)
})

test('o corte: passa de 16 KB, o texto longo é cortado com reticências antes de perder linha; sobrando, perde linhas do fim', () => {
  const note = { chave: 1, xmlNFe: 'x'.repeat(40_000) }
  const one = shaped({ linhas: [note], temMais: false })
  const kept = Object(one.value).linhas
  assert.equal(kept.length, 1)
  assert.ok(kept[0].xmlNFe.endsWith('…') && kept[0].xmlNFe.length < 700)
  assert.equal(one.complete, false)
  const wide = {
    linhas: Array.from({ length: 20 }, (_, n) => ({
      n,
      a: 'y'.repeat(590),
      b: 'z'.repeat(590),
      c: 'w'.repeat(590),
    })),
    temMais: false,
  }
  const many = shaped(wide)
  assert.ok(Buffer.byteLength(JSON.stringify(many.value)) <= 16 * 1024)
  assert.ok(Object(many.value).linhas.length < 20 && Object(many.value).linhas.length > 0)
  assert.equal(many.complete, false)
})

test('o corte: uma linha que sozinha passa de 16 KB, e um valor sem linhas que passa, não chegam ao modelo; ele lê complete falso', () => {
  const wide = Object.fromEntries(Array.from({ length: 100 }, (_, n) => [`c${n}`, 'x'.repeat(500)]))
  const row = shaped({ linhas: [wide], temMais: false })
  assert.deepEqual(row, { value: { linhas: [], temMais: false }, complete: false })
  const many = shaped(Array.from({ length: 4_000 }, (_, n) => `valor ${n}`))
  assert.deepEqual(many, { value: null, complete: false })
  const short = shaped({ total: 3 })
  assert.deepEqual(short, { value: { total: 3 }, complete: true })
})

test('o corte: uma leitura cujos campos fora das linhas passam de 16 KB não chega ao modelo, nem sem nenhuma linha', () => {
  const colunas = Array.from({ length: 4_000 }, (_, n) => `coluna ${n}`)
  assert.deepEqual(shaped({ linhas: [row(1)], temMais: false, colunas }), {
    value: null,
    complete: false,
  })
  assert.deepEqual(shaped({ linhas: [], temMais: false, colunas }), {
    value: null,
    complete: false,
  })
})
