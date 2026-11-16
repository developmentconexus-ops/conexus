import { clockOf, dayGroupOf } from '../../platform/dates.ts'
import { useRoom } from './room.ts'
import type { MessageSource } from './sources.ts'
import { keyOf, whenOf } from './sources.ts'

type DataSource = Extract<MessageSource, { kind: 'data' }>

function copiedText(source: DataSource, now: Date): string {
  if (source.at === null) return 'ainda sem cópia'
  const when = whenOf(source.at, now)
  switch (source.state) {
    case 'PARTIAL':
      return `rodada parcial, copiado ${when}`
    case 'STOPPED':
      return `parada ${when}`
    default:
      return `copiado ${when}`
  }
}

function liveText(at: string, now: Date): string {
  return dayGroupOf(at, now) === 'TODAY'
    ? `lido agora, às ${clockOf(at)}`
    : `lido ${whenOf(at, now)}`
}

/** Where a model's answer found what it says: each page's title and domain, each table's copy or live read, under the message. */
export function Sources({ sources }: { sources: readonly MessageSource[] }) {
  const { connectors } = useRoom()
  const now = new Date()
  return (
    <section
      aria-label="Fontes"
      className="flex min-w-0 flex-col gap-xs px-md text-fact text-text-2"
    >
      <h3 className="font-semibold text-text">Fontes</h3>
      <ul className="m-0 flex min-w-0 list-none flex-col gap-xs p-0">
        {sources.map((source) =>
          source.kind === 'data' ? (
            <li key={keyOf(source)} className="min-w-0 break-words">
              {source.state === 'LIVE' && source.at !== null
                ? `${connectors.name(source.connector)} · ${source.system} · ${liveText(source.at, now)}`
                : `${connectors.name(source.connector)} · ${source.table} · ${copiedText(source, now)}`}
            </li>
          ) : (
            <li key={keyOf(source)} className="flex min-w-0 flex-wrap gap-x-sm">
              <span className="min-w-0 break-words">
                {source.linked ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text underline underline-offset-2"
                  >
                    {source.title ?? source.url}
                  </a>
                ) : (
                  source.title
                )}
              </span>
              {source.domain !== '' && <span className="min-w-0 break-all">{source.domain}</span>}
            </li>
          ),
        )}
      </ul>
    </section>
  )
}
