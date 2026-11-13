import type { FailureRow } from './failure-row.ts'

/** The failures of the company's Ontology. */
export const ONTOLOGY_FAILURES = {
  INVENTORY_RUNNING: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'O inventário desta conexão já está sendo lido.',
    action: 'Espere terminar.',
    actionKind: 'NONE',
  },
} as const satisfies Record<string, FailureRow>
