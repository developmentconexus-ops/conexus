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
export const formatDate = (iso: string) => date.format(new Date(iso))
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))
