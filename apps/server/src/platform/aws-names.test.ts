import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { isDeepStrictEqual } from 'node:util'
import { BUCKET_PREFIX, TREATER_SUFFIX } from '../../../../infra/aws/lib/names.ts'
import { LakeId, treaterRoleArn } from './aws-names.ts'
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
