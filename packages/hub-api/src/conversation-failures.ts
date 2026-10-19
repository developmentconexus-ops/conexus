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
  MODEL_CALL_FAILED: {
    category: 'THIRD_PARTY',
    settles: true,
    status: 502,
    phrase: 'O modelo não conseguiu responder.',
    action: 'Envie a mensagem de novo.',
    actionKind: 'RETRY',
  },
} as const satisfies Record<string, FailureRow>
