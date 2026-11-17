import assert from 'node:assert/strict'
import { setTimeout } from 'node:timers/promises'
import type { Hub } from '../../hub/identity/test-hub.ts'
import { withOwnerLock, withRoleLock } from '../../platform/test-database.ts'

const WAITING = `select a.pid from pg_locks l join pg_stat_activity a on a.pid = l.pid
  where not l.granted and a.datname = current_database()
    and l.relation = 'connectors.connection'::regclass`

/**
 * `request`'s answer when the access door's read of the company's connections loses its
 * connection to the database, as a database going away drops it: the read waits on a lock of the
 * connections, and its backend is ended there.
 */
export async function doorDropped<T>(hub: Hub, request: () => Promise<T>): Promise<T> {
  const lock = 'lock table connectors.connection in access exclusive mode'
  return withOwnerLock(hub.test, lock, [], async (release) => {
    const answer = request()
    const deadline = Date.now() + 5_000
    let pid: number | undefined
    while (pid === undefined) {
      assert.ok(Date.now() < deadline, "the door's read never waited on the lock")
      const [row] = await hub.test.asOwner(WAITING)
      pid = row === undefined ? undefined : Number(Object(row).pid)
      if (pid === undefined) await setTimeout(20)
    }
    // Ending another login's backend needs its privileges, which the owner holds only for this moment.
    await withRoleLock(async () => {
      await hub.test.asOwner('grant hub_runtime to current_user')
      try {
        await hub.test.asOwner('select pg_terminate_backend($1)', [pid])
      } finally {
        await hub.test.asOwner('revoke hub_runtime from current_user')
      }
    })
    await release()
    return answer
  })
}
