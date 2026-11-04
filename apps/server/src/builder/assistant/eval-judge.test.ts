import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BUILDER_TOOL } from '@conexus/hub-api'
import { askedOnce } from './test-handoff.ts'
import { figuresFromReads } from './test-numbers.ts'

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

test('o juiz do caso 8: uma lista de perguntas sem "?" em cada item, ou uma afirmação com "ou", não é uma pergunta com opções', () => {
  const list =
    'Preciso saber:\n1. O critério de compra\n2. Quais produtos\n3. Para quem mandar\nPode me dizer?'
  assert.equal(askedOnce(list), false, 'the question mark after a list of asks is no option list')
  assert.equal(askedOnce('Vou usar o mínimo ou a cobertura. Tudo certo?'), false)
})

const READ = [
  {
    type: 'tool-invocation',
    toolInvocation: {
      state: 'result',
      toolName: BUILDER_TOOL.connectorRead,
      result: { rows: [{ CODPROD: 48213, VLRTOT: 8072.7, NUNOTA: 99123 }] },
    },
  },
]

test('o juiz do briefing: o código que a leitura devolveu é formato, o valor devolvido não', () => {
  assert.equal(figuresFromReads('Filtre o produto 48.213 e a nota 99123.', READ), undefined)
  assert.equal(figuresFromReads('O total foi de R$ 8.072,70 no mês.', READ), '8.072,70')
})
