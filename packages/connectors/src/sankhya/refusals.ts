import type { RecordedRefusal } from '../kernel/definition.ts'
import { lancarPedido } from './operations/vendas.ts'

/** The envelope and the 400 the real gateway sent for a refused add. */
function badRequest(details: string): RecordedRefusal {
  return {
    operation: lancarPedido.id,
    status: 400,
    kind: 'REFUSED',
    body: {
      statusCode: 400,
      error: { code: 'BAD_REQUEST', message: 'Ocorreu algum erro inesperado!', details },
    },
  }
}

/**
 * An add with a product no catalog holds. The envelope is the one measured on a list's 404
 * (2026-10-30), the code and message the 400 the write record kept for `POST /v1/vendas/pedidos`
 * (its date was not kept); the product (999) in `details` is invented (S40).
 */
export const UNKNOWN_PRODUCT = badRequest('O produto [999] enviado não existe.')

/** The add without `data` and `hora`, as the real gateway refused it (recorded 2026-11-09, 10:50Z); no company data in it. */
export const MISSING_DATE_AND_HOUR = badRequest(
  'Campos não informados no : [data, hora] - Consulte o server.log para maiores informações!',
)

export const refusals: readonly RecordedRefusal[] = [UNKNOWN_PRODUCT, MISSING_DATE_AND_HOUR]
