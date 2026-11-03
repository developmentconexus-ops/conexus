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

export type DayGroup = 'TODAY' | 'YESTERDAY' | 'WEEK' | 'BEFORE'

const MS_PER_DAY = 86_400_000

/** Whole calendar days from `instant` to `now`, both read in the browser's zone like every date here. */
function daysBetween(instant: string, now: Date): number {
  const then = new Date(instant)
  const from = Date.UTC(then.getFullYear(), then.getMonth(), then.getDate())
  const to = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((to - from) / MS_PER_DAY)
}

/** The group a conversation falls in: today, yesterday, up to 7 days back, or before. */
export function dayGroupOf(instant: string, now: Date): DayGroup {
  const days = daysBetween(instant, now)
  if (days <= 0) return 'TODAY'
  if (days === 1) return 'YESTERDAY'
  return days <= 7 ? 'WEEK' : 'BEFORE'
}

/** How long ago, short enough for a row's end: "5 min", "2 h", "ontem", "3 d", then the day and month. */
export function ageOf(instant: string, now: Date): string {
  const days = daysBetween(instant, now)
  if (days <= 0) {
    const minutes = Math.max(0, Math.floor((now.getTime() - new Date(instant).getTime()) / 60_000))
    return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h`
  }
  if (days === 1) return 'ontem'
  return days <= 7 ? `${days} d` : dayAndMonth(instant)
}

/** "Bom dia, Ana": the part of the day by the browser's clock and the person's first name. */
export function greetingOf(now: Date, fullName: string): string {
  const hour = now.getHours()
  const part = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const first = fullName.trim().split(/\s+/)[0] ?? ''
  return first === '' ? part : `${part}, ${first}`
}
