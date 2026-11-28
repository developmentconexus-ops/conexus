import type { Hub } from './test-hub.ts'

export async function ageTo(hub: Hub, seconds: number) {
  await hub.test.asOwner(
    `update auth.session set created_at = created_at - make_interval(secs => shift),
      updated_at = updated_at - make_interval(secs => shift),
      expires_at = expires_at - make_interval(secs => shift)
    from (select id, $1 - extract(epoch from statement_timestamp() - created_at) as shift
      from auth.session) as span
    where span.id = session.id`,
    [seconds],
  )
}
