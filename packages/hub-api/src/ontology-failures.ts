import { z } from 'zod'
import type { FailureRow } from './failure-row.ts'

/**
 * What an approval would leave missing, for `DECISION_INCOMPLETE`: the element at `target` needs the
 * one at `address` (its source, a field, its concept, its base, the replacement a deprecation names,
 * or, for a base, the active role that still leans on it). `n` is the approved item to mark.
 */
export const DecisionGap = z.object({
  n: z.int().positive().nullable(),
  target: z.string(),
  needs: z.enum(['SOURCE', 'FIELD', 'CONCEPT', 'BASE', 'REPLACEMENT', 'ACTIVE_ROLE']),
  address: z.string(),
})
export type DecisionGap = z.infer<typeof DecisionGap>
export const ProblemGaps = z.array(DecisionGap)
/** The Problem's member `DECISION_INCOMPLETE` writes: what the approval would leave missing. */
export const ONTOLOGY_PROBLEM = { gaps: ProblemGaps.optional() }

function user(status: 403 | 404 | 409 | 412 | 422, phrase: string, action: string) {
  return { category: 'USER', settles: true, status, phrase, action, actionKind: 'NONE' } as const
}

/** The failures of the company's Ontology. */
export const ONTOLOGY_FAILURES = {
  INVENTORY_RUNNING: user(
    409,
    'O inventário desta conexão já está sendo lido.',
    'Espere terminar.',
  ),
  FIRST_REVISION_OWNER: user(
    403,
    'Só o dono aprova a primeira revisão dos conceitos.',
    'Peça ao dono.',
  ),
  REVISION_STALE: {
    ...user(412, 'Os conceitos mudaram enquanto você revisava.', 'Veja de novo.'),
    actionKind: 'RETRY',
  },
  DECISION_INCOMPLETE: user(
    422,
    'Falta aprovar o que estes itens precisam.',
    'Aprove ou recuse os itens marcados.',
  ),
  ITEM_DECIDED: user(409, 'Este item já foi decidido.', 'Veja de novo.'),
  CODE_UNSEEN: user(422, 'Este código não aparece no sistema.', 'Confira o valor.'),
  TARGET_UNKNOWN: user(404, 'Isto não existe mais nos conceitos.', 'Veja de novo.'),
  PROOF_FAILED: {
    category: 'THIRD_PARTY',
    settles: true,
    status: 502,
    phrase: 'Não foi possível provar no sistema.',
    action: 'Tente de novo.',
    actionKind: 'NONE',
  },
  CONCEPT_UNKNOWN: user(404, 'Este conceito não existe para você.', 'Leia o catálogo.'),
} as const satisfies Record<string, FailureRow>
