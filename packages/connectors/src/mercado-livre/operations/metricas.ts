import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { Instant, maybe, readOf, sellerOf } from './shared.ts'

const DAYS = 150

const Visitas = z.object({
  date_from: maybe(z.string()),
  date_to: maybe(z.string()),
  total_visits: z.number().int(),
  visits_detail: z.array(z.object({ company: z.string(), quantity: z.number().int() })).default([]),
})

export const visitas = readOf({
  id: 'visitas',
  subject: 'metricas',
  docs: 'metricas-visitas',
  summary: `Soma as visitas aos anúncios do vendedor numa janela de datas, de no máximo ${DAYS} dias.`,
  label: 'Visitas',
  input: z.object({ dateFrom: Instant, dateTo: Instant }).refine(({ dateFrom, dateTo }) => {
    const days = (Date.parse(dateTo) - Date.parse(dateFrom)) / 86_400_000
    return days >= 0 && days <= DAYS
  }, `A janela vai de 0 a ${DAYS} dias`),
  output: Visitas,
  probe: () => {
    const to = new Date()
    const from = new Date(to.getTime() - 30 * 86_400_000)
    return { dateFrom: from.toISOString(), dateTo: to.toISOString() }
  },
  request: (input, account) =>
    get(`/users/${sellerOf(account)}/items_visits`, {
      date_from: input.dateFrom,
      date_to: input.dateTo,
    }),
})
