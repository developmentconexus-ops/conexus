import type { ConnectionId } from '@conexus/hub-api'
import type { KitRead } from '../../hub/connectors/public.ts'
import { readySlug } from '../tools/public.ts'
import type { PresetFrozenTool } from './frozen.ts'

/**
 * The reads a version written before decision E4 gave by its connections: the kit's typed reads of
 * each selected connection, the read door's left out (it is the free query, which only a chosen
 * tool gives). Nothing is written: the version is read as these, and the next save of a draft
 * writes them as chosen tools.
 */
export function legacyReads(kit: readonly KitRead[], selected: readonly ConnectionId[]): KitRead[] {
  return kit.filter((read) => selected.includes(read.connectionId))
}

/** Those reads as the tools a version holds, for the run of a version written before E4. */
export function legacyTools(
  kit: readonly KitRead[],
  selected: readonly ConnectionId[],
): PresetFrozenTool[] {
  return legacyReads(kit, selected).map((read) => ({
    kind: 'PRESET',
    connectionId: read.connectionId,
    operation: read.operation,
    slug: readySlug(read),
    description: read.summary,
    bound: {},
    open: [...read.open],
  }))
}
