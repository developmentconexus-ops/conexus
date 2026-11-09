const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const number = new Intl.NumberFormat('pt-BR')
const percent = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 })
const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' })
const dateTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'America/Sao_Paulo',
})

// A decimal arrives as text ("1234.50") so that no sum loses precision: convert it only to print.
export const formatMoney = (value: number | string) => money.format(Number(value))
export const formatNumber = (value: number | string) => number.format(Number(value))
export const formatPercent = (fraction: number | string) => percent.format(Number(fraction))

// A date arrives as ISO text: a timestamptz from PostgreSQL, or a date the handler's query formatted.
// A date without a time ("2026-10-22") is that calendar day, so it prints as written: parsed as an
// instant it would be UTC midnight, the previous evening in São Paulo.
const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/
export const formatDate = (iso: string) => {
  const day = dateOnly.exec(iso)
  return day ? `${day[3]}/${day[2]}/${day[1]}` : date.format(new Date(iso))
}
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))
