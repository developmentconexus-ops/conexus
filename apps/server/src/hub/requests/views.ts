import type { CompanyId, PersonId, ProjectId, Role } from '@conexus/hub-api'
import { PublishRequest } from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import type { ReadTx } from '../../platform/database.ts'
import type { IdentityPorts } from '../identity/public.ts'
import { memberNameColumn, personNameColumn } from '../identity/public.ts'
import { projectNameColumn } from '../projects/public.ts'
import { request } from './tables.ts'

type Readers = { identity: Pick<IdentityPorts, 'allows'> }

/**
 * What the bell reads of the request a notice names (`hub/notifications` joins it by id): one who
 * decided and has left the company is no longer named (criterion 19).
 */
export const NOTICE_VIEW = {
  projectId: request.projectId,
  projectName: projectNameColumn(request.projectId),
  number: request.number,
  state: request.state,
  reason: request.reason,
  requestedByName: personNameColumn(request.requestedBy),
  decidedByName: memberNameColumn(request.companyId, request.decidedBy),
}

export const VIEW = {
  id: request.id,
  number: request.number,
  message: request.message,
  requestedBy: request.requestedBy,
  requestedByName: personNameColumn(request.requestedBy),
  createdAt: request.createdAt,
}

export type Row = {
  id: string
  number: number
  message: string
  requestedBy: string
  requestedByName: string | null
  createdAt: Date
}

export function viewOf(
  deps: Readers,
  row: Row,
  reader: { personId: PersonId; role: Role },
): PublishRequest {
  const own = row.requestedBy === reader.personId
  return PublishRequest.parse({
    id: row.id,
    number: row.number,
    message: row.message,
    requestedBy: { name: row.requestedByName },
    createdAt: row.createdAt.toISOString(),
    mayDecide: !own && deps.identity.allows(reader.role, 'decideRequest'),
    mayCancel: own,
  })
}

export async function publishRequestOf(
  deps: Readers,
  tx: ReadTx,
  input: { companyId: CompanyId; projectId: ProjectId; personId: PersonId; role: Role },
): Promise<PublishRequest | null> {
  const [row] = await tx
    .select(VIEW)
    .from(request)
    .where(
      and(
        eq(request.companyId, input.companyId),
        eq(request.projectId, input.projectId),
        eq(request.state, 'PENDING'),
      ),
    )
  return row === undefined ? null : viewOf(deps, row, input)
}
