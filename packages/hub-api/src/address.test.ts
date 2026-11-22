import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  AppHost,
  appOfHost,
  CompanyNickname,
  HostLabel,
  hostLabelOf,
  isReservedNickname,
  PreviewHost,
  previewHostOf,
  suggestedNickname,
} from './address.ts'

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

test('endereço: um nome longo é cortado para caber em 55, sem hífen na ponta', () => {
  const long = hostLabelOf({ name: 'x'.repeat(100), nickname: NICK })
  assert.equal(long, `${'x'.repeat(44)}--empresa-a`)
  assert.equal(long?.length, 55)
  const atHyphen = hostLabelOf({ name: `${'a'.repeat(43)} bcd`, nickname: NICK })
  assert.equal(atHyphen, `${'a'.repeat(43)}--empresa-a`)
})

test('endereço: todo rótulo novo tem host de Prévia, de cada comprimento de apelido', () => {
  for (let length = 3; length <= 30; length += 1) {
    const nickname = CompanyNickname.parse('n'.repeat(length))
    const label = hostLabelOf({ name: 'x'.repeat(100), nickname })
    assert.ok(label !== undefined && label.length <= 55, `${length}`)
    assert.equal(previewHostOf(label), `${label}--previa`, `${length}`)
  }
})

test('endereço: um rótulo de 56 a 63 caracteres não tem host de Prévia', () => {
  for (let length = 56; length <= 63; length += 1) {
    const label = HostLabel.parse(`${'x'.repeat(length - 11)}--empresa-a`)
    assert.equal(previewHostOf(label), undefined, `${length}`)
  }
})

test('Prévia: o host é o rótulo e a marca, e o host diz o ambiente', () => {
  const label = HostLabel.parse('estoque--metal-nobre')
  const preview = previewHostOf(label)
  assert.equal(preview, 'estoque--metal-nobre--previa')
  assert.ok(preview !== undefined)
  assert.deepEqual(appOfHost(preview), { label: 'estoque--metal-nobre', environment: 'preview' })
  assert.deepEqual(appOfHost(label), { label: 'estoque--metal-nobre', environment: 'published' })
  assert.deepEqual(appOfHost(PreviewHost.parse('estoque--previa--previa')), {
    label: 'estoque--previa',
    environment: 'preview',
  })
  assert.deepEqual(appOfHost(HostLabel.parse('estoque--previa')), {
    label: 'estoque--previa',
    environment: 'published',
  })
})

test('Prévia: cada esquema recusa o host do outro ambiente e as formas fora da regra', () => {
  const refused = {
    'três partes sem previa no fim': 'estoque--metal-nobre--preview',
    'quatro partes': 'estoque--metal-nobre--previa--previa',
    'previa sozinho': 'previa',
    'uma parte com --': 'estoque----metal-nobre--previa',
    'mais de 63 caracteres': `${'x'.repeat(46)}--empresa-a--previa`,
  }
  for (const [why, host] of Object.entries(refused)) {
    assert.equal(AppHost.safeParse(host).success, false, why)
  }
  assert.equal(HostLabel.safeParse('estoque--metal-nobre--previa').success, false)
  assert.equal(PreviewHost.safeParse('estoque--metal-nobre').success, false)
  assert.equal(AppHost.safeParse('estoque--metal-nobre').success, true)
  assert.equal(AppHost.safeParse('estoque--metal-nobre--previa').success, true)
})

test('apelido: a sugestão vem do nome da empresa; os reservados são os onze da lista', () => {
  assert.equal(suggestedNickname('Metal Nobre Ltda.'), 'metal-nobre-ltda')
  assert.equal(suggestedNickname('Empresa A'), 'empresa-a')
  assert.equal(suggestedNickname('AB'), '')
  assert.equal(suggestedNickname('Uma Empresa de Nome Muito Comprido S.A.').length, 30)
  assert.equal(isReservedNickname(CompanyNickname.parse('conexus')), true)
  assert.equal(isReservedNickname(NICK), false)
})
