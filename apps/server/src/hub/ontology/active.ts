import { ConnectionId, RelationPairs, SourceRead } from '@conexus/hub-api'
import type { ReadTx } from '../../platform/database.ts'
import {
  currentCode,
  currentConcept,
  currentField,
  currentRelation,
  currentSource,
} from './versions/tables.ts'

/**
 * The Ontology as its newest revision left it: every element's newest version, deprecated ones
 * included, each `jsonb` parsed at the database's edge (C27). The row policy keeps it the company's.
 */
export async function activeIn(tx: ReadTx) {
  const [concepts, fields, codes, relations, sources] = await Promise.all([
    tx.select().from(currentConcept),
    tx.select().from(currentField),
    tx.select().from(currentCode),
    tx.select().from(currentRelation),
    tx.select().from(currentSource),
  ])
  return {
    concepts,
    fields,
    codes,
    relations: relations.map((each) => ({
      ...each,
      pairs: RelationPairs.parse(each.pairs),
      throughPairs: each.throughPairs === null ? null : RelationPairs.parse(each.throughPairs),
    })),
    sources: sources.map((each) => ({
      ...each,
      connectionId: ConnectionId.parse(each.connectionId),
      read: SourceRead.parse(each.read),
    })),
  }
}
export type ActiveSet = Awaited<ReturnType<typeof activeIn>>
