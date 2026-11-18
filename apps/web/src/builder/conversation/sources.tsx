import { ConnectorLogo, stateBadge } from '../../hub/connectors/public.ts'
import { systemText } from '../../hub/copies/public.ts'
import { clockOf, dayGroupOf } from '../../platform/dates.ts'
import type { SourceView } from '../../ui/ai/sources.tsx'
import { Sources as SourceList } from '../../ui/ai/sources.tsx'
import { Badge } from '../../ui/badge.tsx'
import { useRoom } from './room.ts'
import type { MessageSource } from './sources.ts'
import { keyOf, whenOf } from './sources.ts'
import type { ConnectorWords } from './tool-spec.ts'

type DataSource = Extract<MessageSource, { kind: 'data' }>

/** What a source's stamp says, and the tone of its dot: the colour never stands alone. */
function stampOf(source: DataSource, now: Date): Extract<SourceView, { kind: 'TABLE' }>['stamp'] {
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

function Reauth({ connector }: { connector: string }) {
  const { connectors } = useRoom()
  const badge = stateBadge({ state: 'NEEDS_REAUTH' }, connectors.auth(connector))
  return badge === null ? null : <Badge tone={badge.tone}>{badge.text}</Badge>
}

function viewOf(source: MessageSource, now: Date, connectors: ConnectorWords): SourceView {
  if (source.kind === 'web')
    return {
      kind: 'PAGE',
      key: keyOf(source),
      title: source.linked ? (source.title ?? source.url) : (source.title ?? ''),
      href: source.linked ? source.url : undefined,
      domain: source.domain,
    }
  const logo = connectors.logo(source.connector)
  return {
    kind: 'TABLE',
    key: keyOf(source),
    name: nameOf(source, connectors),
    logo: logo === undefined ? undefined : <ConnectorLogo small entry={{ logo }} />,
    badge: source.reauth ? <Reauth connector={source.connector} /> : undefined,
    table: source.table,
    stamp: stampOf(source, now),
  }
}

/** Where a model's answer found what it says: each page's title and domain, each table's copy or live read, under the message. */
export function Sources({ sources }: { sources: readonly MessageSource[] }) {
  const { connectors } = useRoom()
  const now = new Date()
  return (
    <SourceList label="Fontes" sources={sources.map((source) => viewOf(source, now, connectors))} />
  )
}
