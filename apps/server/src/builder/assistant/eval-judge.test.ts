import assert from 'node:assert/strict'
import { test } from 'node:test'
import { askedOnce } from './test-handoff.ts'

// The answer of the real model's seventh round to case 8, written again with invented words.
const ONE_QUESTION = `Antes de criar a automação, preciso saber uma coisa: **o que conta como "precisa comprar"?**

1. **Estoque abaixo do mínimo.** Entram os produtos cujo saldo está abaixo do mínimo cadastrado.
2. **Estoque que cobre poucos dias de venda.** Comparo o saldo com a média de vendas recente.
3. **Os dois critérios juntos.**

Tentei conferir no Sankhya se os produtos têm mínimo preenchido, mas a consulta foi recusada.

Me diga qual prefere e eu deixo pronto o botão para criar a automação diária às 8h.`

const QUESTIONS = `Antes de montar a automação, preciso de algumas respostas:

1. **O que conta como comprar:** abaixo do mínimo ou pela cobertura?
2. **Quais produtos:** todos ou só os de um grupo?
3. **Para quem mandar:** só você ou o time todo?`

test('o juiz do caso 8: uma só pergunta com as opções achadas nos dados passa, uma lista de perguntas não', () => {
  assert.equal(askedOnce(ONE_QUESTION), true)
  assert.equal(
    askedOnce('Você quer os produtos abaixo do mínimo ou os que cobrem poucos dias?'),
    true,
  )
  assert.equal(askedOnce(QUESTIONS), false)
  assert.equal(askedOnce('Qual critério você quer usar?'), false, 'a question without its options')
  assert.equal(askedOnce('Pronto, criei o pedido.'), false)
})
