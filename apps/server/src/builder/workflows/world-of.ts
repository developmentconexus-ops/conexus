import type { CompanyId, PersonId, WorkflowPlace } from '@conexus/hub-api'
import { ConnectorId, OperationId } from '@conexus/hub-api'
import type { Mastra } from '@mastra/core/mastra'
import type { SessionScope } from '../../hub/connectors/public.ts'
import { mayLeaveAlone, returnsMany } from '../../hub/connectors/public.ts'
import type { IdentityPorts } from '../../hub/identity/public.ts'
import { speakerOf } from '../../hub/identity/public.ts'
import type { ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import { companyAgentsOf } from '../agents/public.ts'
import type { ToolConnectors } from '../tools/public.ts'
import { registryIndexOf } from './index.ts'
import { companyWorkflows } from './store.ts'
import type { OfferedKit, World } from './world.ts'

export type WorldDeps = Readonly<{
  mastra: Mastra
  identity: Pick<
    IdentityPorts,
    'mayUse' | 'mayPublishUnattended' | 'companyMembersOf' | 'admitMember'
  >
  connectors: Pick<ToolConnectors, 'listing' | 'operationOf' | 'writeOf'>
}>

/** What the place's connections give, the reads the role lacks included (the role check names them): each operation of the connector the connection is of, with its input and whether it returns a list. Read before the transaction, since the connectors' door has its own. */
export async function kitsOf(deps: WorldDeps, scope: SessionScope): Promise<OfferedKit[]> {
  const offered = await deps.connectors.listing(scope)
  return Promise.all(
    offered.map(async ({ connectionId, connector, reads, writes }) => {
      async function operation(name: string, kind: 'read' | 'write') {
        const id = OperationId.parse(name)
        const target = { connectionId, operation: id }
        const input =
          kind === 'read'
            ? await deps.connectors.operationOf(scope, target)
            : (await deps.connectors.writeOf(scope, target))?.input
        return { id, many: returnsMany(connector, id), input: input ?? null }
      }
      return {
        connectionId,
        connectorId: ConnectorId.parse(connector),
        reads: await Promise.all(reads.map((each) => operation(each.operation, 'read'))),
        writes: await Promise.all(writes.map((each) => operation(each.operation, 'write'))),
      }
    }),
  )
}

/** The world a workflow's problems read, in the transaction that holds the row: the company's agents, workflows and people, and its roles read now. */
export function worldOf(
  deps: WorldDeps,
  tx: ReadTx,
  a: { companyId: CompanyId; place: WorkflowPlace; kits: readonly OfferedKit[] },
): World {
  const { companyId } = a
  return {
    place: a.place,
    offered: async () => a.kits,
    agents: () => companyAgentsOf(tx, companyId),
    workflows: () => companyWorkflows(tx, companyId),
    people: async () =>
      new Set((await deps.identity.companyMembersOf(tx, companyId)).map((each) => each.personId)),
    speakerOf: (personId: PersonId) => speakerOf(tx, companyId, personId),
    mayUse: (speaker, target) => deps.identity.mayUse(companyId, speaker, target),
    mayLeaveAlone: async (personId, write) => {
      try {
        await mayLeaveAlone(deps.identity, tx, { companyId, personId, write })
        return true
      } catch (error) {
        if (error instanceof Failure && error.code === 'NOT_IN_ROLE') return false
        throw error
      }
    },
    registryOf: (bundle) => registryIndexOf(deps.mastra, bundle),
  }
}
