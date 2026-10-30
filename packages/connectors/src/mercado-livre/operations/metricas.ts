import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { readOf, sellerOf } from './shared.ts'

const DAYS = 150

/** The date as the visits page shows it (`2026-09-30`): the day alone, no time. */
const Day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const visitas = readOf({
  id: 'visitas',
  subject: 'metricas',
  docs: 'recurso-visits',
  summary: `Soma as visitas aos anúncios do vendedor numa janela de datas, de no máximo ${DAYS} dias.`,
  label: 'Visitas',
  input: z.object({ dateFrom: Day, dateTo: Day }).refine(({ dateFrom, dateTo }) => {
    const days = (Date.parse(dateTo) - Date.parse(dateFrom)) / 86_400_000
    return days >= 0 && days <= DAYS
  }, `A janela vai de 0 a ${DAYS} dias`),
  list: null,
  probe: () => {
    const to = new Date()
    const from = new Date(to.getTime() - 30 * 86_400_000)
    return { dateFrom: from.toISOString().slice(0, 10), dateTo: to.toISOString().slice(0, 10) }
  },
  request: (input, account) =>
    get(`/users/${sellerOf(account)}/items_visits`, {
      date_from: input.dateFrom,
      date_to: input.dateTo,
    }),
})
