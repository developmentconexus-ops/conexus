import type {
  AgentDetail,
  CompanyId,
  ProjectId,
  ReadyTool,
  ToolSummary,
  ToolVersionId,
} from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
import { GlobeIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { sentenceOf } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { DialogFooter } from '../../ui/dialog.tsx'
import { Skeleton } from '../../ui/skeleton.tsx'
import { ReadFailure } from '../../ui/states.tsx'
import { Switch } from '../../ui/switch.tsx'
import {
  Logo,
  matches,
  ROW,
  SEARCH_FROM,
  Search,
  useConnectorCatalog,
} from '../assistant/public.ts'
import { toolsQuery } from './queries.ts'
import {
  CONEXUS_TOOLS,
  connectionOf,
  LIBRARY_TOOLS,
  NO_TOOL_MATCH,
  readyGroup,
  toolFact,
  toolTitle,
  WEB_TOOL,
} from './text.ts'
import type { Saving } from './use-draft-save.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }
type Part = { scope: Scope; agent: AgentDetail }

/** The set with `key` taken out when it is in, put in when it is not. */
function toggled(set: ReadonlySet<string>, key: string): ReadonlySet<string> {
  const next = new Set(set)
  if (!next.delete(key)) next.add(key)
  return next
}

/** A row of the chooser: the logo plate, the name, what sits at its end, and a switch, the pieces of the "+" menu. */
function ChoiceRow(props: {
  id: string
  leading: ReactNode
  title: string
  /** What the tool does and where, under its name. */
  detail?: string
  /** Its version, at the end. */
  fact?: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <li className={cn(ROW, 'justify-between')}>
      <label htmlFor={props.id} className="flex min-w-0 flex-1 items-center gap-sm">
        {props.leading}
        <span className="flex min-w-0 flex-col">
          <span className="truncate">{props.title}</span>
          {props.detail !== undefined && (
            <span className="truncate text-fact text-text-2">{props.detail}</span>
          )}
        </span>
        {props.fact !== undefined && (
          <span className="ml-auto shrink-0 text-fact text-text-2">{props.fact}</span>
        )}
      </label>
      <Switch id={props.id} checked={props.checked} onCheckedChange={props.onChange} />
    </li>
  )
}

function Group(props: { title: string; logo?: string; children: React.ReactNode }) {
  return (
    <section aria-label={props.title} className="flex flex-col">
      <h4 className="flex h-row items-center gap-sm px-sm font-body text-label font-semibold">
        {props.logo !== undefined && <Logo logo={props.logo} />}
        {props.title}
      </h4>
      <ul className="flex flex-col">{props.children}</ul>
    </section>
  )
}

type Listed = { tools: ToolSummary[]; ready: ReadyTool[] }

/** What the draft saves: the chosen library tools at the version the draft holds, the ready reads chosen now. */
function chosenWrite(
  now: AgentDetail,
  list: Listed,
  picked: ReadonlySet<string>,
  ready: ReadonlySet<string>,
  web: boolean,
) {
  const readies = list.ready.filter((one) => ready.has(`${one.connectionId}:${one.operation}`))
  // A chosen tool the list does not bring cannot be unticked here, so it stays, at its version.
  const unlisted = now.tools.filter((one) => !list.tools.some((tool) => tool.id === one.id))
  const listed = list.tools.flatMap((tool) => {
    if (!picked.has(tool.id)) return []
    return [now.tools.find((one) => one.id === tool.id)?.version.id ?? tool.latest.id]
  })
  const tools: ToolVersionId[] = [...unlisted.map((one) => one.version.id), ...listed]
  return {
    tools,
    web,
    ...(readies.length > 0 && {
      ready: readies.map(({ connectionId, operation }) => ({ connectionId, operation })),
    }),
  }
}

type Catalog = ReturnType<typeof useConnectorCatalog>
type Shown = { query: string; catalog: Catalog; agent: AgentDetail }

/** The connector a ready read comes from, by the connection it reads; the id's own when the Projeto no longer offers it. */
function connectorOf(agent: AgentDetail, connectionId: string): string {
  return connectionOf(agent.offered, connectionId)?.connector ?? ''
}

/** A group of the connector's ready reads for each connector, its logo in the title. */
function ReadyGroups(
  props: Shown & {
    readies: { one: ReadyTool; title: string }[]
    chosen: ReadonlySet<string>
    onToggle: (key: string) => void
  },
) {
  const { agent, catalog } = props
  const several = agent.offered.length > 1
  const connectors = [
    ...new Set(props.readies.map(({ one }) => connectorOf(agent, one.connectionId))),
  ]
  return connectors.map((connector) => (
    <Group
      key={connector}
      title={readyGroup(catalog.name(connector))}
      {...(catalog.logo(connector) !== undefined && { logo: catalog.logo(connector) })}
    >
      {props.readies
        .filter(({ one }) => connectorOf(agent, one.connectionId) === connector)
        .map(({ one, title }) => {
          const key = `${one.connectionId}:${one.operation}`
          return (
            <ChoiceRow
              key={key}
              id={`ready-${key}`}
              leading={<Logo logo={catalog.logo(connector)} />}
              title={title}
              detail={toolFact(
                catalog.name(connector),
                several ? connectionOf(agent.offered, one.connectionId)?.name : undefined,
                'READ',
              )}
              checked={props.chosen.has(key)}
              onChange={() => props.onToggle(key)}
            />
          )
        })}
    </Group>
  ))
}

function LibraryGroup(
  props: Shown & {
    tools: { tool: ToolSummary; title: string }[]
    picked: ReadonlySet<string>
    onToggle: (id: string) => void
  },
) {
  const { agent, catalog } = props
  if (props.tools.length === 0) return null
  return (
    <Group title={LIBRARY_TOOLS}>
      {props.tools.map(({ tool, title }) => {
        const connection = connectionOf(agent.offered, tool.connectionId)
        return (
          <ChoiceRow
            key={tool.id}
            id={`tool-${tool.id}`}
            leading={<Logo logo={catalog.logo(connection?.connector ?? '')} />}
            title={title}
            detail={
              connection === undefined
                ? undefined
                : toolFact(
                    catalog.name(connection.connector),
                    agent.offered.length > 1 ? connection.name : undefined,
                    tool.effect,
                  )
            }
            fact={`v${tool.latest.number}`}
            checked={props.picked.has(tool.id)}
            onChange={() => props.onToggle(tool.id)}
          />
        )
      })}
    </Group>
  )
}

/**
 * The window of the Ferramentas section: the library's tools, the connectors' ready reads and the web
 * search, as the "+" menu lists a conversation's. Nothing is saved until **Usar as escolhidas**.
 */
export function Chooser(props: Part & { saving: Saving; onClose: () => void }) {
  const { scope, agent } = props
  const read = useQuery(toolsQuery(scope))
  const catalog = useConnectorCatalog(scope.companyId)
  const [picked, setPicked] = useState<ReadonlySet<string>>(
    new Set(agent.tools.map((one) => one.id)),
  )
  const [ready, setReady] = useState<ReadonlySet<string>>(new Set())
  const [web, setWeb] = useState(agent.draft.web)
  const [query, setQuery] = useState('')
  if (read.isError)
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  const library = (read.data?.tools ?? []).map((tool) => ({
    tool,
    title: toolTitle(tool, agent.offered),
  }))
  const readies = (read.data?.ready ?? []).map((one) => ({ one, title: one.label }))
  const shown = {
    tools: library.filter((each) => matches(each.title, query)),
    readies: readies.filter((each) => matches(each.title, query)),
    web: matches(WEB_TOOL, query),
  }
  const at = { query, catalog, agent }
  return (
    <div className="flex flex-col gap-md">
      {read.isPending && <Skeleton className="h-16 w-full" />}
      {library.length + readies.length + 1 >= SEARCH_FROM && (
        <Search label="Buscar ferramenta" value={query} onChange={setQuery} />
      )}
      <ReadyGroups
        {...at}
        readies={shown.readies}
        chosen={ready}
        onToggle={(key) => setReady((now) => toggled(now, key))}
      />
      <LibraryGroup
        {...at}
        tools={shown.tools}
        picked={picked}
        onToggle={(id) => setPicked((now) => toggled(now, id))}
      />
      {shown.web && (
        <Group title={CONEXUS_TOOLS}>
          <ChoiceRow
            id="tool-web"
            leading={<GlobeIcon aria-hidden="true" className="size-5 shrink-0" />}
            title={WEB_TOOL}
            checked={web}
            onChange={() => setWeb((now) => !now)}
          />
        </Group>
      )}
      {read.data !== undefined && !shown.web && shown.tools.length + shown.readies.length === 0 && (
        <p className="px-sm text-text-2">{NO_TOOL_MATCH}</p>
      )}
      {props.saving.error !== undefined && (
        <p role="alert" className="text-danger">
          {props.saving.error}
        </p>
      )}
      <DialogFooter>
        <Button
          variant="primary"
          disabled={read.data === undefined || props.saving.pending}
          onClick={() =>
            read.data !== undefined &&
            props.saving.save(
              (now) => chosenWrite(now, read.data, picked, ready, web),
              props.onClose,
            )
          }
        >
          Usar as escolhidas
        </Button>
        <Button variant="ghost" onClick={props.onClose}>
          Cancelar
        </Button>
      </DialogFooter>
    </div>
  )
}
