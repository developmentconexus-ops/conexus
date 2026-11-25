import { createHash, randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { WireAnswer } from './test-aws.ts'
import { awsRecording } from './test-aws.ts'

/** A scripted answer: the recorded refusal, or the answer held past the caller's deadline after it took effect. */
export type Scripted = 'REFUSED' | 'HELD'
/** The next answers of the copy's start calls, scripted, in order. */
export type Scripts = Record<'PutParameter' | 'RunTask', Scripted[]>

/** A task the double started, kept by its token. */
export type ServedTask = {
  arn: string
  startedBy: string
  token: string
  request: string
  stopped: boolean
  /** ECS's `stoppedAt` in ms; null keeps the recording's. */
  stoppedAt: number | null
  /** After a `StopTask`, the reads of its state still RUNNING before it stops; null when not stopping. */
  stopping: number | null
}

const HELD_MS = 5_000

/** The copy's start as the double sees it: when each parameter arrived, by the test's clock, and the next answers scripted. */
export class CopyStart {
  readonly writes: number[] = []
  readonly scripts: Scripts = { PutParameter: [], RunTask: [] }
  now: () => number = () => Date.now()

  wrote(): void {
    this.writes.push(this.now())
  }

  /** The next `PutParameter` or `RunTask` is refused as recorded, or held past the deadline after it took effect. */
  script(call: keyof Scripts, answer: Scripted): void {
    this.scripts[call].push(answer)
  }
}

/** A call's answer as its script says: refused as recorded, or held after it took effect. */
export async function scripted(
  scripts: Scripts,
  operation: string,
  answer: () => WireAnswer,
): Promise<WireAnswer> {
  if (operation !== 'PutParameter' && operation !== 'RunTask') return answer()
  const next = scripts[operation].shift()
  if (next === 'REFUSED') {
    if (operation !== 'RunTask') throw new Error(`no recorded refusal of ${operation}`)
    return awsRecording('run-task-familia-inexistente')
  }
  const value = answer()
  if (next === 'HELD') await new Promise((resolve) => setTimeout(resolve, HELD_MS))
  return value
}

const Recorded = z.looseObject({ tasks: z.array(z.looseObject({ taskArn: z.string() })) })
const Batch = z.looseObject({ Messages: z.array(z.looseObject({ Body: z.string() })) })
export const RECORDED_TASK =
  Recorded.parse(JSON.parse(awsRecording('run-task').body)).tasks[0]?.taskArn ?? ''
const RECORDED_RUN = '00000000-0000-4000-8000-0000000000a1'
const Stop = z.object({ detail: z.object({ taskArn: z.string(), startedBy: z.string() }) })
export const [STOPPED_BY_HUB, EXITED] = Batch.parse(
  JSON.parse(awsRecording('receive-message-lote').body),
).Messages.map(({ Body }) => ({ body: Body, ...Stop.parse(JSON.parse(Body)).detail }))
export type TaskStop = 'STOPPED_BY_HUB' | 'EXITED'

export function reply(
  recording: string,
  change: (text: string) => string = (text) => text,
): WireAnswer {
  const answer = awsRecording(recording)
  return { ...answer, body: change(answer.body) }
}

/** A recorded answer about the recorded task, said of another task and round (values changed, T29). */
export function aboutTask(recording: string, task: { arn: string; startedBy: string }): WireAnswer {
  return reply(recording, (body) =>
    body.replaceAll(RECORDED_TASK, task.arn).replaceAll(RECORDED_RUN, task.startedBy),
  )
}

const RECORDED_STOPPED_AT = '"stoppedAt":1.795E9'

export function stoppedTask(task: ServedTask): WireAnswer {
  const answer = aboutTask('describe-tasks-parada', task)
  if (!answer.body.includes(RECORDED_STOPPED_AT))
    throw new Error('the recording lost its stoppedAt')
  if (task.stoppedAt === null) return answer
  const at = `"stoppedAt":${task.stoppedAt / 1000}`
  return { ...answer, body: answer.body.replace(RECORDED_STOPPED_AT, at) }
}

export const TASK_PATH = /task\/conexus-copia\/[0-9a-f]{32}/

/** One long poll: what waits in the queue, or, after a short wait, nothing. */
export async function receiveFrom(
  queue: readonly { handle: string; body: string }[],
): Promise<WireAnswer> {
  if (queue.length === 0) {
    await new Promise((resolve) => setTimeout(resolve, 250))
    return awsRecording('receive-message-vazio')
  }
  const messages = queue.map(({ handle, body }) => ({
    Body: body,
    MD5OfBody: createHash('md5').update(body).digest('hex'),
    MessageId: randomUUID(),
    ReceiptHandle: handle,
  }))
  return reply('receive-message-lote', () => JSON.stringify({ Messages: messages }))
}
