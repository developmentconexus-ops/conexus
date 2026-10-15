import type { Start } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { HubFailure } from '../../platform/hub.ts'
import { statusQuery } from './queries.ts'

const PHRASE = 'Hub do Conexus no ar.'
const HOUR_IN_BRASILIA = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function when(start: Start): string {
  if (start.state === 'NONE') return 'Nenhum início gravado'
  const part = Object.fromEntries(
    HOUR_IN_BRASILIA.formatToParts(new Date(start.startedAt)).map((p) => [p.type, p.value]),
  )
  return `${part.day}/${part.month} ${part.hour}:${part.minute}`
}

function StartRow(props: { label: string; start: Start }) {
  return (
    <div className="flex gap-md">
      <dt className="text-text-2">{props.label}</dt>
      <dd className="font-mono tabular-nums">{when(props.start)}</dd>
    </div>
  )
}

export function StatusPage() {
  const status = useQuery(statusQuery)
  const failure = status.error instanceof HubFailure ? status.error.code : 'INTERNAL_UNEXPECTED'
  return (
    <section className="flex flex-col gap-lg">
      {status.isError ? (
        <p role="alert" className="text-title">
          {FAILURES[failure].phrase}
        </p>
      ) : (
        <p className="text-title">{PHRASE}</p>
      )}
      {status.data && (
        <>
          <p className="font-mono text-fact tabular-nums text-text-2">{status.data.version}</p>
          <dl className="flex flex-col gap-xs text-fact text-text-2">
            <StartRow label="Último início" start={status.data.lastStart} />
            <StartRow label="Início anterior" start={status.data.previousStart} />
          </dl>
        </>
      )}
    </section>
  )
}
