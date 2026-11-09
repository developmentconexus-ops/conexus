import type {
  CompanyId,
  ConnectionId,
  ConnectorId,
  ConversationId,
  OperationId,
  PersonId,
} from '@conexus/hub-api'
import type { Database, ReadTx } from '../../platform/database.ts'
import { Failure } from '../../platform/failure.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { speakerOf } from '../identity/public.ts'
import { operationLabel } from './role-kit.ts'
import type { SessionScope } from './scope.ts'
import type { OpenWrite, OpenWritesKey } from './write-record.ts'

/** The operation the rule checks: the connection, the kit's connector and the operation (identity's Target). */
export type WriteTarget = Readonly<{
  connectionId: ConnectionId
  connectorId: ConnectorId
  operationId: OperationId
}>

export type ApprovalDeps = Readonly<{
  database: Database
  identity: Pick<IdentityPorts, 'mayUse' | 'mayPublishUnattended'>
  openWrites: (key: OpenWritesKey) => Promise<readonly OpenWrite[]>
}>

/** Who writes: the draft (the person talking to it) or a published version, with who answers for it. */
export type WriteAuthorOf =
  | Readonly<{ kind: 'DRAFT' }>
  | Readonly<{ kind: 'PUBLISHED'; answeredBy: PersonId | null }>

type Ask =
  | Readonly<{ kind: 'DO' }>
  | Readonly<{ kind: 'ASK'; reason: 'CHOSEN' | 'PUBLISHER_LOST_RIGHT' | 'OPEN_WRITE' }>

type Holding = Pick<ApprovalDeps, 'database' | 'identity'>

/** The person as the role they hold in the company now; none once they left. */
function speakerNow(deps: Holding, companyId: CompanyId, personId: PersonId) {
  return deps.database.read({ kind: 'COMPANY', companyId, personId: null }, (tx) =>
    speakerOf(tx, companyId, personId),
  )
}

/** Whether the person answering a card holds its write in their own role, read now (step 24.5, D3-a). */
export async function mayApprove(
  deps: Holding,
  a: Readonly<{ companyId: CompanyId; personId: PersonId; target: WriteTarget }>,
): Promise<boolean> {
  const speaker = await speakerNow(deps, a.companyId, a.personId)
  return speaker !== undefined && deps.identity.mayUse(a.companyId, speaker, a.target)
}

/**
 * Whether a version's write in Faz sozinho still runs without asking (step 24.5, D2-a): who
 * answers for the version is still in the company, and their role, read now, holds both the action
 * and the write. Otherwise it asks; what the version declares does not change.
 */
async function publisherLeavesAlone(
  deps: Holding,
  companyId: CompanyId,
  answeredBy: PersonId | null,
  target: WriteTarget,
): Promise<boolean> {
  // A person who left takes their authorship with them (`release.ts`), so no one leaves it alone.
  if (answeredBy === null) return false
  const speaker = await speakerNow(deps, companyId, answeredBy)
  if (speaker === undefined) return false
  if (!(await deps.identity.mayPublishUnattended(companyId, speaker.role))) return false
  return deps.identity.mayUse(companyId, speaker, target)
}

/**
 * Whether who saves, publishes or restores may leave a write to run without asking (step 24.5,
 * D1-a): the role read now, else `NOT_IN_ROLE` naming the write, and nothing is written.
 */
export async function mayLeaveAlone(
  identity: Pick<IdentityPorts, 'mayPublishUnattended'>,
  tx: ReadTx,
  a: Readonly<{ companyId: CompanyId; personId: PersonId; write: WriteTarget & { slug: string } }>,
): Promise<void> {
  const speaker = await speakerOf(tx, a.companyId, a.personId)
  if (speaker !== undefined && (await identity.mayPublishUnattended(a.companyId, speaker.role))) {
    return
  }
  const { write } = a
  throw new Failure('NOT_IN_ROLE', {
    details: { tool: write.slug, operation: write.operationId, reason: 'UNATTENDED_WRITE' },
    named: { field: 'tools', operation: operationLabel(write.connectorId, write.operationId) },
  })
}

/**
 * Whether a write asks the person first (step 24.5): when it is kept in Pergunta antes, when who
 * answers for a published version no longer leaves it alone, or when the conversation holds an
 * earlier send of the same write whose end is not known. The draft runs as the person talking to it.
 */
export async function mustAsk(
  deps: ApprovalDeps,
  a: Readonly<{
    companyId: CompanyId
    choice: 'ASK' | 'AUTO'
    author: WriteAuthorOf
    scope: SessionScope
    threadId: ConversationId
    target: WriteTarget
  }>,
): Promise<Ask> {
  if (a.choice === 'ASK') return { kind: 'ASK', reason: 'CHOSEN' }
  if (
    a.author.kind === 'PUBLISHED' &&
    !(await publisherLeavesAlone(deps, a.companyId, a.author.answeredBy, a.target))
  ) {
    return { kind: 'ASK', reason: 'PUBLISHER_LOST_RIGHT' }
  }
  const open = await deps.openWrites({
    scope: a.scope,
    threadId: a.threadId,
    connectionId: a.target.connectionId,
    operation: a.target.operationId,
  })
  return open.length > 0 ? { kind: 'ASK', reason: 'OPEN_WRITE' } : { kind: 'DO' }
}
