import type { FailureRow } from './failure-row.ts'

/** The failures of a Projeto's conversations with the Builder (step 12). */
export const CONVERSATION_FAILURES = {
  CONVERSATION_NOT_FOUND: {
    category: 'USER',
    settles: true,
    status: 404,
    phrase: 'Não encontramos esta conversa.',
    action: 'Volte às conversas do Projeto.',
    actionKind: 'INITIAL',
  },
  MODEL_NO_ACCOUNT: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'Nenhuma conta que você pode usar atende a este modelo.',
    action: 'Escolha outro modelo ou fale com quem administra a empresa.',
    actionKind: 'NONE',
  },
  EFFORT_UNSUPPORTED: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'Este modelo não aceita esse nível de raciocínio.',
    action: 'Escolha outro nível de raciocínio.',
    actionKind: 'NONE',
  },
  MODEL_CALL_FAILED: {
    category: 'THIRD_PARTY',
    settles: true,
    status: 502,
    phrase: 'O modelo não respondeu.',
    action: 'Envie a mensagem de novo.',
    actionKind: 'RETRY',
  },
  RUN_BUSY: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'O Builder está mudando este app agora.',
    action: 'Tente de novo quando ele terminar.',
    actionKind: 'RETRY',
  },
  SAVE_REFUSED: {
    category: 'SYSTEM',
    settles: true,
    status: 500,
    phrase: 'Não consegui guardar esta versão.',
    action: 'A versão anterior continua. Peça de novo ao Builder.',
    actionKind: 'NONE',
  },
  MACHINE_LOST: {
    category: 'THIRD_PARTY',
    settles: true,
    status: 502,
    phrase: 'A máquina caiu no meio do turno.',
    action: 'O que não foi guardado se perdeu. Peça de novo ao Builder.',
    actionKind: 'NONE',
  },
} as const satisfies Record<string, FailureRow>
