import type { Cadence, Weekday } from '@conexus/hub-api'

/** Every automation runs on São Paulo's clock (founder F1). */
export const AUTOMATION_TIMEZONE = 'America/Sao_Paulo'
/**
 * The most active automations a company keeps: each may send one e-mail a day, and Conexus's mail
 * account sends 200 a day for every company and the invitations (decision 0017).
 */
export const ACTIVE_AUTOMATIONS_PER_COMPANY = 30

const DAY: Readonly<Record<Weekday, number>> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
}

/** The one owner of cadence to cron (code C26): Mastra's five fields, minute first. */
export function cronOf(cadence: Cadence): string {
  const [hour, minute] = cadence.time.split(':').map(Number)
  const at = `${minute} ${hour}`
  switch (cadence.kind) {
    case 'DAILY':
      return `${at} * * *`
    case 'WEEKDAYS':
      return `${at} * * 1-5`
    case 'WEEKLY': {
      const days = [...new Set(cadence.days.map((day) => DAY[day]))].sort((a, b) => a - b)
      return `${at} * * ${days.join(',')}`
    }
    case 'MONTHLY':
      return `${at} ${cadence.day} * *`
    default:
      return cadence satisfies never
  }
}
