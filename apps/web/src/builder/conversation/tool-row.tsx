import {
  DraftRef,
  ProposedApp,
  ProposedAutomation,
  ProposedCompanyMemory,
  ShownFile,
  TestedResult,
  ToolSearchResult,
} from '@conexus/hub-api'
import { Link, useParams } from '@tanstack/react-router'
import { BotIcon, FileTextIcon } from 'lucide-react'
import { useEffect, useEffectEvent, useState } from 'react'
import { Button } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import {
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '../../ui/trace.tsx'
import { failureDetail } from './connector-specs.ts'
import { useSecondsSince } from './elapsed.ts'
import type { Room } from './room.ts'
import { useRoom } from './room.ts'
import type { ToolItem } from './rows.ts'
import { durationOf } from './text.ts'
import type { Edit } from './tool-args.ts'
import { editOf, shown } from './tool-args.ts'
import {
  Answer,
  asksToReconnect,
  BLOCK,
  Generic,
  Library,
  Program,
  Reason,
  Research,
  textOf,
} from './tool-bodies.tsx'
import type { ToolBody, ToolStatus } from './tool-registry.ts'
import { presentTool, readable, specOf, toolStatus } from './tool-registry.ts'

function fieldOf(obj: unknown, key: string): string | undefined {
  if (obj && typeof obj === 'object' && key in obj) {
    const val = Reflect.get(obj, key)
    return typeof val === 'string' ? val : undefined
  }
  return undefined
}

/** The clock of a call that runs, from when the screen first heard of it. */
function Since({ at }: { at: number | undefined }) {
  const [mounted] = useState(Date.now)
  const seconds = useSecondsSince(at ?? mounted)
  return (
    <TraceDescription aria-hidden="true" className="shrink-0 text-fact">
      ({durationOf(seconds)})
    </TraceDescription>
  )
}

function opens(tool: ToolItem, status: ToolStatus, room: Room): boolean {
  // A refusal the Assistant's tool answered is said by its line; a refusal with its own fields has more to say.
  const refusal = specOf(tool.toolName, room)?.refusal?.(tool.result)
  if (refusal !== undefined) return refusal !== 'SAID'
  if (status === 'error' || status === 'denied')
    return failureDetail(tool, room) !== null || asksToReconnect(tool, room)
  if (tool.output !== undefined && tool.output.length > 0) return true
  if (tool.result !== undefined && tool.result !== null) return true
  return (
    tool.args !== undefined &&
    tool.args !== null &&
    typeof tool.args === 'object' &&
    Object.keys(tool.args).length > 0
  )
}

function Side(props: { sign: '-' | '+'; text: string; className: string }) {
  const { sign, text, className } = props
  if (text === '') return null
  const lines = text.split('\n').map((line, at) => ({ line, at }))
  return (
    <div className={className}>
      {lines.map((row) => (
        <div key={row.at} className="flex whitespace-pre-wrap">
          <span aria-hidden="true" className="w-4 shrink-0 select-none">
            {sign}
          </span>
          <span className="min-w-0 wrap-break-word">{row.line}</span>
        </div>
      ))}
    </div>
  )
}

function Change({ edit }: { edit: Edit }) {
  if ('content' in edit) {
    return (
      <fieldset aria-label="Arquivo escrito" className="m-0 min-w-0 border-0 p-0">
        <pre className={BLOCK}>{shown(edit.content)}</pre>
      </fieldset>
    )
  }
  return (
    <fieldset
      aria-label="Mudança no arquivo"
      className={cn(BLOCK, 'm-0 flex min-w-0 flex-col border-0')}
    >
      <Side sign="-" text={shown(edit.before)} className="text-danger" />
      <Side sign="+" text={shown(edit.after)} className="text-success" />
    </fieldset>
  )
}

/** The heading of an open row: its sentence in Portuguese, or the readable name for a tool outside the table. */
function titleOf(toolName: string, room: Room) {
  return specOf(toolName, room)?.done ?? readable(toolName)
}

/** What the line says beside its sentence, which the open row says whole. */
function besideOf(tool: ToolItem, room: Room): string | undefined {
  const presented = presentTool(tool, 'done', room)
  return presented.beside ? presented.detail : undefined
}

function Block({ tool, body }: { tool: ToolItem; body: ToolBody }) {
  const room = useRoom()
  const detail = presentTool(tool, 'done', room).detail
  const title = titleOf(tool.toolName, room)
  switch (body) {
    case 'command': {
      const output = tool.output ?? textOf(tool.result)
      return (
        <>
          <pre className={BLOCK}>
            {[`$ ${shown(detail ?? '')}`, output === undefined ? undefined : shown(output)]
              .filter(Boolean)
              .join('\n')}
          </pre>
          {tool.exitCode !== undefined && tool.exitCode !== 0 && (
            <p className="text-fact text-text-2">
              O comando terminou com o código {tool.exitCode}.
            </p>
          )}
        </>
      )
    }
    case 'file': {
      const result = textOf(tool.result)
      const display = result !== undefined ? shown(result) : detail ? `$ cat ${detail}` : ''
      return <pre className={BLOCK}>{display}</pre>
    }
    case 'list': {
      const result = textOf(tool.result)
      return <pre className={BLOCK}>{result !== undefined ? shown(result) : (detail ?? '')}</pre>
    }
    case 'skill': {
      const name = fieldOf(tool.args, 'name') ?? fieldOf(tool.result, 'name')
      const instructions =
        fieldOf(tool.args, 'instructions') ??
        fieldOf(tool.result, 'instructions') ??
        (typeof tool.result === 'string' ? tool.result : undefined)
      return (
        <>
          {name && <div className="font-semibold text-text">{name}</div>}
          {instructions && <pre className={BLOCK}>{shown(instructions)}</pre>}
        </>
      )
    }
    case 'library': {
      const found = ToolSearchResult.safeParse(tool.result).data
      return found === undefined ? <Generic tool={tool} title={title} /> : <Library found={found} />
    }
    case 'answer': {
      const tested = TestedResult.safeParse(tool.result).data
      return tested?.kind === 'ANSWERED' ? (
        <Answer text={tested.text} called={tested.tools.length} />
      ) : (
        <Generic tool={tool} title={title} />
      )
    }
    case 'research':
      return <Research tool={tool} title={title} />
    case 'program':
      return <Program tool={tool} title={title} />
    default:
      return <Generic tool={tool} title={title} said={besideOf(tool, room)} />
  }
}

/** Where a connection that asks to be linked again is linked: Integrações. */
function Reconnect() {
  const companyId = useParams({ strict: false, select: (params) => params.companyId })
  if (companyId === undefined) return null
  return (
    <Link
      to="/companies/$companyId/integrations"
      params={{ companyId }}
      className="w-fit text-label underline"
    >
      Abrir Integrações
    </Link>
  )
}

/** The Assistant's shown file, a button that opens it beside the chat. */
function ShownLine(props: {
  file: Extract<ShownFile, { kind: 'TEXT' | 'FILE' }>
  /** The screen heard the call as it ran: the file opens by itself, once; a conversation read afterwards waits for the click. */
  live: boolean
}) {
  const { file } = props
  const room = useRoom()
  const open = useEffectEvent(() => room.openFile?.(file))
  useEffect(() => {
    if (props.live) open()
  }, [props.live])
  return (
    <Button
      aria-label={`Abrir ${file.name}`}
      aria-pressed={room.openedPath === file.path}
      onClick={() => room.openFile?.(file)}
      className="w-fit max-w-full"
    >
      <FileTextIcon aria-hidden="true" />
      <span className="truncate">{file.name}</span>
    </Button>
  )
}

/** The agent the Construtor saved: its line says so and, clicked, opens the draft beside the chat. */
function AgentLine({
  draft,
  sentence,
  live,
}: {
  draft: DraftRef
  sentence: string
  live: boolean
}) {
  const { agent } = draft
  const room = useRoom()
  // A call heard as it ran opens its draft; a conversation read afterwards opens the newest one. Only on
  // mount: a tap changes `openedAgent`, and that must not re-open the line's own agent.
  const open = useEffectEvent(() => {
    if (live || room.openedAgent === undefined) room.openAgent?.(agent.id, 'CALL')
  })
  useEffect(() => open(), [])
  return (
    <button
      type="button"
      aria-pressed={room.openedAgent === agent.id}
      onClick={() => room.openAgent?.(agent.id, 'TAP')}
      className="flex w-fit max-w-full min-w-0 cursor-pointer rounded-control text-left hover:text-text"
    >
      <TraceLine>
        <TraceIcon>
          <BotIcon />
        </TraceIcon>
        <TraceTitle className="shrink-0 whitespace-nowrap">{sentence}</TraceTitle>
        <TraceDescription className="min-w-0 truncate">{agent.name}</TraceDescription>
      </TraceLine>
    </button>
  )
}

function Body({ tool, status }: { tool: ToolItem; status: ToolStatus }) {
  const room = useRoom()
  const spec = specOf(tool.toolName, room)
  if (spec?.refusal?.(tool.result) === 'RECONNECT' || asksToReconnect(tool, room))
    return <Reconnect />
  if (spec?.refusal?.(tool.result) === 'DETAILED')
    return (
      <div className="flex min-w-0 flex-col gap-xs pt-xs">
        <Generic tool={tool} title={spec.failed} said={presentTool(tool, status, room).detail} />
      </div>
    )
  const body = spec?.body ?? 'generic'
  const edit = editOf(body, tool.args)
  const failed = status === 'error' || status === 'denied'
  return (
    <div className="flex min-w-0 flex-col gap-xs pt-xs">
      {failed && <Reason tool={tool} />}
      {edit !== undefined ? <Change edit={edit} /> : !failed && <Block tool={tool} body={body} />}
    </div>
  )
}

/** The rows that are not a line: the file the Assistant showed, and the app or the automation it proposed. */
function specialRow(tool: ToolItem, status: ToolStatus, room: Room) {
  const body = specOf(tool.toolName, room)?.body
  if (status !== 'done') return undefined
  const shown = body === 'shown' ? ShownFile.safeParse(tool.result).data : undefined
  if (shown !== undefined && shown.kind !== 'SHOW_REFUSED')
    return <ShownLine file={shown} live={tool.startedAt !== undefined} />
  const automation =
    body === 'automation' ? ProposedAutomation.safeParse(tool.result).data : undefined
  if (automation !== undefined)
    return room.automationCard?.({ proposed: automation, toolCallId: tool.toolCallId })
  const memory =
    body === 'companyMemory' ? ProposedCompanyMemory.safeParse(tool.result).data : undefined
  if (memory !== undefined)
    return room.companyMemoryCard?.({ proposed: memory, toolCallId: tool.toolCallId })
  const draft = body === 'agent' ? DraftRef.safeParse(tool.result).data : undefined
  if (draft !== undefined)
    return (
      <AgentLine
        draft={draft}
        sentence={specOf(tool.toolName, room)?.done ?? ''}
        live={tool.startedAt !== undefined}
      />
    )
  const proposed = body === 'proposal' ? ProposedApp.safeParse(tool.result).data : undefined
  return proposed === undefined
    ? undefined
    : room.appCard?.({
        proposed,
        toolCallId: tool.toolCallId,
        closed: tool.closed === true,
      })
}

/**
 * The line itself: the tool's icon, its sentence and, beside, its detail or the time it has run.
 * One line, as Mastra Studio's: the sentence never cut (step 12.1), the detail cut beside it
 * (founder, 2026-11-02); the open row says the detail whole.
 */
function ToolLine({
  presented,
  status,
  startedAt,
}: {
  presented: ReturnType<typeof presentTool>
  status: ToolStatus
  startedAt: ToolItem['startedAt']
}) {
  const failed = status === 'error' || status === 'denied'
  const lineStatus = failed ? 'error' : status === 'running' ? 'running' : undefined
  const side = presented.beside ? (
    <TraceDescription className="min-w-0 flex-1 shrink truncate text-right">
      {presented.detail}
    </TraceDescription>
  ) : status === 'running' ? (
    <Since at={startedAt} />
  ) : null
  return (
    <TraceLine status={lineStatus} className={cn(failed && !presented.beside && 'items-start')}>
      <TraceIcon className={failed && !presented.beside ? 'mt-1' : undefined}>
        <presented.icon />
      </TraceIcon>
      <TraceTitle
        className={
          presented.beside ? 'shrink-0 whitespace-nowrap' : cn(failed && 'whitespace-normal')
        }
      >
        {presented.sentence}
      </TraceTitle>
      {side}
    </TraceLine>
  )
}

/**
 * A line of tool invocation (Criterion 8).
 * Opens on the body its tool's row in the table names.
 */
export function ToolRow({ tool }: { tool: ToolItem }) {
  const room = useRoom()
  const status = toolStatus(tool, room)
  // Closed until the person opens it, running or not: the line already names the tool in progress.
  const [open, setOpen] = useState(false)
  const presented = presentTool(tool, status, room)
  const line = <ToolLine presented={presented} status={status} startedAt={tool.startedAt} />

  const special = specialRow(tool, status, room)
  if (special !== undefined) return special

  if (!opens(tool, status, room)) return line

  return (
    <TraceCollapsible open={open} onOpenChange={setOpen}>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent>
        <Body tool={tool} status={status} />
      </TraceCollapsibleContent>
    </TraceCollapsible>
  )
}
