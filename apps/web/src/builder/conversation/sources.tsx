import { ConnectorLogo } from '../../hub/connectors/public.ts'
import { systemText } from '../../hub/copies/public.ts'
import { clockOf, dayGroupOf } from '../../platform/dates.ts'
import type { SourceView } from '../../ui/ai/sources.tsx'
import { Sources as SourceList } from '../../ui/ai/sources.tsx'
import { useRoom } from './room.ts'
import type { MessageSource } from './sources.ts'
import { keyOf, whenOf } from './sources.ts'
import type { ConnectorWords } from './tool-spec.ts'

type DataSource = Extract<MessageSource, { kind: 'data' }>

/** What a live read's stamp says: when it was read, as a success. */
function stampOf(source: DataSource, now: Date): Extract<SourceView, { kind: 'TABLE' }>['stamp'] {
  const live =
    dayGroupOf(source.at, now) === 'TODAY'
      ? `lido agora, às ${clockOf(source.at)}`
      : `lido ${whenOf(source.at, now)}`
  return { tone: 'success', text: `ao vivo · ${live}` }
}

/** The system and the connection the data came from, without repeating the system in a connection that bears its name. */
function nameOf(source: DataSource, connectors: ConnectorWords): string {
  return systemText(connectors.name(source.connector), [source.connection], 0)
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
    table: source.table,
    stamp: stampOf(source, now),
  }
}

/** Where a model's answer found what it says: each page's title and domain, each live read, under the message. */
export function Sources({ sources }: { sources: readonly MessageSource[] }) {
  const { connectors } = useRoom()
  const now = new Date()
  return (
    <SourceList label="Fontes" sources={sources.map((source) => viewOf(source, now, connectors))} />
  )
}
