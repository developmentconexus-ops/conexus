import type {
  AgentDetail,
  CompanyId,
  ProjectId,
  ReadyTool,
  ToolSummary,
  ToolVersionId,
} from '@conexus/hub-api'
import { useQuery } from '@tanstack/react-query'
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
import { connectionOf, LIBRARY_TOOLS, NO_TOOL_MATCH, READY_TOOLS, toolTitle } from './text.ts'
import type { Saving } from './use-draft-save.ts'

type Scope = { companyId: CompanyId; projectId: ProjectId }
type Part = { scope: Scope; agent: AgentDetail }

/** The window **Escolher** of the Ferramentas section: the library's tools and the connectors' ready reads, as the "+" menu lists a conversation's. */
function toggled(set: ReadonlySet<string>, key: string): ReadonlySet<string> {
  const next = new Set(set)
  if (!next.delete(key)) next.add(key)
  return next
}

/** A row of the chooser: the logo plate, the name, what sits at its end, and a switch, the pieces of the "+" menu. */
function ChoiceRow(props: {
  id: string
  logo: string | undefined
  title: string
  fact: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <li className={cn(ROW, 'justify-between')}>
      <label htmlFor={props.id} className="flex min-w-0 flex-1 items-center gap-sm">
        <Logo logo={props.logo} />
        <span className="truncate">{props.title}</span>
        <span className="shrink-0 text-fact text-text-2">{props.fact}</span>
      </label>
      <Switch id={props.id} checked={props.checked} onCheckedChange={props.onChange} />
    </li>
  )
}

function Group(props: { title: string; children: React.ReactNode }) {
  return (
    <section aria-label={props.title} className="flex flex-col">
      <h4 className="flex h-row items-center px-sm font-body text-label font-semibold">
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
    ...(readies.length > 0 && {
      ready: readies.map(({ connectionId, operation }) => ({ connectionId, operation })),
    }),
  }
}

export function Chooser(props: Part & { saving: Saving; onClose: () => void }) {
  const { scope, agent } = props
  const read = useQuery(toolsQuery(scope))
  const catalog = useConnectorCatalog(scope.companyId)
  const chosenIds = new Set(agent.tools.map((one) => one.id))
  const [picked, setPicked] = useState<ReadonlySet<string>>(chosenIds)
  const [ready, setReady] = useState<ReadonlySet<string>>(new Set())
  const [query, setQuery] = useState('')
  if (read.isError)
    return <ReadFailure text={sentenceOf(read.error)} onRetry={() => void read.refetch()} />
  function confirm(list: Listed) {
    props.saving.save((now) => chosenWrite(now, list, picked, ready), props.onClose)
  }
  const library = (read.data?.tools ?? []).map((tool) => ({
    tool,
    title: toolTitle(tool, agent.offered),
  }))
  const readies = (read.data?.ready ?? []).map((one) => ({ one, title: one.label }))
  const rows = library.length + readies.length
  const shownLibrary = library.filter((each) => matches(each.title, query))
  const shownReady = readies.filter((each) => matches(each.title, query))
  return (
    <div className="flex flex-col gap-md">
      {read.isPending && <Skeleton className="h-16 w-full" />}
      {rows >= SEARCH_FROM && (
        <Search label="Buscar ferramenta" value={query} onChange={setQuery} />
      )}
      {shownLibrary.length > 0 && (
        <Group title={LIBRARY_TOOLS}>
          {shownLibrary.map(({ tool, title }) => (
            <ChoiceRow
              key={tool.id}
              id={`tool-${tool.id}`}
              logo={catalog.logo(connectionOf(agent.offered, tool.connectionId)?.connector ?? '')}
              title={title}
              fact={`v${tool.latest.number}`}
              checked={picked.has(tool.id)}
              onChange={() => setPicked((now) => toggled(now, tool.id))}
            />
          ))}
        </Group>
      )}
      {shownReady.length > 0 && (
        <Group title={READY_TOOLS}>
          {shownReady.map(({ one, title }) => {
            const key = `${one.connectionId}:${one.operation}`
            return (
              <ChoiceRow
                key={key}
                id={`ready-${key}`}
                logo={catalog.logo(connectionOf(agent.offered, one.connectionId)?.connector ?? '')}
                title={title}
                fact={connectionOf(agent.offered, one.connectionId)?.name ?? ''}
                checked={ready.has(key)}
                onChange={() => setReady((now) => toggled(now, key))}
              />
            )
          })}
        </Group>
      )}
      {read.data !== undefined && rows > 0 && shownLibrary.length + shownReady.length === 0 && (
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
          onClick={() => read.data !== undefined && confirm(read.data)}
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
