import type { ConnectionId, OperationId } from '@conexus/hub-api'
import {
  ConnectionId as ConnectionIdSchema,
  OperationId as OperationIdSchema,
  ToolCallId,
} from '@conexus/hub-api'
import { and, eq } from 'drizzle-orm'
import type { Deps } from './rows.ts'
import { scopeOf } from './rows.ts'
import { connectorWrite } from './tables.ts'
import type { OpenWritesKey } from './write-record.ts'
import { markOf, refusedMessageOf } from './write-record.ts'

/** A write of the conversation as the record keeps it, whatever its end: what the card reads after a reload (never the write's fields, S40). */
export type WrittenRecord = Readonly<{
  toolCallId: ToolCallId
  connectionId: ConnectionId
  operation: OperationId
  state: 'SENDING' | 'DONE' | 'REFUSED' | 'UNCERTAIN'
  since: Date
  mark: string
  approved: boolean
  /** On `REFUSED`, the system's message as it came. */
  message: string | null
}>

/** Every write of the conversation, oldest first, as the record keeps it: the card's outcome after a reload (step 24.5, U5). */
export function writesOf(deps: Deps, key: OpenWritesKey): Promise<readonly WrittenRecord[]> {
  const viewer = { person: { id: key.scope.personId }, companyId: key.scope.companyId }
  return deps.database.read(scopeOf(viewer), async (tx) => {
    const rows = await tx
      .select({
        toolCallId: connectorWrite.toolCallId,
        connectionId: connectorWrite.connectionId,
        operation: connectorWrite.operationId,
        state: connectorWrite.state,
        createdAt: connectorWrite.createdAt,
        approvedBy: connectorWrite.approvedBy,
        answer: connectorWrite.answer,
      })
      .from(connectorWrite)
      .where(
        and(
          eq(connectorWrite.companyId, key.scope.companyId),
          eq(connectorWrite.threadId, key.threadId),
        ),
      )
      .orderBy(connectorWrite.createdAt)
    return rows.map((row) => {
      const toolCallId = ToolCallId.parse(row.toolCallId)
      return {
        toolCallId,
        connectionId: ConnectionIdSchema.parse(row.connectionId),
        operation: OperationIdSchema.parse(row.operation),
        state: row.state,
        since: row.createdAt,
        mark: markOf(key.threadId, toolCallId),
        approved: row.approvedBy !== null,
        message: refusedMessageOf(row),
      }
    })
  })
}
