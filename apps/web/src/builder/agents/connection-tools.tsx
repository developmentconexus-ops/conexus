import type {
  AgentDetail,
  OfferedConnection,
  ReadyTool,
  ToolSummary,
  ToolVersionId,
} from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { Checkbox } from '../../ui/checkbox.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { useConnectorCatalog } from '../assistant/public.ts'
import { toolsQuery } from './queries.ts'
import type { Part } from './section.tsx'
import {
  FREE_QUERY,
  FREE_QUERY_WARNING,
  MARK_ALL_READS,
  newVersionText,
  OUT_OF_ROLE,
  toolTitle,
} from './text.ts'
import type { Saving } from './use-draft-save.ts'

type Catalog = ReturnType<typeof useConnectorCatalog>
type Listed = { tools: ToolSummary[]; ready: ReadyTool[] }

/** A read of the kit as a row: the tool that holds it, if the agent or the library has one, else the ready read to be saved. */
type Read = {
  operation: string
  label: string
  summary: string
  door: boolean
  allowed: boolean
  chosen: AgentDetail['tools'][number] | undefined
  library: ToolSummary | undefined
  ready: ReadyTool | undefined
}

function readsOf(
  connection: OfferedConnection,
  agent: AgentDetail,
  list: Listed,
  catalog: Catalog,
): Read[] {
  const at = connection.connectionId
  const reads = connection.reads.map((read) => ({
    ...read,
    door: catalog.isDoor(connection.connector, read.operation),
    allowed: read.allowed !== false,
    chosen: agent.tools.find(
      (one) => one.kind === 'PRESET' && one.connectionId === at && one.operation === read.operation,
    ),
    library: list.tools.find(
      (one) => one.kind === 'PRESET' && one.connectionId === at && one.operation === read.operation,
    ),
    ready: list.ready.find((one) => one.connectionId === at && one.operation === read.operation),
  }))
  return reads
}

/** Whether the role of whoever edits holds every read the tool makes; a read the kit does not list is the Hub's to refuse. */
function toolAllowed(tool: ToolSummary, connection: OfferedConnection): boolean {
  const reads = tool.kind === 'CODE' ? tool.reads : [tool.operation]
  return reads.every(
    (operation) => connection.reads.find((one) => one.operation === operation)?.allowed !== false,
  )
}

/** What a company's own tool says under its title: the reads it makes, not its description again. */
function toolDetail(tool: ToolSummary, title: string): string | undefined {
  if (tool.kind === 'CODE') {
    return `Lê ${tool.reads.map((operation) => tool.readLabels[operation] ?? operation).join(', ')}`
  }
  return tool.description === title ? undefined : tool.description
}

/** The chosen tool's newer version, as the line offers it: the draft then holds that version. */
function newerOf(tool: AgentDetail['tools'][number] | undefined, saving: Saving) {
  if (tool === undefined || tool.latest.number <= tool.version.number) return undefined
  return {
    number: tool.latest.number,
    onUse: () =>
      saving.save((now) => ({
        tools: now.tools.map((one) => (one.id === tool.id ? tool.latest.id : one.version.id)),
      })),
  }
}

function versionsOf(now: AgentDetail, without: ReadonlySet<string> = new Set()): ToolVersionId[] {
  return now.tools.filter((one) => !without.has(one.id)).map((one) => one.version.id)
}

function Line(props: {
  id: string
  title: string
  detail?: string | undefined
  warning?: string | undefined
  checked: boolean
  disabled: boolean
  onChange: (on: boolean) => void
  /** The chosen tool, when a newer version of it exists. */
  newer?: { number: number; onUse: () => void } | undefined
}) {
  return (
    <li className="flex flex-wrap items-start gap-sm py-xs">
      <Checkbox
        id={props.id}
        checked={props.checked}
        disabled={props.disabled}
        onCheckedChange={props.onChange}
      />
      <label htmlFor={props.id} className="flex min-w-0 flex-1 flex-col">
        <span>{props.title}</span>
        {props.detail !== undefined && (
          <span className="text-fact text-text-2">{props.detail}</span>
        )}
        {props.warning !== undefined && (
          <span className="text-fact text-danger">{props.warning}</span>
        )}
      </label>
      {props.newer !== undefined && (
        <span className="flex flex-wrap items-center gap-xs">
          <span className="text-fact text-text-2">{newVersionText(props.newer.number)}</span>
          <Button size="sm" onClick={props.newer.onUse}>
            Usar a versão {props.newer.number}
          </Button>
        </span>
      )}
    </li>
  )
}

