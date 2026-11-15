import assert from 'node:assert/strict'
import { test } from 'node:test'
import { z } from 'zod'
import { sankhya } from './definition.ts'
import { empresas } from './operations/cadastros.ts'

test('cada leitura pronta recusa o campo que não tem e diz o nome dele, em vez de o jogar fora', () => {
  const earlier = new Map([[empresas.id, { linhas: [{ codigoEmpresa: 1 }], temMais: false }]])
  for (const operation of sankhya.operations) {
    // A read whose probe needs an earlier answer is refused for what it lacks too; the unknown field is named all the same.
    const probe = z.looseObject({}).parse(operation.probe(earlier) ?? {})
    const refused = operation.input.safeParse({ ...probe, telefone: '11999990000' })
    assert.equal(refused.success, false, operation.id)
    assert.ok(
      refused.error?.issues.some((issue) => /Unrecognized key.*telefone/.test(issue.message)),
      operation.id,
    )
  }
})

test('clientes e produtos dizem o que filtram de verdade: nada por nome, documento, código ou grupo', () => {
  function summary(id: string) {
    return sankhya.operations.find((operation) => operation.id === id)?.summary
  }
  assert.match(summary('clientes') ?? '', /Não filtra por nome nem por documento/)
  assert.match(summary('produtos') ?? '', /Não filtra por nome, código nem grupo/)
})
