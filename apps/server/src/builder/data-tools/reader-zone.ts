import { READER_ZONE, ReaderZone } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'

/** What a tool says of the instants it hands the model, so it reads them as written. */
export const INSTANTS_NOTE =
  'Instants come in ISO 8601 with their UTC offset, in the zone of the person who is reading: say them as written, at that offset, never as UTC. Without a known zone they come in UTC (Z), and you say UTC.'

/** The zone the browser sent with the message; UTC when it sent none or one the runtime does not know. */
export function zoneOf(requestContext: RequestContext | undefined): string {
  return ReaderZone.safeParse(requestContext?.get(READER_ZONE)).data ?? 'UTC'
}

/** An instant as ISO 8601 in `zone` with its UTC offset ("2026-11-16T00:30:00.000-03:00"); in UTC, the `Z` form. */
export function inZone(instant: Date | string, zone: string): string {
  const at = new Date(instant)
  if (zone === 'UTC') return at.toISOString()
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    hourCycle: 'h23',
    timeZoneName: 'longOffset',
    ...{ year: 'numeric', month: '2-digit', day: '2-digit' },
    ...{ hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 },
  }).formatToParts(at)
  function part(type: Intl.DateTimeFormatPartTypes): string {
    return parts.find((each) => each.type === type)?.value ?? ''
  }
  const offset = part('timeZoneName').replace('GMT', '') || '+00:00'
  const [date, clock] = [
    `${part('year')}-${part('month')}-${part('day')}`,
    `${part('hour')}:${part('minute')}:${part('second')}.${part('fractionalSecond')}`,
  ]
  return `${date}T${clock}${offset}`
}
