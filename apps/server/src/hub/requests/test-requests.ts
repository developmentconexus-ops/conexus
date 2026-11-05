import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import { companyForVersions, folder, send } from '../apps/test-versions.ts'
import type { Person } from '../identity/test-hub.ts'
import { CARLA, call, codeOf, memberOn, post } from '../identity/test-hub.ts'

const DIEGO = { name: 'Diego Reis', email: 'diego@example.test' }

/**
 * Empresa A's Pedidos with Ana its owner, Carla an administrator, Diego a developer and Bruno a
 * member, and `count` versions sent by Ana, none published.
 */
export async function pedidos(t: TestContext, count: number) {
  const subject = await companyForVersions(t)
  const { hub, companyId, projects, projectId } = subject
  const carla = await memberOn(hub, companyId, CARLA, 'admin')
  const diego = await memberOn(hub, companyId, DIEGO, 'developer')
  for (let number = 1; number <= count; number++)
    await send(subject, subject.ana, folder({}, `#0b6e${String(number).padStart(2, '0')}`))
  const project = `${projects}/${projectId}`
  const company = `/api/companies/${companyId}`
  function ask(person: Person, number: number, message = '', key = randomUUID()) {
    return post(hub, person, `${project}/publish-request`, { number, message }, key)
  }
  function decide(person: Person, requestId: string, body: object) {
    return post(hub, person, `${company}/requests/${requestId}/decision`, body)
  }
  function cancel(person: Person, requestId: string) {
    return hub.app.inject({
      method: 'POST',
      url: `${company}/requests/${requestId}/cancel`,
      headers: { origin: TEST_ORIGIN, cookie: person.cookie },
    })
  }
  function publish(person: Person, number: number) {
    return call(hub, person, 'PUT', `${project}/published-version`, { number })
  }
  async function asked(person: Person, number: number, message = ''): Promise<string> {
    const answer = await ask(person, number, message)
    assert.equal(answer.statusCode, 201, answer.body)
    return String(Object(answer.json()).request.id)
  }
  async function published(): Promise<number | null> {
    const [row] = await hub.test.asOwner(
      `select v.number from apps.app a left join apps.app_version v on v.id = a.published_version_id
        where a.project_id = $1`,
      [projectId],
    )
    const number: unknown = Object(row).number
    return typeof number === 'number' ? number : null
  }
  async function requests() {
    return hub.test.asOwner(
      `select r.number, r.state, r.reason, d.name as decided_by from requests.request r
        left join auth.user d on d.id = r.decided_by where r.project_id = $1
        order by r.created_at, r.id`,
      [projectId],
    )
  }
  /** The person's request notices as the bell lists them, oldest first. */
  async function notices(person: Person) {
    const answer = await call(hub, person, 'GET', `${company}/notifications`)
    assert.equal(answer.statusCode, 200, answer.body)
    const rows: Record<string, unknown>[] = Object(answer.json()).notifications
    return rows
      .filter((row) => String(row.kind).startsWith('REQUEST_'))
      .reverse()
      .map(({ id: _id, createdAt: _at, read: _read, projectId: _p, ...rest }) => rest)
  }
  async function role(person: Person, next: string) {
    await hub.test.asOwner('update auth.member set role = $1 where user_id = $2', [next, person.id])
  }
  return {
    ...subject,
    ...{ carla, diego, project, company, ask, decide, cancel, publish, asked, published },
    ...{ requests, notices, role },
  }
}

export type Pedidos = Awaited<ReturnType<typeof pedidos>>

export function refusal(answer: { statusCode: number; json(): unknown }) {
  return [answer.statusCode, codeOf(answer)]
}
