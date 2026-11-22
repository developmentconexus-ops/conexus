import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { CompanyId } from '@conexus/hub-api'
import { LakeId, StackId } from '../../platform/aws.ts'
import type { Hub, Person } from '../identity/test-hub.ts'
import { ANA, call, hubWithLog, personOn, plantCompany, post } from '../identity/test-hub.ts'

export const DAVI = { name: 'Davi Costa', email: 'davi@example.test' }
const BEATRIZ = { name: 'Beatriz Lopes', email: 'beatriz@example.test' }
let serial = 0

/** A stack's id as CloudFormation writes it, for the state table. */
export const TEST_STACK = StackId.parse(
  'arn:aws:cloudformation:us-east-2:111122223333:stack/conexus-lago-k3x9a0b1c2d3/x',
)

export type LakeHub = Awaited<ReturnType<typeof hubWithLog>>

/** A client of the Central, owned by `owner`, and the address of its lake. */
export async function clientOn(hub: Hub, owner: Person, name: string) {
  const companyId = CompanyId.parse(await plantCompany(hub.test, owner.id, name))
  serial += 1
  await hub.test.asOwner(
    `insert into operations.client (company_id, cnpj, legal_name, attempt_key, registered_at)
     values ($1, $2, $3, $1, now())`,
    [companyId, String(serial).padStart(14, '0'), `${name} Ltda`],
  )
  return { companyId, name, url: `/api/clients/${companyId}/lake` }
}

/** Ana operates the Central; Davi owns "Empresa Teste A" and Beatriz "Empresa Teste B". */
export async function lakeWorld(t: TestContext) {
  const hub = await hubWithLog(t)
  const ana = await personOn(hub, ANA)
  const davi = await personOn(hub, DAVI)
  const a = await clientOn(hub, davi, 'Empresa Teste A')
  const b = await clientOn(hub, await personOn(hub, BEATRIZ), 'Empresa Teste B')
  return { hub, ana, davi, a, b }
}

type Client = Awaited<ReturnType<typeof clientOn>>

export function createLake(hub: Hub, person: Person, client: Client) {
  return post(hub, person, client.url, {})
}

export function readLake(hub: Hub, person: Person, client: Client) {
  return call(hub, person, 'GET', client.url)
}

export function deleteLake(hub: Hub, person: Person, client: Client, name = client.name) {
  return call(hub, person, 'DELETE', client.url, { name })
}

/** The lake the answer carries. */
export function lakeIn(response: { statusCode: number; json(): unknown }) {
  return Object(response.json()).lake
}

/** The company's row as the database holds it, or nothing. */
export async function rowOf(hub: Hub, client: Client) {
  const [row] = await hub.test.asOwner(
    'select lake_id, state, stack_id, failure from lake.company_lake where company_id = $1',
    [client.companyId],
  )
  return row
}

/** The company's latest stack in the AWS of memory. */
export function stackOf(hub: LakeHub, client: Client): StackId {
  const stack = hub.aws.stacks().findLast((one) => one.company === client.companyId)
  assert.ok(stack !== undefined, 'no stack')
  return StackId.parse(stack.id)
}

/** The bucket the company's failed creation left behind (decision E). */
export async function plantLeftover(hub: LakeHub, client: Client) {
  hub.aws.plantLeftover(LakeId.parse((await rowOf(hub, client))?.lake_id), client.companyId)
}

/** A lake that CloudFormation finished making, read once so the row is ready. */
export async function readyLake(hub: LakeHub, ana: Person, client: Client) {
  assert.equal((await createLake(hub, ana, client)).statusCode, 202)
  hub.aws.finish(stackOf(hub, client), 'CREATE_COMPLETE')
  const read = await readLake(hub, ana, client)
  assert.equal(lakeIn(read).state, 'READY')
  return lakeIn(read)
}

/** The lines the lake left in the Hub's log, by message. */
export function lakeLines(hub: LakeHub, message: string) {
  return hub.lines.filter((line) => line.message === message).map((line) => line.fields)
}
