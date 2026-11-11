import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { CopyProposalId, PersonId } from '@conexus/hub-api'
import {
  CopyProposalId as CopyProposalIdSchema,
  listCopies,
  PersonId as PersonIdSchema,
  RunId,
} from '@conexus/hub-api'
import { sql } from 'drizzle-orm'
import type { Person } from '../identity/test-hub.ts'
import { call, post } from '../identity/test-hub.ts'
import type { CopiesOn } from './test-copies.ts'
import { copiesUrl } from './test-routes.ts'

/** The Matriz released to the Projeto Pedidos, as Ana: the Builder's turn there may read it. */
export async function grantMatriz(on: CopiesOn) {
  const url = `/api/companies/${on.companyId}/projects/${on.projectId}/connections/${on.connectionId}`
  const granted = await call(on.hub, on.ana, 'PUT', url)
  assert.equal(granted.statusCode, 200, granted.body)
}

/** A template's definition, the shape the Builder writes, to propose under another name. */
export function definitionOf(on: CopiesOn, model = 'vendas') {
  const found = on.hub.connectors.copies.catalog().find((each) => each.model.id === model)
  assert.ok(found, model)
  return structuredClone(found.model.definition)
}

/** Propor through the Hub's door to the Builder, as Ana by default, in a run of its own. */
export function proposeAs(
  on: CopiesOn,
  options: {
    personId?: PersonId
    runId?: RunId
    name?: string
    definition?: unknown
  } = {},
) {
  return on.hub.connectors.builder.propose(
    { companyId: on.companyId, projectId: on.projectId },
    {
      connectionId: on.connectionId,
      personId: options.personId ?? PersonIdSchema.parse(on.ana.id),
      runId: options.runId ?? RunId.parse(randomUUID()),
      name: options.name ?? 'devolucoes',
      label: 'Devoluções',
      definition: options.definition ?? definitionOf(on),
      signal: new AbortController().signal,
    },
  )
}

/** A proposal Ana made, by its id. */
export async function proposed(on: CopiesOn, name = 'devolucoes') {
  const answer = await proposeAs(on, { name })
  assert.equal(answer.kind, 'PROPOSED', JSON.stringify(answer))
  return CopyProposalIdSchema.parse(Object(answer).proposalId)
}

/** Every proposal row of the company, as the Hub keeps it. */
export async function proposalRows(on: CopiesOn) {
  const result = await on.hub.test.database.read(
    { kind: 'COMPANY', companyId: on.companyId, personId: null },
    (tx) =>
      tx.execute(
        sql`select id, name, state, proved_rows, proved_more, copy_id, definition, project_id from copies.copy_proposal order by proposed_at`,
      ),
  )
  return result.rows.map((row) => Object(row))
}

/** Ligar a proposal through the route, with a fresh attempt key unless one is given. */
export function enableProposal(
  on: CopiesOn,
  person: Person,
  proposalId: string,
  key = randomUUID(),
) {
  return post(on.hub, person, copiesUrl(on), { from: 'PROPOSAL', proposalId, interval: '1h' }, key)
}

/** Dispensar through the route. */
export function dismiss(on: CopiesOn, person: Person, proposalId: CopyProposalId) {
  const url = `/api/companies/${on.companyId}/copy-proposals/${proposalId}/dismiss`
  return post(on.hub, person, url, {})
}

/** The list as `person` reads it, with the proposals named by id. */
export async function listedBy(on: CopiesOn, person: Person, named?: readonly string[]) {
  const query = named === undefined ? '' : `?proposalId=${named.join(',')}`
  const read = await call(on.hub, person, 'GET', `${copiesUrl(on)}${query}`)
  assert.equal(read.statusCode, 200, read.body)
  return listCopies.success.body.parse(read.json())
}
