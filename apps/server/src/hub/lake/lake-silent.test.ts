import assert from 'node:assert/strict'
import { test } from 'node:test'
import { awsRecording, TEST_AWS_ACCOUNT, TEST_AWS_REGION } from '../../platform/test-aws.ts'
import { awsAt, session } from '../../platform/test-aws-wire.ts'
import { lakeIn, lakeLines, lakeWorld, readLake, TEST_STACK } from './test-lake.ts'

/** How long the screen waits for the Hub (`DEADLINE_MS` in web platform/hub.ts). */
const SCREEN_DEADLINE_MS = 10_000

test('lago: a AWS calada não derruba a leitura, dentro do prazo da tela', async (t) => {
  // The longest read, with production's deadlines: the stack answers gone, as a failed creation
  // leaves it, and then its events and S3 Tables never answer (QA of PR 1248, finding 1).
  const wire = await awsAt(t, ({ action }) => {
    if (action === 'AssumeRole') return session()
    if (action === 'DescribeStacks') return awsRecording('describe-stacks-apagada-pelo-id')
    return 'SILENT'
  })
  const { aws } = wire.config
  const { hub, ana, a } = await lakeWorld(t, (same) => ({ ...same, aws }), { aws: wire.stacks })
  await hub.test.asOwner(
    `insert into lake.company_lake (company_id, lake_id, state, account, region, template, stack_id, since)
     values ($1, 'k3x9a0b1c2d3', 'creating', $2, $3, $4, $5, now())`,
    [a.companyId, TEST_AWS_ACCOUNT, TEST_AWS_REGION, aws.templateVersion, TEST_STACK],
  )
  const started = performance.now()
  const read = await readLake(hub, ana, a)
  const took = performance.now() - started
  assert.deepEqual([read.statusCode, lakeIn(read).state], [200, 'CREATING'])
  assert.ok(took < SCREEN_DEADLINE_MS, `the read took ${Math.round(took)} ms`)
  assert.deepEqual(
    lakeLines(hub, 'LAKE_AWS_SILENT').map(({ call }) => call),
    ['DescribeStackEvents', 'Leftover'],
  )
})
