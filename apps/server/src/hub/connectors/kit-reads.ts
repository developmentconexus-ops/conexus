import { connectorOf } from '@conexus/connectors'
import type { ConnectionId } from '@conexus/hub-api'
import { ConnectionId as ConnectionIdSchema, OperationId } from '@conexus/hub-api'
import { z } from 'zod'

export type KitRead = Readonly<{
  connectionId: ConnectionId
  operation: OperationId
  summary: string
  open: readonly string[]
}>

/** The kit's typed reads of each row's connector, the read door's left out. */
export function kitReadsOf(rows: readonly { id: string; connector: string }[]): KitRead[] {
  return rows.flatMap((row) =>
    (connectorOf(row.connector)?.operations ?? []).flatMap((operation) =>
      operation.class === 'read' && operation.input instanceof z.ZodObject
        ? [
            {
              connectionId: ConnectionIdSchema.parse(row.id),
              operation: OperationId.parse(operation.id),
              summary: operation.summary,
              open: Object.keys(operation.input.shape),
            },
          ]
        : [],
    ),
  )
}
