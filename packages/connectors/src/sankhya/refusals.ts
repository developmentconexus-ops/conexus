import type { RecordedRefusal } from '../kernel/definition.ts'
import { lancarPedido } from './operations/vendas.ts'

/**
 * What the real gateway answered to a refused add, kept as it came. The envelope is the one measured
 * on the 404 of a list (2026-10-30, `RESOURCE_NOT_FOUND`); the code and the message are the 400 the
 * write record kept for `POST /v1/vendas/pedidos` (its date was not kept with the record); `details` is the cause, with a product (999) that no catalog holds, invented (S40).
 */
export const UNKNOWN_PRODUCT: RecordedRefusal = {
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
}

/** The add without `data` and `hora`, as the real gateway refused it (recorded 2026-11-09, 10:50Z): no company data in it. */
export const MISSING_DATE_AND_HOUR: RecordedRefusal = {
  operation: lancarPedido.id,
  status: 400,
  kind: 'REFUSED',
  body: {
    statusCode: 400,
    error: {
      code: 'BAD_REQUEST',
      message: 'Ocorreu algum erro inesperado!',
      details:
        'Campos não informados no : [data, hora] - Consulte o server.log para maiores informações!',
    },
  },
}

export const refusals: readonly RecordedRefusal[] = [UNKNOWN_PRODUCT, MISSING_DATE_AND_HOUR]

/**
 * Not a refusal: the DbExplorer's whole answer to a query whose cells the query itself invented
 * (decision 0063, recorded 2026-11-10 on a real Sankhya on Oracle; the transaction id is invented):
 * a DATE as `DDMMYYYY HH24:MI:SS`, a decimal as a JSON number. The paged read is checked on it.
 */
export const INVENTED_CELLS = {
  status: 200,
  body: {
    serviceName: 'DbExplorerSP.executeQuery',
    status: '1',
    pendingPrinting: 'false',
    transactionId: '00000000000000000000000000000000',
    responseBody: {
      fieldsMetadata: [
        { name: 'D', description: 'D', order: 1, userType: 'H' },
        { name: 'V', description: 'V', order: 2, userType: 'F', precision: 2 },
      ],
      rows: [['02012026 03:04:05', 1234.5]],
      burstLimit: false,
      timeQuery: '4ms',
      timeResultSet: '1ms',
    },
  },
} as const
