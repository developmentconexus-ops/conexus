import { CircleAlertIcon } from 'lucide-react'
import { useState } from 'react'
import {
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '../../ui/trace.tsx'
import { useSecondsShown } from './elapsed.ts'
import { durationOf } from './text.ts'
import { bareToolName, presentTool, prettifyToolName } from './tool-presentation.ts'
import type { ToolItem } from './transcript.ts'

const BLOCK =
  'max-h-64 overflow-auto rounded-control bg-surface-3 p-sm font-mono text-fact text-text-2 whitespace-pre-wrap wrap-break-word'

function formatValue(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function Running() {
  const seconds = useSecondsShown()
  return (
    <TraceDescription aria-hidden="true" className="shrink-0 text-fact">
      ({durationOf(seconds)})
    </TraceDescription>
  )
}

function isRunning(state: ToolItem['state']): boolean {
  return state === 'call' || state === 'partial-call'
}

function isFailed(tool: ToolItem): boolean {
  return tool.isError === true || tool.state === 'output-error' || tool.state === 'output-denied'
}

function hasSomethingToOpen(tool: ToolItem): boolean {
  if (isFailed(tool)) return true
  if (tool.output !== undefined && tool.output.length > 0) return true
  if (tool.result !== undefined && tool.result !== null) return true
  if (
    tool.args !== undefined &&
    tool.args !== null &&
    typeof tool.args === 'object' &&
    Object.keys(tool.args).length > 0
  ) {
    return true
  }
  return false
}

function getStringProp(obj: unknown, key: string): string | undefined {
  if (obj && typeof obj === 'object' && key in obj) {
    const val = Reflect.get(obj, key)
    return typeof val === 'string' ? val : undefined
  }
  return undefined
}

function ToolIcon({ tool }: { tool: ToolItem }) {
  const failed = isFailed(tool)
  const presentation = presentTool(tool.toolName, tool.args, {
    isRunning: isRunning(tool.state),
    isError: failed,
    isDenied: tool.state === 'output-denied',
  })
  const Icon = failed ? CircleAlertIcon : presentation.icon
  return (
    <TraceIcon>
      <Icon />
    </TraceIcon>
  )
}

function ToolFileContent({ tool, hasCut }: { tool: ToolItem; hasCut?: boolean }) {
  const content =
    typeof tool.result === 'string' ? tool.result : getStringProp(tool.result, 'content')
  const path = getStringProp(tool.args, 'path')
  const display = content !== undefined ? content : path ? `$ cat ${path}` : ''
  return (
    <div className="flex min-w-0 flex-col gap-xs pt-xs">
      <pre className={BLOCK}>
        {display}
        {hasCut ? '\n…' : ''}
      </pre>
    </div>
  )
}

function ToolCommandContent({ tool, hasCut }: { tool: ToolItem; hasCut?: boolean }) {
  const command = getStringProp(tool.args, 'command') ?? ''
  const output = tool.output ?? formatValue(tool.result)
  return (
    <div className="flex min-w-0 flex-col gap-xs pt-xs">
      <pre className={BLOCK}>
        {[`$ ${command}`, ...(hasCut ? ['…'] : []), output].filter(Boolean).join('\n')}
      </pre>
      {tool.exitCode !== undefined && tool.exitCode !== 0 && (
        <p className="text-fact text-text-2">O comando terminou com o código {tool.exitCode}.</p>
      )}
    </div>
  )
}

function ToolGenericContent({ tool }: { tool: ToolItem }) {
  const readable = prettifyToolName(tool.toolName)
  const hasArgs =
    tool.args !== undefined &&
    tool.args !== null &&
    typeof tool.args === 'object' &&
    Object.keys(tool.args).length > 0

  return (
    <div className="flex min-w-0 flex-col gap-xs pt-xs font-mono text-fact text-text-2">
      <div className="font-sans font-semibold text-text">{readable}</div>
      {hasArgs && (
        <div className="flex flex-col gap-xxs">
          <span className="font-sans text-text-2">Argumentos:</span>
          <pre className={BLOCK}>{formatValue(tool.args)}</pre>
        </div>
      )}
      {tool.result !== undefined && (
        <div className="flex flex-col gap-xxs">
          <span className="font-sans text-text-2">Resultado:</span>
          <pre className={BLOCK}>{formatValue(tool.result)}</pre>
        </div>
      )}
    </div>
  )
}

function OpenedContent({ tool }: { tool: ToolItem }) {
  const bare = bareToolName(tool.toolName)
  const cuts = tool.cuts
  const hasCut = cuts && cuts.length > 0

  if (isFailed(tool)) {
    const errorText =
      getStringProp(tool.result, 'error') ??
      getStringProp(tool.result, 'message') ??
      (typeof tool.result === 'string' ? tool.result : undefined) ??
      'Ocorreu um erro ao executar a ferramenta.'
    return (
      <div className="flex min-w-0 flex-col gap-xs pt-xs">
        <pre className={BLOCK}>{errorText}</pre>
      </div>
    )
  }

  if (bare === 'read_file' || bare === 'view') {
    return <ToolFileContent tool={tool} hasCut={hasCut} />
  }

  if (['list_files', 'find_files', 'grep', 'search_content', 'search'].includes(bare)) {
    const display =
      tool.result !== undefined
        ? formatValue(tool.result)
        : (getStringProp(tool.args, 'path') ?? getStringProp(tool.args, 'pattern') ?? '')
    return (
      <div className="flex min-w-0 flex-col gap-xs pt-xs">
        <pre className={BLOCK}>{display}</pre>
      </div>
    )
  }

  if (bare === 'skill' || bare === 'skill_read') {
    const name = getStringProp(tool.args, 'name') ?? getStringProp(tool.result, 'name')
    const instructions =
      getStringProp(tool.args, 'instructions') ??
      getStringProp(tool.result, 'instructions') ??
      (typeof tool.result === 'string' ? tool.result : undefined)
    return (
      <div className="flex min-w-0 flex-col gap-xs pt-xs">
        {name && <div className="font-semibold text-text">{name}</div>}
        {instructions && <pre className={BLOCK}>{instructions}</pre>}
      </div>
    )
  }

  if (bare === 'execute_command') {
    return <ToolCommandContent tool={tool} hasCut={hasCut} />
  }

  return <ToolGenericContent tool={tool} />
}

/**
 * A line of tool invocation (Criterion 8).
 * Opens on arguments and results per tool kind.
 */
export function ToolRow({ tool }: { tool: ToolItem }) {
  const running = isRunning(tool.state)
  const failed = isFailed(tool)
  const presentation = presentTool(tool.toolName, tool.args, {
    isRunning: running,
    isError: failed,
    isDenied: tool.state === 'output-denied',
  })
  const opens = hasSomethingToOpen(tool)
  const [open, setOpen] = useState(running)

  if (!opens) {
    return (
      <TraceLine status={presentation.status}>
        <ToolIcon tool={tool} />
        <TraceTitle>{presentation.sentence}</TraceTitle>
        {running && <Running />}
      </TraceLine>
    )
  }

  return (
    <TraceCollapsible open={open} onOpenChange={setOpen}>
      <TraceCollapsibleTrigger>
        <TraceLine status={presentation.status}>
          <ToolIcon tool={tool} />
          <TraceTitle>{presentation.sentence}</TraceTitle>
          {running && <Running />}
        </TraceLine>
      </TraceCollapsibleTrigger>
      <TraceCollapsibleContent>
        <OpenedContent tool={tool} />
      </TraceCollapsibleContent>
    </TraceCollapsible>
  )
}
