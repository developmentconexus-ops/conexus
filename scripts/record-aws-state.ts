import { randomUUID } from 'node:crypto'
import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import type { World } from './record-aws-wire.ts'
import { recorded } from './record-aws-wire.ts'

const COMPANY = 'EmpresaTesteA0000000000000000001'

const STATE_KEY = `${COMPANY}/EmpresaTesteConexao00000000001/copia:tap-conexus-to-target-conexus/state.json`
const STATE = {
  completed: {
    singer_state: {
      bookmarks: {
        sankhya_notas: { replication_key: 'dtalter', replication_key_value: '2026-11-20' },
        efd_st_media_diaria: { replication_key: 'dtref', replication_key_value: '2026-11' },
      },
    },
  },
}

function call(api: string) {
  return { service: 's3' as const, api }
}

/** The state file's reads and writes, on one scratch bucket of its own that the run deletes (U10). */
export async function recordState(world: World) {
  const bucket = `conexus-gravacao-${randomUUID().slice(0, 8)}`
  world.inventor.pin(bucket, 'conexus-estado-111122223333-us-east-2')
  const made = await recorded(world, null, call('CreateBucket'), () =>
    world.s3.send(
      new CreateBucketCommand({
        Bucket: bucket,
        CreateBucketConfiguration: { LocationConstraint: 'us-east-2' },
      }),
    ),
  )
  if (!made.ok) throw made.error
  try {
    await recorded(world, 'get-object-ausente', call('GetObject'), () =>
      world.s3.send(new GetObjectCommand({ Bucket: bucket, Key: STATE_KEY })),
    )
    const put = await recorded(world, 'put-object', call('PutObject'), () =>
      world.s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: STATE_KEY,
          Body: JSON.stringify(STATE),
          ContentType: 'application/json',
        }),
      ),
    )
    if (!put.ok) throw put.error
    const got = await recorded(world, 'get-object', call('GetObject'), () =>
      world.s3.send(new GetObjectCommand({ Bucket: bucket, Key: STATE_KEY })),
    )
    if (!got.ok) throw got.error
    await got.value.Body?.transformToString()
  } finally {
    await world.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: STATE_KEY }))
    await world.s3.send(new DeleteBucketCommand({ Bucket: bucket }))
  }
}