function ReadLine(props: { connection: OfferedConnection; read: Read; saving: Saving }) {
  const { connection, read, saving } = props
  function change(on: boolean) {
    saving.save((now) => {
      if (!on)
        return {
          tools: versionsOf(now, new Set(read.chosen === undefined ? [] : [read.chosen.id])),
        }
      if (read.library !== undefined) return { tools: [...versionsOf(now), read.library.latest.id] }
      if (read.ready === undefined) return {}
      const { connectionId, operation } = read.ready
      return { tools: versionsOf(now), ready: [{ connectionId, operation }] }
    })
  }
  const known = read.chosen !== undefined || read.library !== undefined || read.ready !== undefined
  return (
    <Line
      id={`read-${connection.connectionId}-${read.operation}`}
      title={read.label}
      detail={read.allowed ? read.summary : OUT_OF_ROLE}
      warning={read.operation === FREE_QUERY ? FREE_QUERY_WARNING : undefined}
      checked={read.chosen !== undefined}
      disabled={(!read.allowed && read.chosen === undefined) || !known}
      onChange={change}
      newer={newerOf(read.chosen, saving)}
    />
  )
}

/** Marks the kit's reads the role allows, the free query never. */
function markAll(reads: readonly Read[], saving: Saving) {
  const wanted = reads.filter((read) => !read.door && read.allowed && read.chosen === undefined)
  saving.save((now) => ({
    tools: [
      ...versionsOf(now),
      ...wanted.flatMap((read) => (read.library ? [read.library.latest.id] : [])),
    ],
    ready: wanted.flatMap((read) =>
      read.library === undefined && read.ready !== undefined
        ? [{ connectionId: read.ready.connectionId, operation: read.ready.operation }]
        : [],
    ),
  }))
}

/**
 * The tools of a selected connection (decision E4), under its selector: the kit's reads, the
 * company's own tools made over it, and the free query last with its warning. Nothing is marked
 * until the person marks it; each mark is saved at once.
 */
export function ConnectionTools(props: Part & { connection: OfferedConnection; saving: Saving }) {
  const { scope, agent, connection, saving } = props
  const read = useQuery(toolsQuery(scope))
  const catalog = useConnectorCatalog(scope.companyId)
  if (read.isError) {
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  }
  if (read.data === undefined) return <Skeleton className="h-16 w-full" />
  const reads = readsOf(connection, agent, read.data, catalog)
  const own = read.data.tools.filter(
    (tool) =>
      tool.connectionId === connection.connectionId &&
      !reads.some((one) => one.library?.id === tool.id),
  )
  // The connection's name titles the group when the Projeto has two of the same system.
  const sameSystem =
    agent.offered.filter((one) => one.connector === connection.connector).length > 1
  const line = (one: Read) => (
    <ReadLine key={one.operation} connection={connection} read={one} saving={saving} />
  )
  return (
    <div className="flex flex-col gap-xs pl-lg">
      {sameSystem && <h4 className="font-body text-label font-semibold">{connection.name}</h4>}
      <ul aria-label={`Ferramentas de ${connection.name}`} className="flex flex-col">
        {reads.filter((one) => one.operation !== FREE_QUERY).map(line)}
        {own.map((tool) => {
          const allowed = toolAllowed(tool, connection)
          const chosen = agent.tools.find((one) => one.id === tool.id)
          const title = toolTitle(tool, agent.offered)
          return (
            <Line
              key={tool.id}
              id={`tool-${connection.connectionId}-${tool.id}`}
              title={title}
              detail={allowed ? toolDetail(tool, title) : OUT_OF_ROLE}
              checked={chosen !== undefined}
              disabled={!allowed && chosen === undefined}
              newer={newerOf(chosen, saving)}
              onChange={(on) =>
                saving.save((now) => ({
                  tools: on
                    ? [...versionsOf(now), tool.latest.id]
                    : versionsOf(now, new Set([tool.id])),
                }))
              }
            />
          )
        })}
        {reads.filter((one) => one.operation === FREE_QUERY).map(line)}
      </ul>
      <div>
        <Button
          size="sm"
          aria-label={`${MARK_ALL_READS} de ${connection.name}`}
          onClick={() => markAll(reads, saving)}
        >
          {MARK_ALL_READS}
        </Button>
      </div>
    </div>
  )
}
