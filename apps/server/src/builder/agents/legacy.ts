import { connectorOf } from '@conexus/connectors'
import type { ConnectionId, ToolTarget } from '@conexus/hub-api'
import { OperationId } from '@conexus/hub-api'
import { z } from 'zod'
import { readyConfig, readySlug } from '../tools/public.ts'
import type { PresetFrozenTool } from './frozen.ts'

/** A connection of the Projeto as far as the legacy reading needs it: which system it is. */
type Around = Readonly<{ connectionId: ConnectionId; connector: string }>

/**
 * The reads a version written before decision E4 gave by its connections: the kit's typed reads of
 * each selected connection, the read door's left out (it is the free query, which only a chosen
 * tool gives). Nothing is written: the version is read as these tools, and the next save of a
 * draft writes them as chosen tools.
 */
export function legacyReads(
  around: readonly Around[],
  selected: readonly ConnectionId[],
): (ToolTarget & { summary: string; input: z.ZodObject })[] {
  return selected.flatMap((connectionId) => {
    const connector = connectorOf(
      around.find((each) => each.connectionId === connectionId)?.connector ?? '',
    )
    if (connector === undefined) return []
    return connector.operations.flatMap((operation) =>
      operation.class === 'read' && operation.input instanceof z.ZodObject
        ? [
            {
              connectionId,
              operation: OperationId.parse(operation.id),
              summary: operation.summary,
              input: operation.input,
            },
          ]
        : [],
    )
  })
}

/** Those reads as the tools a version holds, for the run of a version written before E4. */
export function legacyTools(
  around: readonly Around[],
  selected: readonly ConnectionId[],
): PresetFrozenTool[] {
  return legacyReads(around, selected).map((read) => ({
    kind: 'PRESET',
    connectionId: read.connectionId,
    operation: read.operation,
    slug: readySlug(read),
    ...readyConfig(read.input, read.summary),
  }))
}
