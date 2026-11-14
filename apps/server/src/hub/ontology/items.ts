import type { ItemContent } from '@conexus/hub-api'
import { ProposedItem } from '@conexus/hub-api'

/** The address an item changes: `pedido`, `pedido.tipo_operacao`, `pedido.tipo_operacao=101`, `@pedido_vendedor`. */
export function targetOf(item: ProposedItem): string {
  switch (item.kind) {
    case 'ADD_CONCEPT':
      return item.concept.key
    case 'ADD_FIELD':
      return `${item.concept}.${item.field.key}`
    case 'SET_CODE':
      return `${item.concept}.${item.field}=${item.value}`
    case 'ADD_RELATION':
      return `@${item.relation.key}`
    case 'SET_SOURCE':
      return item.concept
    case 'RENAME_LABEL':
    case 'DEPRECATE':
      return item.target
    default:
      return item satisfies never
  }
}

/** What `proposal_item.content` holds: the item without its kind. */
export function contentOf(item: ProposedItem): ItemContent {
  const { kind: _, ...content } = item
  return content
}

/** A stored row read back: its kind and content parsed as one item, never trusted as written. */
export function storedItem(row: { kind: string; content: unknown }): ProposedItem {
  return ProposedItem.parse({ ...Object(row.content), kind: row.kind })
}

/** The same change asked twice: the same kind on the same address. */
export function sameChange(
  a: { kind: string; target: string },
  b: { kind: string; target: string },
) {
  return a.kind === b.kind && a.target === b.target
}
