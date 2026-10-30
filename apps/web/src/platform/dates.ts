// No `timeZone`: a date on screen reads in the person's own zone, the browser's.
const DAY_AND_HOUR = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/** The day and the hour, as "17/10/2026, 09:00". */
export function dayAndHour(instant: string): string {
  return DAY_AND_HOUR.format(new Date(instant))
}

const HOUR = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false })

/** The hour on the clock, as "09:30". */
export function clockOf(instant: string): string {
  return HOUR.format(new Date(instant))
}

/** The hour, as "09h30". */
export function hourOf(instant: string): string {
  return clockOf(instant).replace(':', 'h')
}

const DAY = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

/** The day, as "17/10/2026". */
export function dayOf(instant: string): string {
  return DAY.format(new Date(instant))
}

const DAY_AND_MONTH = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' })

/** The day and the month, as "28/10". */
export function dayAndMonth(instant: string): string {
  return DAY_AND_MONTH.format(new Date(instant))
}
