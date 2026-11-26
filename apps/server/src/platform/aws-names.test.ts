import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { isDeepStrictEqual } from 'node:util'
import { BUCKET_PREFIX, TREAT_SPEC_ROOT, TREATER_SUFFIX } from '../../../../infra/aws/lib/names.ts'
import { LakeId, treaterRoleArn, treatSpecKey } from './aws-names.ts'
import { TEST_AWS_ACCOUNT } from './test-aws.ts'

const LAKE_TEMPLATE = new URL('../../../../infra/aws/lake.template.json', import.meta.url)
const LAKE = LakeId.parse('k3x9a0b1c2d3')

test('aws: o nome do papel que trata bate com a receita', () => {
  const template = JSON.parse(readFileSync(LAKE_TEMPLATE, 'utf8'))
  const roleName = { 'Fn::Join': ['', [BUCKET_PREFIX, { Ref: 'LakeId' }, TREATER_SUFFIX]] }
  assert.ok(
    Object.values<{ Properties: Record<string, unknown> }>(template.Resources).some(
      ({ Properties }) => isDeepStrictEqual(Properties.RoleName, roleName),
    ),
  )
  assert.equal(
    treaterRoleArn(TEST_AWS_ACCOUNT, LAKE),
    `arn:aws:iam::${TEST_AWS_ACCOUNT}:role/${BUCKET_PREFIX}${LAKE}${TREATER_SUFFIX}`,
  )
})

test('aws: a especificação de uma rodada de tratamento fica na raiz que o Hub grava e o tratamento lê', () => {
  assert.equal(treatSpecKey('empresa', 'rodada', 2), `${TREAT_SPEC_ROOT}/empresa/rodada-2.json`)
})

test('aws: a receita da imagem tem as áreas do tratamento, e por isso trata (cartão F15)', () => {
  const template = JSON.parse(readFileSync(LAKE_TEMPLATE, 'utf8'))
  const areas = Object.values<{ Type: string; Properties: { Namespace?: string } }>(
    template.Resources,
  )
    .filter(({ Type }) => Type === 'AWS::S3Tables::Namespace')
    .map(({ Properties }) => Properties.Namespace)
  assert.ok(areas.includes('tratado') && areas.includes('negocio'), String(areas))
})
