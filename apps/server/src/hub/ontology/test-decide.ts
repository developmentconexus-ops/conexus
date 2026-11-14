import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import type { Hub, Person } from '../identity/test-hub.ts'
import {
  ANA_OWNER,
  BRUNO,
  CARLA,
  call,
  hubOn,
  memberOn,
  personOn,
  plantCompany,
  post,
} from '../identity/test-hub.ts'

/** A stored item: its kind, address and content, as `concept_propose` writes one. */
export type Seeded = Readonly<{ kind: string; target: string; content: object }>

type Field = Readonly<{ key: string; column: string; type?: string }>

/** A concept's items, kept as U3 keeps them: the concept, its fields and its proved source. */
export function conceptItems(
  key: string,
  fields: readonly Field[],
  shape: { keyFields: string[]; titleField: string; base?: string },
): Seeded[] {
  const concept = {
    ...{ key, name: key, plural: `${key}s`, description: '', synonyms: [], state: 'ACTIVE' },
    ...shape,
  }
  return [
    { kind: 'ADD_CONCEPT', target: key, content: { concept } },
    ...fields.map((field) => ({
      kind: 'ADD_FIELD',
      target: `${key}.${field.key}`,
      content: {
        concept: key,
        field: {
          key: field.key,
          name: field.key,
          description: '',
          type: field.type ?? 'TEXT',
          column: field.column,
        },
      },
    })),
    {
      kind: 'SET_SOURCE',
      target: key,
      content: { concept: key, sql: `SELECT * FROM ${key.toUpperCase()}` },
    },
  ]
}

export const VENDEDOR = conceptItems(
  'vendedor',
  [
    { key: 'codigo', column: 'CODVEND', type: 'ID' },
    { key: 'nome', column: 'APELIDO' },
  ],
  { keyFields: ['codigo'], titleField: 'nome' },
)

export function rename(target: string, name: string): Seeded {
  return { kind: 'RENAME_LABEL', target, content: { target, name } }
}

/** A company with its owner Ana, an administrator, a developer and a member, each signed in. */
export async function companyOfFour(t: TestContext) {
  const hub = await hubOn(t)
  const owner = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, owner.id)
  const admin = await memberOn(hub, companyId, BRUNO, 'admin')
  const developer = await memberOn(hub, companyId, CARLA, 'developer')
  const member = await memberOn(
    hub,
    companyId,
    { name: 'Davi Souza', email: 'davi@example.test' },
    'member',
  )
  const base = `/api/companies/${companyId}/ontology`
  const connectionId = randomUUID()
  await hub.test.asOwner(
    `insert into connectors.connection(id, company_id, connector_id, name, connector_version, state,
      sealed, key_id, linked_by, linked_at, attempt_key)
      values ($1, $2, 'sankhya', 'Sankhya Matriz', '1.0.0', 'ACTIVE', '\\x01', 'k1', $3, now(), 'plant')`,
    [connectionId, companyId, owner.id],
  )

  /** A proposal of `by`, with its items pending; a source's proof written as U3 writes one. */
  async function proposed(by: Person, items: readonly Seeded[]): Promise<string> {
    const proposalId = randomUUID()
    await hub.test.asOwner(
      `insert into ontology.proposal (id, company_id, demand, proposed_by, base_revision, created_at, state)
        values ($1, $2, 'os vendedores', $3, 0, clock_timestamp(), 'OPEN')`,
      [proposalId, companyId, by.id],
    )
    for (const [at, item] of items.entries()) {
      const proof = item.kind === 'SET_SOURCE' ? randomUUID() : null
      if (proof !== null)
        await hub.test.asOwner(
          `insert into ontology.proof_run (id, company_id, connection_id, query, query_hash, ran_at, outcome, rows, shape)
            values ($1, $2, $3, 'SELECT 1', repeat('a', 64), now(), 'OK', 3, '[]')`,
          [proof, companyId, connectionId],
        )
      await hub.test.asOwner(
        `insert into ontology.proposal_item (proposal_id, company_id, n, kind, target, content, proof_run_id, decision)
          values ($1, $2, $3, $4, $5, $6, $7, 'PENDING')`,
        [
          proposalId,
          companyId,
          at + 1,
          item.kind,
          item.target,
          JSON.stringify(item.content),
          proof,
        ],
      )
    }
    return proposalId
  }

  function decide(who: Person, proposalId: string, body: object) {
    return post(hub, who, `${base}/proposals/${proposalId}/decisions`, body)
  }

  /** Every item of a proposal approved against the revision given. */
  function approveAll(who: Person, proposalId: string, count: number, expectedRevision: number) {
    const approved = Array.from({ length: count }, (_, at) => at + 1)
    return decide(who, proposalId, { approved, refused: [], expectedRevision })
  }

  function read(who: Person, path = '') {
    return call(hub, who, 'GET', `${base}${path}`)
  }

  return {
    ...{ hub, companyId, owner, admin, developer, member },
    ...{ proposed, decide },
    approveAll,
    read,
  }
}
export type Four = Awaited<ReturnType<typeof companyOfFour>>

/** What the database holds: the revisions and every item's decision. */
export async function stored(hub: Hub) {
  const revisions = await hub.test.asOwner(
    'select number, proposed_by, approved_by from ontology.revision order by number',
  )
  const items = await hub.test.asOwner(
    'select decision from ontology.proposal_item order by proposal_id, n',
  )
  return { revisions, decisions: items.map((row) => Object(row).decision) }
}
