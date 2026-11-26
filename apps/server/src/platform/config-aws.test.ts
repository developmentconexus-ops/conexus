import assert from 'node:assert/strict'
import { test } from 'node:test'
import { AwsEnvironment, awsConfigOf } from './config-aws.ts'
import { TEST_AWS_ACCOUNT, TEST_AWS_REGION } from './test-aws.ts'
import { serveEnvironment, unreachableDatabaseUrl } from './test-database.ts'

function refusal(env: Record<string, string | undefined>, variable: string) {
  const read = AwsEnvironment.safeParse(env)
  assert.equal(read.success, false, variable)
  assert.deepEqual([...new Set(read.error?.issues.map((issue) => issue.path[0]))], [variable])
}

test('configuração: as saídas da plataforma da cópia entram na configuração, e uma errada derruba a subida', async (t) => {
  const env = serveEnvironment(t, await unreachableDatabaseUrl(), { port: 8080, edgePort: 8081 })
  assert.deepEqual(awsConfigOf(AwsEnvironment.parse(env), env).copy, {
    clusterArn: `arn:aws:ecs:${TEST_AWS_REGION}:${TEST_AWS_ACCOUNT}:cluster/conexus-copia`,
    taskFamily: 'conexus-copia',
    subnets: ['subnet-0aaaaaaaaaaaaaaa1', 'subnet-0aaaaaaaaaaaaaaa2'],
    securityGroup: 'sg-0aaaaaaaaaaaaaaa1',
    queueUrl: `https://sqs.${TEST_AWS_REGION}.amazonaws.com/${TEST_AWS_ACCOUNT}/conexus-copia-fim`,
  })
  for (const [name, value] of [
    ['HUB_AWS_COPY_CLUSTER_ARN', 'conexus-copia'],
    ['HUB_AWS_COPY_SUBNETS', 'subnet-0aaaaaaaaaaaaaaa1,,'],
    ['HUB_AWS_COPY_SECURITY_GROUP', 'grupo'],
    ['HUB_AWS_COPY_QUEUE_URL', 'https://sqs.example.com'],
  ] as const) {
    refusal({ ...env, [name]: value }, name)
  }
})
