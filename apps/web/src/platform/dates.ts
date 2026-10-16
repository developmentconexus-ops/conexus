// No `timeZone`: a date on screen reads in the person's own zone, the browser's.
const DAY_AND_HOUR = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

/** The day and the hour, as "17/10/2026, 09:00". */
export function dayAndHour(instant: string): string {
  return DAY_AND_HOUR.format(new Date(instant))
}
