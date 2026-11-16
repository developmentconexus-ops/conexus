import { ConnectorLogo, stateBadge } from '../../hub/connectors/public.ts'
import { systemText } from '../../hub/copies/public.ts'
import { clockOf, dayGroupOf } from '../../platform/dates.ts'
import { Badge } from '../../ui/badge.tsx'
import { Stamp } from '../../ui/block.tsx'
import { cn } from '../../ui/cn.ts'
import { useRoom } from './room.ts'
import type { MessageSource } from './sources.ts'
import { keyOf, whenOf } from './sources.ts'
import type { ConnectorWords } from './tool-spec.ts'

type DataSource = Extract<MessageSource, { kind: 'data' }>

/** What a source's stamp says, and the tone of its dot: the colour never stands alone. */
function stampOf(
  source: DataSource,
  now: Date,
): { tone: 'neutral' | 'success' | 'warning' | 'danger'; text: string } {
  if (source.state === 'LIVE' && source.at !== null) {
    const live =
      dayGroupOf(source.at, now) === 'TODAY'
        ? `lido agora, às ${clockOf(source.at)}`
        : `lido ${whenOf(source.at, now)}`
    return { tone: 'success', text: `ao vivo · ${live}` }
  }
  if (source.at === null) return { tone: 'neutral', text: 'ainda sem cópia' }
  const when = whenOf(source.at, now)
  switch (source.state) {
    case 'PARTIAL':
      return { tone: 'warning', text: `rodada parcial, copiado ${when}` }
    case 'STOPPED':
      return { tone: 'danger', text: `parada ${when}` }
    default:
      return { tone: 'success', text: `copiado ${when}` }
  }
}

/** The system and the connections the data came from, without repeating the system in a connection that bears its name. */
function nameOf(source: DataSource, connectors: ConnectorWords): string {
  return systemText(connectors.name(source.connector), source.connections, 0)
}

/** The class that gives a state its tone: the words stay `text-2` except where the run did not go through. */
const STAMPS = {
  neutral: 'before:bg-line-strong',
  success: 'text-text-2 before:bg-success',
  warning: '',
  danger: '',
} as const

function Reauth({ connector }: { connector: string }) {
  const { connectors } = useRoom()
  const badge = stateBadge({ state: 'NEEDS_REAUTH' }, connectors.auth(connector))
  return badge === null ? null : <Badge tone={badge.tone}>{badge.text}</Badge>
}

function DataLine({ source, now }: { source: DataSource; now: Date }) {
  const { connectors } = useRoom()
  const logo = connectors.logo(source.connector)
  const stamp = stampOf(source, now)
  return (
    <li className="flex min-h-8 min-w-0 flex-wrap items-center gap-x-sm gap-y-xs py-xs not-first:border-t not-first:border-line">
      {logo !== undefined && <ConnectorLogo small entry={{ logo }} />}
      <span className="min-w-0 break-words text-label font-medium text-text">
        {nameOf(source, connectors)}
      </span>
      {source.reauth && <Reauth connector={source.connector} />}
      <span aria-hidden="true" className="basis-full @md:hidden" />
      <span
        className={cn(
          'min-w-0 break-all rounded-control bg-surface-3 px-xs font-mono text-fact text-text',
          logo !== undefined && '@max-md:ms-7',
        )}
      >
        {source.table}
      </span>
      <span className="@md:ms-auto">
        <Stamp tone={stamp.tone} className={STAMPS[stamp.tone]}>
          {stamp.text}
        </Stamp>
      </span>
    </li>
  )
}

/** Where a model's answer found what it says: each page's title and domain, each table's copy or live read, under the message. */
export function Sources({ sources }: { sources: readonly MessageSource[] }) {
  const now = new Date()
  return (
    <section
      aria-label="Fontes"
      className="@container mx-md flex min-w-0 flex-col gap-xs border-t border-line pt-sm text-fact text-text-2"
    >
      <h3 className="text-label font-semibold text-text">Fontes</h3>
      <ul className="m-0 flex min-w-0 list-none flex-col p-0">
        {sources.map((source) =>
          source.kind === 'data' ? (
            <DataLine key={keyOf(source)} source={source} now={now} />
          ) : (
            <li key={keyOf(source)} className="flex min-w-0 flex-wrap gap-x-sm py-xs">
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
