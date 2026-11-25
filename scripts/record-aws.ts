// `npm run record-aws` records the answers of the AWS calls of the lake copy's three ports
// (`apps/server/src/platform/aws-copy.ts`) from the laboratory account: PutParameter and
// DeleteParameter, RunTask, StopTask, DescribeTasks and ListTasks, ReceiveMessage and DeleteMessage,
// ListTables and DeleteTable (issue 1267). It calls the SDK the adapter uses, at the version the
// adapter pins, with the profile `conexus-lab` in `us-east-2`, and keeps each answer as AWS sent it
// (record-aws-wire.ts) with the account and every id changed for invented ones (S40).
//
// What it makes in the laboratory it ends: one parameter, two Fargate tasks that stop at once or end
// by themselves, the messages of the queue it reads, and a table bucket with two tables that it
// deletes with them. The task runs as the platform's execution role (no lake in the laboratory has a
// writer role), which may not read the parameter, so it fails there and stops by itself.
//
// `npm run record-aws state` makes one scratch bucket, keeps the answers of GetObject and PutObject
// on a connection's state file (U10), then deletes the object and the bucket.
import { randomBytes } from 'node:crypto'
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation'
import { ECSClient } from '@aws-sdk/client-ecs'
import { S3Client } from '@aws-sdk/client-s3'
import { S3TablesClient } from '@aws-sdk/client-s3tables'
import { SQSClient } from '@aws-sdk/client-sqs'
import { SSMClient } from '@aws-sdk/client-ssm'
import { z } from 'zod'
import { recordState } from './record-aws-state.ts'
import { recordQueue, recordTables, recordTasks } from './record-aws-steps.ts'
import type { World } from './record-aws-wire.ts'
import { CapturingHandler, Inventor, Outputs } from './record-aws-wire.ts'

const Environment = z.object({
  AWS_PROFILE: z.literal('conexus-lab'),
  AWS_REGION: z.literal('us-east-2'),
})

async function worldOf(): Promise<World> {
  Environment.parse(process.env)
  const handler = new CapturingHandler({})
  const shared = { region: 'us-east-2', maxAttempts: 1, requestHandler: handler }
  const stacks =
    (await new CloudFormationClient({ region: 'us-east-2' }).send(new DescribeStacksCommand({})))
      .Stacks ?? []
  const platform = stacks.find((stack) => stack.StackName === 'conexus-plataforma')
  const outputs = Outputs.parse(
    Object.fromEntries((platform?.Outputs ?? []).map((out) => [out.OutputKey, out.OutputValue])),
  )
  const account = /:(\d{12}):/.exec(outputs.CopyClusterArn)?.[1] ?? ''
  // S3 Tables holds a deleted bucket's name for minutes: each run takes a name of its own.
  const tableLake = randomBytes(6).toString('hex')
  const inventor = new Inventor([tableLake])
  return {
    handler,
    inventor,
    recordedAt: new Date().toISOString().slice(0, 10),
    ecs: new ECSClient(shared),
    ssm: new SSMClient(shared),
    sqs: new SQSClient(shared),
    tables: new S3TablesClient(shared),
    s3: new S3Client({ ...shared, followRegionRedirects: false }),
    outputs,
    account,
    tableLake,
  }
}

async function main(): Promise<void> {
  const world = await worldOf()
  if (process.argv[2] === 'tables') return recordTables(world)
  if (process.argv[2] === 'state') return recordState(world)
  const started = await recordTasks(world)
  try {
    await recordQueue(world, started)
  } finally {
    await recordTables(world)
  }
}

await main()
