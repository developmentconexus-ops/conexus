import type { Cadence, Weekday } from '@conexus/hub-api'

const DAY_NAMES: Record<Weekday, string> = {
  MON: 'segunda',
  TUE: 'terça',
  WED: 'quarta',
  THU: 'quinta',
  FRI: 'sexta',
  SAT: 'sábado',
  SUN: 'domingo',
}

/** The week as a person counts it in the company: Monday first. */
const WEEK: readonly Weekday[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

function capitalized(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function daysText(days: readonly Weekday[]): string {
  const names = WEEK.filter((day) => days.includes(day)).map((day) => DAY_NAMES[day])
  if (names.length === WEEK.length) return 'Todo dia'
  const last = names.at(-1)
  const text = names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} e ${last}`
  return capitalized(text)
}

/** When an automation runs, in words (code C26: the one owner of the text of a cadence). */
export function cadenceText(cadence: Cadence): string {
  switch (cadence.kind) {
    case 'DAILY':
      return `Todo dia às ${cadence.time}`
    case 'WEEKDAYS':
      return `Dias úteis às ${cadence.time}`
    case 'WEEKLY':
      return `${daysText(cadence.days)} às ${cadence.time}`
    case 'MONTHLY':
      return `Todo dia ${cadence.day} às ${cadence.time}`
  }
}
