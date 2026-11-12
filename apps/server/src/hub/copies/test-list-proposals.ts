import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import type { ConnectionId, PersonId } from '@conexus/hub-api'
import { listCopies, RunId } from '@conexus/hub-api'
import type { Person } from '../identity/test-hub.ts'
import { call, post } from '../identity/test-hub.ts'
import { ordersCopy, STORE_A, STORE_B, storesOn } from './test-sources.ts'

/**
 * Empresa Teste's two stores of the Mercado Livre double, each released to the Projeto Pedidos, and
 * Propor and Ligar a version 2 proposal through the Hub's own doors (U4).
 */
export async function listProposalsOn(t: TestContext, a: Parameters<typeof storesOn>[1] = {}) {
  const on = await storesOn(t, a)
  function store(ref: string) {
    return on.stores.get(ref) ?? assert.fail(`the store ${ref}`)
  }
  const both = [store(STORE_A.ref), store(STORE_B.ref)]
  for (const connectionId of on.stores.values()) {
    const url = `/api/companies/${on.companyId}/projects/${on.projectId}/connections/${connectionId}`
    const granted = await call(on.hub, on.ana, 'PUT', url)
    assert.equal(granted.statusCode, 200, granted.body)
  }
  const copiesUrl = `/api/companies/${on.companyId}/copies`
  return {
    ...on,
    both,
    store,
    copiesUrl,
    /** Propor as Ana by default, both stores, the orders' copy of what changed, in a run of its own. */
    propose(
      options: {
        connections?: readonly ConnectionId[]
        definition?: unknown
        name?: string
        personId?: PersonId
        runId?: RunId
      } = {},
    ) {
      return on.hub.connectors.builder.propose(
        { companyId: on.companyId, projectId: on.projectId },
        {
          connections: options.connections ?? both,
          personId: options.personId ?? on.anaId,
          runId: options.runId ?? RunId.parse(randomUUID()),
          name: options.name ?? 'ml_pedidos',
          label: 'Pedidos das lojas',
          definition: options.definition ?? ordersCopy(true),
          signal: new AbortController().signal,
        },
      )
    },
    /** Ligar a proposal through the route. */
    enable(person: Person, proposalId: string, key = randomUUID()) {
      return post(on.hub, person, copiesUrl, { from: 'PROPOSAL', proposalId, interval: '1h' }, key)
    },
    /** The list as `person` reads it, with the proposals named by id. */
    async listed(person: Person, named: readonly string[] = []) {
      const query = named.length === 0 ? '' : `?proposalId=${named.join(',')}`
      const read = await call(on.hub, person, 'GET', `${copiesUrl}${query}`)
      assert.equal(read.statusCode, 200, read.body)
      return listCopies.success.body.parse(read.json())
    },
    /** Every proposal row and its sources, as the Hub keeps them. */
    proposalRows: () =>
      on.hub.test.asOwner(
        `select p.id, p.state, p.proved_rows, p.proved_more, p.proved_calls,
           array(select s.connection_id::text from copies.copy_proposal_source s
                 where s.proposal_id = p.id order by s.connection_id) as sources
         from copies.copy_proposal p order by p.proposed_at`,
      ),
  }
}

export type ListProposalsOn = Awaited<ReturnType<typeof listProposalsOn>>
