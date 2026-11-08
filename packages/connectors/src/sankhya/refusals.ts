import type { RecordedRefusal } from '../kernel/definition.ts'
import { lancarPedido } from './operations/vendas.ts'

/**
 * What the real gateway answered to a refused add, kept as it came. The envelope is the one measured
 * on the 404 of a list (2026-10-30, `RESOURCE_NOT_FOUND`); the code and the message are the 400 the
 * write record kept for `POST /v1/vendas/pedidos` (its date was not kept with the record); `details` is the cause, with a product (999) that no catalog holds, invented (S40).
 */
export const refusals: readonly RecordedRefusal[] = [
  {
    operation: lancarPedido.id,
    status: 400,
    kind: 'REFUSED',
    body: {
      statusCode: 400,
      error: {
        code: 'BAD_REQUEST',
        message: 'Ocorreu algum erro inesperado!',
        details: 'O produto [999] enviado não existe.',
      },
    },
  },
]
