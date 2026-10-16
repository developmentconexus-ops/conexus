import { z } from 'zod'
import { CAPACITY } from './capacity.ts'

type FailureRow = {
  category: 'USER' | 'THIRD_PARTY' | 'SYSTEM'
  /** A whole answer with this code tells the client a write's outcome; it may drop its key. */
  settles: boolean
  status: number
  phrase: string
  action: string
  actionKind: 'RETRY' | 'SIGN_IN' | 'NONE'
}

export const FAILURES = {
  INTERNAL_UNEXPECTED: {
    category: 'SYSTEM',
    settles: false,
    status: 500,
    phrase: 'Algo deu errado dentro do Conexus.',
    action: 'O erro foi registrado. Avise quem cuida do Conexus.',
    actionKind: 'NONE',
  },
  NOT_FOUND: {
    category: 'USER',
    settles: true,
    status: 404,
    phrase: 'Não encontramos o que você procurou.',
    action: 'Confira o endereço.',
    actionKind: 'NONE',
  },
  REQUEST_ORIGIN_REFUSED: {
    category: 'USER',
    settles: true,
    status: 403,
    phrase: 'O Conexus recusou um pedido que não veio das suas páginas.',
    action: 'Abra o Conexus pelo endereço dele.',
    actionKind: 'NONE',
  },
  REQUEST_MEDIA_TYPE_REFUSED: {
    category: 'USER',
    settles: true,
    status: 415,
    phrase: 'O Conexus não aceita pedidos nesse formato.',
    action: 'Abra o Conexus pelo endereço dele.',
    actionKind: 'NONE',
  },
  REQUEST_TOO_LARGE: {
    category: 'USER',
    settles: true,
    status: 413,
    phrase: 'O pedido passou do tamanho que o Conexus aceita.',
    action: 'Envie menos de uma vez.',
    actionKind: 'NONE',
  },
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
    action: 'Peça um link novo a quem cuida do Conexus.',
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
  REQUEST_MALFORMED: {
    category: 'USER',
    settles: true,
    status: 400,
    phrase: 'O Conexus não entendeu o pedido.',
    action: 'Recarregue a página e tente de novo.',
    actionKind: 'RETRY',
  },
  CONFIG_INVALID: {
    category: 'SYSTEM',
    settles: false,
    status: 500,
    phrase: 'O Conexus não iniciou porque a configuração está errada.',
    action: 'Corrija o valor que o registro aponta e inicie de novo.',
    actionKind: 'NONE',
  },
  DATABASE_UNAVAILABLE: {
    category: 'SYSTEM',
    settles: false,
    status: 503,
    phrase: 'O banco do Conexus não respondeu.',
    action: 'O erro foi registrado. Avise quem cuida do Conexus.',
    actionKind: 'NONE',
  },
  DATABASE_BEHIND: {
    category: 'SYSTEM',
    settles: false,
    status: 500,
    phrase: 'O Conexus não iniciou porque falta uma migração no banco.',
    action: 'Rode a migração e inicie de novo.',
    actionKind: 'NONE',
  },
  DATABASE_MIGRATION_CHANGED: {
    category: 'SYSTEM',
    settles: false,
    status: 500,
    phrase: 'O Conexus não iniciou porque uma migração já aplicada mudou.',
    action: 'Volte o arquivo da migração ao que era e publique de novo.',
    actionKind: 'NONE',
  },
  MAIL_UNAVAILABLE: {
    category: 'THIRD_PARTY',
    settles: true,
    status: 502,
    phrase: 'O e-mail não pôde ser enviado agora.',
    action: 'Tente de novo daqui a pouco.',
    actionKind: 'NONE',
  },
  MAIL_BOUNCED: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'Esse endereço não recebe e-mails.',
    action: 'Confira o e-mail e convide de novo.',
    actionKind: 'NONE',
  },
  IDEMPOTENCY_CONFLICT: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Este pedido já foi feito com outros dados.',
    action: 'Recarregue a página.',
    actionKind: 'NONE',
  },
  // The card gives these two a phrase and no action: the screen shows them on the field.
  MEMBER_EXISTS: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: 'Essa pessoa já está na empresa.',
    action: '',
    actionKind: 'NONE',
  },
  INVITATION_ROLE_REFUSED: {
    category: 'USER',
    settles: true,
    status: 403,
    phrase: 'Você não pode convidar com esse papel.',
    action: '',
    actionKind: 'NONE',
  },
  INVITATIONS_EXCEEDED: {
    category: 'USER',
    settles: true,
    status: 429,
    phrase: 'Muitos convites seguidos.',
    action: 'Espere um pouco e tente de novo.',
    actionKind: 'NONE',
  },
  INVITATION_CLOSED: {
    category: 'USER',
    settles: true,
    status: 422,
    phrase: 'Este convite não vale mais.',
    action: 'Peça um novo a quem convidou você.',
    actionKind: 'NONE',
  },
  INVITATIONS_FULL: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: `A empresa já tem ${CAPACITY.openInvitations} convites pendentes.`,
    action: 'Espere aceitarem.',
    actionKind: 'NONE',
  },
  COMPANY_FULL: {
    category: 'USER',
    settles: true,
    status: 409,
    phrase: `A empresa já tem ${CAPACITY.members} pessoas.`,
    action: 'Fale com quem convidou você.',
    actionKind: 'NONE',
  },
} as const satisfies Record<string, FailureRow>

export type FailureCode = keyof typeof FAILURES

/** The media type every failure leaves in, a `Problem` body (code C50). */
export const PROBLEM_MEDIA_TYPE = 'application/problem+json'

export const Problem = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  code: z.string().refine((code): code is FailureCode => Object.hasOwn(FAILURES, code)),
  traceId: z.string(),
})
export type Problem = z.infer<typeof Problem>
