import type { ConceptProposed } from '@conexus/hub-api'
import type {
  InventorySearch,
  InventorySearchInput,
  ProposeInput,
} from '../../hub/ontology/public.ts'

/** The Ontology as the agents' turns reach it: made after the conversations, so each call reaches it when made. */
export type OntologyDoor = {
  search(input: InventorySearchInput): Promise<InventorySearch>
  propose(input: ProposeInput): Promise<ConceptProposed>
}
