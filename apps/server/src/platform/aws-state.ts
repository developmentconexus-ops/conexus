import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import type { ConnectionId } from '@conexus/hub-api'
import { z } from 'zod'
import { stateBucketName, stateKey } from './aws-names.ts'
import type { Session, Where } from './aws-session.ts'
import { isNamed } from './aws-session.ts'

const Bookmarks = z.looseObject({
  singer_state: z
    .looseObject({ bookmarks: z.record(z.string(), z.unknown()).optional() })
    .optional(),
})
const StateFile = z.looseObject({ completed: Bookmarks.optional(), partial: Bookmarks.optional() })

/**
 * One stream's stopping point out of its connection's state file, which Meltano keeps in the
 * company's prefix: the file read, the stream taken from each place it is kept and the file written
 * back, only when it changed. A file or a stream that is not there counts as forgotten, so a repeat
 * ends what an interrupted one began. The caller holds the connection's rounds closed, so the task
 * does not write the file meanwhile.
 */
export async function forgetStoppingPoint(
  { clients, abortSignal }: Session,
  at: Where,
  connection: ConnectionId,
  stream: string,
) {
  const where = {
    Bucket: stateBucketName(at.account, at.region),
    Key: stateKey(at.company, connection),
  }
  let text: string
  try {
    const found = await clients.state.send(new GetObjectCommand(where), { abortSignal })
    text = (await found.Body?.transformToString()) ?? ''
  } catch (error) {
    if (isNamed(error, 'NoSuchKey')) return
    throw error
  }
  const file = StateFile.parse(JSON.parse(text))
  let changed = false
  for (const kept of [file.completed, file.partial]) {
    const bookmarks = kept?.singer_state?.bookmarks
    if (bookmarks !== undefined && stream in bookmarks) {
      delete bookmarks[stream]
      changed = true
    }
  }
  if (!changed) return
  await clients.state.send(
    new PutObjectCommand({ ...where, Body: JSON.stringify(file), ContentType: 'application/json' }),
    { abortSignal },
  )
}
