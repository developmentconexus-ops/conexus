import type { FailureRow } from './failure-row.ts'

/** What goes wrong signing in, ending a session, handling a password link and answering an invitation's password. */
export const IDENTITY_FAILURES = {
  SIGN_IN_REFUSED: {
    category: 'USER',
    settles: true,
    status: 401,
    phrase: 'E-mail ou senha não conferem.',
    action: 'Confira o e-mail e a senha.',
    actionKind: 'NONE',
  },
  SIGN_IN_ATTEMPTS_EXCEEDED: {
    category: 'USER',
    settles: true,
    status: 429,
    phrase: 'Muitas tentativas de entrada deste endereço.',
    action: 'Espere um minuto e tente de novo.',
    actionKind: 'NONE',
  },
  SESSION_REQUIRED: {
    category: 'USER',
    settles: true,
    status: 401,
    phrase: 'Sua sessão terminou.',
    action: 'Entre de novo para continuar.',
    actionKind: 'SIGN_IN',
  },
  INVITATION_STALE: {
    category: 'USER',
    settles: true,
    status: 412,
    phrase: 'Este convite mudou.',
    action: 'Recarregue a página.',
    actionKind: 'NONE',
  },
  INVITATION_PASSWORD_EXISTS: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Este e-mail já tem senha.',
    action: 'Entre com a sua senha.',
    actionKind: 'SIGN_IN',
  },
  PASSWORD_LINK_INVALID: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'Este link já foi usado ou venceu.',
    action: 'Peça um link novo.',
    actionKind: 'NONE',
  },
  RECOVERY_ATTEMPTS_EXCEEDED: {
    category: 'USER',
    settles: true,
    status: 429,
    phrase: 'Muitos pedidos deste computador ou rede.',
    action: 'Espere um minuto e tente de novo.',
    actionKind: 'NONE',
  },
  FIRST_PERSON_EXISTS: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Já existe uma pessoa nesta instalação.',
    action: 'Entre com a pessoa que já existe.',
    actionKind: 'NONE',
  },
} as const satisfies Record<string, FailureRow>
