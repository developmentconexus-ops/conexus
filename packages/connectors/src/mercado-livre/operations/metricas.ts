import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { defineRoute, sellerOf } from './route.ts'

const DAYS = 150

const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const visitas = defineRoute({
  id: 'visitas',
  subject: 'metricas',
  docs: 'recurso-visits',
  summary: `Soma as visitas aos anúncios do vendedor numa janela de datas, de no máximo ${DAYS} dias.`,
  label: 'Visitas',
  input: z.object({ dateFrom: Day, dateTo: Day }).refine(({ dateFrom, dateTo }) => {
    const days = (Date.parse(dateTo) - Date.parse(dateFrom)) / 86_400_000
    return days >= 0 && days <= DAYS
  }, `A janela vai de 0 a ${DAYS} dias`),
  rowsAt: null,
  probe: () => {
    const to = new Date()
    const from = new Date(to.getTime() - 30 * 86_400_000)
    return {
      dateFrom: from.toISOString().slice(0, 10),
      dateTo: to.toISOString().slice(0, 10),
    }
  },
  request: (input, account) =>
    get(`/users/${sellerOf(account)}/items_visits`, {
      date_from: input.dateFrom,
      date_to: input.dateTo,
    }),
})
