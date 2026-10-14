import { z } from 'zod'

type FailureRow = {
  category: 'USER' | 'THIRD_PARTY' | 'SYSTEM'
  status: number
  phrase: string
  action: string
}

export const FAILURES = {
  INTERNAL_UNEXPECTED: {
    category: 'SYSTEM',
    status: 500,
    phrase: 'Algo deu errado dentro do Conexus.',
    action: 'O erro foi registrado. Avise quem cuida do Conexus.',
  },
  NOT_FOUND: {
    category: 'USER',
    status: 404,
    phrase: 'Não encontramos o que você procurou.',
    action: 'Confira o endereço.',
  },
  REQUEST_MALFORMED: {
    category: 'USER',
    status: 400,
    phrase: 'O Conexus não entendeu o pedido.',
    action: 'Recarregue a página e tente de novo.',
  },
  CONFIG_INVALID: {
    category: 'SYSTEM',
    status: 500,
    phrase: 'O Conexus não iniciou porque a configuração está errada.',
    action: 'Corrija o valor que o registro aponta e inicie de novo.',
  },
  DATABASE_UNAVAILABLE: {
    category: 'SYSTEM',
    status: 503,
    phrase: 'O banco do Conexus não respondeu.',
    action: 'O erro foi registrado. Avise quem cuida do Conexus.',
  },
  DATABASE_BEHIND: {
    category: 'SYSTEM',
    status: 500,
    phrase: 'O Conexus não iniciou porque falta uma migração no banco.',
    action: 'Rode a migração e inicie de novo.',
  },
  DATABASE_MIGRATION_CHANGED: {
    category: 'SYSTEM',
    status: 500,
    phrase: 'O Conexus não iniciou porque uma migração já aplicada mudou.',
    action: 'Volte o arquivo da migração ao que era e publique de novo.',
  },
} as const satisfies Record<string, FailureRow>

export type FailureCode = keyof typeof FAILURES

export const Problem = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  code: z.string().refine((code): code is FailureCode => Object.hasOwn(FAILURES, code)),
  traceId: z.string(),
})
export type Problem = z.infer<typeof Problem>
