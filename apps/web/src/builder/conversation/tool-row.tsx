import type { FailureCode } from '@conexus/hub-api'
import {
  ConstrutorResult,
  FAILURES,
  ProposedApp,
  ProposedAutomation,
  ShownFile,
  TestedResult,
  ToolSearchResult,
} from '@conexus/hub-api'
import { Link, useParams } from '@tanstack/react-router'
import { FileTextIcon } from 'lucide-react'
import { useEffect, useEffectEvent, useState } from 'react'
import { sentenceOfCode } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { Card, CardContent, CardFooter } from '../../ui/card.tsx'
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
import { useSecondsSince } from './elapsed.ts'
import type { Room } from './room.ts'
import { useRoom } from './room.ts'
import type { ToolItem } from './rows.ts'
import { durationOf } from './text.ts'
import type { Edit } from './tool-args.ts'
import { editOf, shown } from './tool-args.ts'
import { Answer, BLOCK, Generic, Library, textOf } from './tool-bodies.tsx'
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
  // A refusal the Assistant's tool answered is said by its line; only a connection to link again has more to say.
  const refusal = specOf(tool.toolName, room)?.refusal?.(tool.result)
  if (refusal !== undefined) return refusal === 'RECONNECT'
  if (status === 'error' || status === 'denied') return true
  if (tool.output !== undefined && tool.output.length > 0) return true
  if (tool.result !== undefined && tool.result !== null) return true
  return (
    tool.args !== undefined &&
    tool.args !== null &&
    typeof tool.args === 'object' &&
    Object.keys(tool.args).length > 0
  )
}

function isFailureCode(code: string): code is FailureCode {
  return Object.hasOwn(FAILURES, code)
}

/** A tool that failed with the Hub's own code (the machine that would not start) says the code's sentence, not the code. */
function reasonOf(tool: ToolItem): string {
  const text = tool.errorText ?? textOf(tool.result)
  if (text === undefined) return 'Ocorreu um erro ao executar a ferramenta.'
  const code = text.trim()
  return isFailureCode(code) ? sentenceOfCode(code) : text
}

function Reason({ tool }: { tool: ToolItem }) {
  return <pre className={cn(BLOCK, 'text-danger')}>{shown(reasonOf(tool))}</pre>
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
    default:
      return <Generic tool={tool} title={title} />
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

/** The Assistant's proposal: the request it summarized, and **Criar app**. */
function ProposalCard({ summary }: { summary: string }) {
  const room = useRoom()
  return (
    <Card>
      <CardContent>
        <p className="whitespace-pre-wrap break-words text-text">{summary}</p>
      </CardContent>
      <CardFooter>
        <Button variant="primary" onClick={() => room.createApp?.(summary)}>
          Criar app
        </Button>
      </CardFooter>
    </Card>
  )
}

function Body({ tool, status }: { tool: ToolItem; status: ToolStatus }) {
  const spec = specOf(tool.toolName, useRoom())
  if (spec?.refusal?.(tool.result) === 'RECONNECT') return <Reconnect />
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
function specialRow(tool: ToolItem, status: ToolStatus, room: Room, plain: boolean) {
  const body = specOf(tool.toolName, room)?.body
  if (status !== 'done') return undefined
  const shown = body === 'shown' ? ShownFile.safeParse(tool.result).data : undefined
  if (shown !== undefined && shown.kind !== 'SHOW_REFUSED')
    return <ShownLine file={shown} live={tool.startedAt !== undefined} />
  const automation =
    body === 'automation' ? ProposedAutomation.safeParse(tool.result).data : undefined
  if (automation !== undefined)
    return room.automationCard?.({ proposed: automation, toolCallId: tool.toolCallId })
  const agent = body === 'agent' ? ConstrutorResult.safeParse(tool.result).data : undefined
  if (agent !== undefined && !plain) return room.agentCard?.(agent)
  const proposed = body === 'proposal' ? ProposedApp.safeParse(tool.result).data : undefined
  return proposed === undefined ? undefined : <ProposalCard summary={proposed.summary} />
}

/** The line itself: the tool's icon, its sentence and, beside, its detail or the time it has run. */
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
    <TraceDescription className="min-w-0 shrink flex-1 truncate text-right">
      {presented.detail}
    </TraceDescription>
  ) : status === 'running' ? (
    <Since at={startedAt} />
  ) : null
  return (
    <TraceLine status={lineStatus} className={failed ? 'items-start' : undefined}>
      <TraceIcon className={failed ? 'mt-1' : undefined}>
        <presented.icon />
      </TraceIcon>
      <TraceTitle
        className={cn(
          presented.beside && 'shrink-0 whitespace-nowrap',
          failed && 'whitespace-normal',
        )}
      >
        {presented.sentence}
      </TraceTitle>
      {side}
    </TraceLine>
  )
}

/**
 * A line of tool invocation (Criterion 8).
 * Opens on the body its tool's row in the table names. `plain` keeps a draft's card out of the row:
 * a later call of the same answer drew it.
 */
export function ToolRow({ tool, plain = false }: { tool: ToolItem; plain?: boolean }) {
  const room = useRoom()
  const status = toolStatus(tool, room)
  // Only a command that is still saying its output shows it as it comes; the person's click rules after.
  const [chosen, setChosen] = useState<boolean>()
  const open = chosen ?? (status === 'running' && tool.output !== undefined)
  const line = (
    <ToolLine
      presented={presentTool(tool, status, room)}
      status={status}
      startedAt={tool.startedAt}
    />
  )

  const special = specialRow(tool, status, room, plain)
  if (special !== undefined) return special

  if (!opens(tool, status, room)) return line

  return (
    <TraceCollapsible open={open} onOpenChange={setChosen}>
      <TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
      <TraceCollapsibleContent>
        <Body tool={tool} status={status} />
      </TraceCollapsibleContent>
    </TraceCollapsible>
  )
}
