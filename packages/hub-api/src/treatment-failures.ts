import { z } from 'zod'
import type { FailureRow } from './failure-row.ts'
import { USER_409, USER_422 } from './failure-row.ts'

/** Where a SQL stops parsing, both counted from 1 (`TREATMENT_SQL_INVALID`). */
export const ProblemPosition = z.object({ line: z.int().min(1), column: z.int().min(1) })
export type ProblemPosition = z.infer<typeof ProblemPosition>

export const TREATMENT_FAILURES = {
  TREATMENT_SQL_INVALID: { ...USER_422, phrase: 'O SQL tem um erro de escrita.' },
  TREATMENT_SQL_NOT_A_QUERY: {
    ...USER_422,
    phrase: 'Escreva um só comando, que comece com SELECT ou WITH.',
  },
  TREATMENT_SQL_TEMPLATE: { ...USER_422, phrase: 'Escreva só SQL, sem {{, {% ou {#.' },
  TREATMENT_INPUT_UNQUALIFIED: {
    ...USER_422,
    phrase: 'Escreva cada tabela com a área na frente: current, tratado ou negocio.',
  },
  TREATMENT_INPUT_UNKNOWN: {
    ...USER_422,
    phrase: 'A empresa não tem uma das tabelas que o SQL lê.',
  },
  TREATMENT_INPUT_CYCLE: {
    ...USER_422,
    phrase: 'Este tratamento leria a própria tabela, direto ou por outro tratamento.',
  },
  TREATMENT_NAME_TAKEN: { ...USER_409, phrase: 'Outro tratamento da empresa já tem este nome.' },
  TREATMENT_VERSION_CHANGED: {
    ...USER_409,
    phrase: 'Esta versão já não é a proposta de agora. Veja as versões.',
  },
  LAKE_NOT_READY: {
    ...USER_409,
    phrase:
      'O lago desta empresa ainda não está pronto para os tratamentos. Peça ao operador do Conexus.',
  },
  ALREADY_RUNNING: { ...USER_409, phrase: 'Uma rodada de tratamento já está em curso.' },
  NOTHING_TO_TREAT: { ...USER_409, phrase: 'A empresa ainda não tem tratamento para rodar.' },
} as const satisfies Record<string, FailureRow>
