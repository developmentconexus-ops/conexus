import { DeleteTableCommand, ListTablesCommand } from '@aws-sdk/client-s3tables'
import { DeleteMessageCommand, ReceiveMessageCommand } from '@aws-sdk/client-sqs'
import { z } from 'zod'
import type { LakeId } from './aws-names.ts'
import { bucketName } from './aws-names.ts'
import type { Attempt, AwsAnswer, Session, Where } from './aws-session.ts'
import { isNamed, POLL_SECONDS } from './aws-session.ts'
import type { AwsConfig } from './config-aws.ts'

type LakeTable = Readonly<{ namespace: 'raw' | 'current'; name: string }>

export type CopyQueue = {
  /** One long poll, never the database. Aborting `signal` ends it with no answer. */
  receive(signal: AbortSignal): Promise<AwsAnswer<readonly { handle: string; body: string }[]>>
  acknowledge(handle: string): Promise<AwsAnswer<void>>
}
export type LakeTables = {
  list(at: Where, lake: LakeId): Promise<AwsAnswer<readonly LakeTable[]>>
  /** A table AWS does not have counts as dropped. */
  drop(at: Where, lake: LakeId, table: LakeTable): Promise<AwsAnswer<void>>
}

const Received = z.object({
  Messages: z.array(z.object({ ReceiptHandle: z.string(), Body: z.string() })).optional(),
})
const ListedTables = z.object({
  tables: z
    .array(
      z.object({
        namespace: z.tuple([z.enum(['raw', 'current'])]),
        name: z.string(),
      }),
    )
    .optional(),
  continuationToken: z.string().optional(),
})

function tableBucketArn(at: Where, lake: LakeId): string {
  return `arn:aws:s3tables:${at.region}:${at.account}:bucket/${bucketName(lake)}`
}

async function listTables({ clients, abortSignal }: Session, at: Where, lake: LakeId) {
  const tables: LakeTable[] = []
  let continuationToken: string | undefined
  do {
    const read = ListedTables.parse(
      await clients.tables.send(
        new ListTablesCommand({ tableBucketARN: tableBucketArn(at, lake), continuationToken }),
        { abortSignal },
      ),
    )
    for (const { namespace, name } of read.tables ?? [])
      tables.push({ namespace: namespace[0], name })
    continuationToken = read.continuationToken
  } while (continuationToken !== undefined)
  return tables
}

async function dropTable(
  { clients, abortSignal }: Session,
  at: Where,
  lake: LakeId,
  table: LakeTable,
) {
  try {
    await clients.tables.send(
      new DeleteTableCommand({
        tableBucketARN: tableBucketArn(at, lake),
        namespace: table.namespace,
        name: table.name,
      }),
      { abortSignal },
    )
  } catch (error) {
    if (!isNamed(error, 'NotFoundException')) throw error
  }
}

/** The copy's end queue and the lake's tables over one `Attempt`, which owns the sessions (C56). */
export function copyQueuePorts(
  attempt: Attempt,
  copy: AwsConfig['copy'],
): { queue: CopyQueue; tables: LakeTables } {
  return {
    queue: {
      receive: (signal) =>
        attempt.queue('ReceiveMessage', signal, async ({ clients, abortSignal }) => {
          const read = Received.parse(
            await clients.poll.send(
              new ReceiveMessageCommand({
                QueueUrl: copy.queueUrl,
                MaxNumberOfMessages: 10,
                WaitTimeSeconds: POLL_SECONDS,
              }),
              { abortSignal },
            ),
          )
          return (read.Messages ?? []).map((message) => ({
            handle: message.ReceiptHandle,
            body: message.Body,
          }))
        }),
      acknowledge: (handle) =>
        attempt.queue('DeleteMessage', null, async ({ clients, abortSignal }) => {
          await clients.sqs.send(
            new DeleteMessageCommand({ QueueUrl: copy.queueUrl, ReceiptHandle: handle }),
            { abortSignal },
          )
        }),
    },
    tables: {
      list: (at, lake) => attempt('ListTables', at, (session) => listTables(session, at, lake)),
      drop: (at, lake, table) =>
        attempt('DeleteTable', at, (session) => dropTable(session, at, lake, table)),
    },
  }
}
