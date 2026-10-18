import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyNickname, hostLabelOf, isReservedNickname, suggestedNickname } from './address.ts'

const NICK = CompanyNickname.parse('empresa-a')

test('endereço: o nome sem acento, minúsculo, cada trecho de outro caractere um hífen', () => {
  assert.equal(hostLabelOf({ name: 'Pedidos', nickname: NICK }), 'pedidos--empresa-a')
  assert.equal(hostLabelOf({ name: '  Ação & Vendas! ', nickname: NICK }), 'acao-vendas--empresa-a')
  assert.equal(
    hostLabelOf({ name: 'Acao', nickname: NICK }),
    hostLabelOf({ name: 'Ação', nickname: NICK }),
  )
})

test('endereço: menos de três letras ou números não dão endereço', () => {
  for (const name of ['TI', 'a-b', '!!!', 'x.y', 'é']) {
    assert.equal(hostLabelOf({ name, nickname: NICK }), undefined, name)
  }
  assert.equal(hostLabelOf({ name: 'R&D 2', nickname: NICK }), 'r-d-2--empresa-a')
})

test('endereço: um nome longo é cortado para caber em 63, sem hífen na ponta', () => {
  const long = hostLabelOf({ name: 'x'.repeat(100), nickname: NICK })
  assert.equal(long, `${'x'.repeat(52)}--empresa-a`)
  assert.equal(long?.length, 63)
  const atHyphen = hostLabelOf({ name: `${'a'.repeat(51)} bcd`, nickname: NICK })
  assert.equal(atHyphen, `${'a'.repeat(51)}--empresa-a`)
})

test('apelido: a sugestão vem do nome da empresa; os reservados são os onze da lista', () => {
  assert.equal(suggestedNickname('Metal Nobre Ltda.'), 'metal-nobre-ltda')
  assert.equal(suggestedNickname('Empresa A'), 'empresa-a')
  assert.equal(suggestedNickname('AB'), '')
  assert.equal(suggestedNickname('Uma Empresa de Nome Muito Comprido S.A.').length, 30)
  assert.equal(isReservedNickname(CompanyNickname.parse('conexus')), true)
  assert.equal(isReservedNickname(NICK), false)
})
