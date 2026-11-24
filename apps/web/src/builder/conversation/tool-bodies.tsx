import type { FailureCode, ToolSearchResult } from '@conexus/hub-api'
import { FAILURES } from '@conexus/hub-api'
import { useState } from 'react'
import { ConnectorLogo } from '../../hub/connectors/public.ts'
import { sentenceOfCode } from '../../platform/hub.ts'
import { Button } from '../../ui/button.tsx'
import { cn } from '../../ui/cn.ts'
import { writtenBy } from './approval-item.ts'
import { thrownOf } from './connector-specs.ts'
import { ProgramSuccess } from './machine-specs.ts'
import { Markdown } from './markdown.tsx'
import { Researched, STOPPED } from './research-specs.ts'
import type { Room } from './room.ts'
import { useRoom } from './room.ts'
import type { ToolItem } from './rows.ts'
import { calledText, READY_TOOL, readRefusedText, refusedLabelText } from './text.ts'
import { shown } from './tool-args.ts'
import { specOf } from './tool-registry.ts'

export const BLOCK =
  'max-h-64 overflow-auto rounded-control bg-surface-3 p-sm font-mono text-fact text-text-2 whitespace-pre-wrap wrap-break-word'

export function textOf(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'string') return value === '' ? undefined : value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function Labelled({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-sans text-text-2">{label}</span>
      <pre className={BLOCK}>{shown(text)}</pre>
    </div>
  )
}

/** A call's arguments and result; `said` is what its line says beside the sentence, here whole. */
export function Generic({ tool, title, said }: { tool: ToolItem; title: string; said?: string }) {
  const args =
    typeof tool.args === 'object' && tool.args !== null && Object.keys(tool.args).length > 0
  const result = tool.result === undefined ? undefined : (textOf(tool.result) ?? '')
  return (
    <div className="flex min-w-0 flex-col gap-xs font-mono text-fact text-text-2">
      <div className="font-sans font-semibold text-text">{title}</div>
      {said !== undefined && <div className="font-sans text-text">{said}</div>}
      {args && <Labelled label="Argumentos:" text={textOf(tool.args) ?? ''} />}
      {result !== undefined && <Labelled label="Resultado:" text={result} />}
    </div>
  )
}

/**
 * A program the agent ran: only what it returned, and what it logged when it logged anything. Not
 * the program's code and not Mastra's envelope around the result (the founder, step 24.4 U5).
 */
export function Program({ tool, title }: { tool: ToolItem; title: string }) {
  const done = ProgramSuccess.safeParse(tool.result).data
  const result = textOf(done?.result)
  const logs = done?.logs?.map((line) => textOf(line) ?? '').join('\n')
  return (
    <div className="flex min-w-0 flex-col gap-xs font-mono text-fact text-text-2">
      <div className="font-sans font-semibold text-text">{title}</div>
      {result !== undefined && <Labelled label="Resultado:" text={result} />}
      {logs !== undefined && logs !== '' && <Labelled label="Registros:" text={logs} />}
    </div>
  )
}

function fieldOf(obj: unknown, key: string): string | undefined {
  if (obj && typeof obj === 'object' && key in obj) {
    const val = Reflect.get(obj, key)
    return typeof val === 'string' ? val : undefined
  }
  return undefined
}

/** A skill the model loaded: its name and its instructions, from the call or from its result. */
export function SkillBlock({ tool }: { tool: ToolItem }) {
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

type Copied = 'IDLE' | 'DONE' | 'FAILED'

/** The query a `data_query` ran, whole, and the button that copies it; `shown` would cut it at 800 characters. */
export function QueryBlock({ sql }: { sql: string }) {
  const [copied, setCopied] = useState<Copied>('IDLE')
  function copy() {
    return (navigator.clipboard?.writeText(sql) ?? Promise.reject(new Error('no clipboard'))).then(
      () => setCopied('DONE'),
      (cause: unknown) => {
        console.error('QUERY_NOT_COPIED', cause)
        setCopied('FAILED')
      },
    )
  }
  return (
    <>
      <pre className={BLOCK}>{sql}</pre>
      <div className="flex min-w-0 flex-wrap items-center gap-sm">
        <Button variant="ghost" size="sm" onClick={copy}>
          {copied === 'DONE' ? 'Consulta copiada' : 'Copiar a consulta'}
        </Button>
        {copied === 'FAILED' && (
          <p className="text-fact text-text-2">
            Não deu para copiar. Selecione a consulta e copie.
          </p>
        )}
      </div>
    </>
  )
}

/** What a library search found: one line per tool, with its connector's logo, its name and its version (or "pronta"). */
export function Library({ found }: { found: ToolSearchResult }) {
  const { connectors } = useRoom()
  const lines = [
    ...found.tools.map((one) => ({
      key: one.id,
      connectionId: one.connectionId,
      name: one.description,
      fact: `v${one.latest.number}`,
    })),
    ...found.ready.map((one) => ({
      key: `${one.connectionId}-${one.operation}`,
      connectionId: one.connectionId,
      name: one.label,
      fact: READY_TOOL,
    })),
  ]
  return (
    <ul className="m-0 flex min-w-0 list-none flex-col gap-xs p-0">
      {lines.map((line) => {
        const logo = connectors.logoOf(line.connectionId)
        return (
          <li key={line.key} className="flex min-w-0 items-center gap-sm">
            {logo !== undefined && <ConnectorLogo small entry={{ logo }} />}
            <span className="min-w-0 flex-1 truncate text-text">{line.name}</span>
            <span className="shrink-0 text-fact text-text-2">{line.fact}</span>
          </li>
        )
      })}
    </ul>
  )
}

/** The agent's answer to the Construtor's test question, and how many tools it called. */
export function Answer({ text, called }: { text: string; called: number }) {
  return (
    <div className="flex min-w-0 flex-col gap-xs">
      <Markdown text={text} />
      {called > 0 && <p className="text-fact text-text-2">{calledText(called)}</p>}
    </div>
  )
}

/** The findings of the helper that read: its message, or that the person stopped it, with what it had said. */
export function Research({ tool, title }: { tool: ToolItem; title: string }) {
  const content = Researched.safeParse(tool.result).data?.content
  if (content === undefined) return <Generic tool={tool} title={title} />
  if (!content.startsWith(STOPPED)) return <Markdown text={content} />
  const partial = content.slice(STOPPED.length).replace(/^\s*Partial output:\s*/, '')
  return (
    <div className="flex min-w-0 flex-col gap-xs">
      <p className="font-semibold text-text">Parada no meio</p>
      {partial.trim() !== '' && <Markdown text={partial} />}
    </div>
  )
}

function isFailureCode(code: string): code is FailureCode {
  return Object.hasOwn(FAILURES, code)
}

/** A tool that failed with the Hub's own code (the machine that would not start) says the code's sentence, not the code. */
function reasonOf(tool: ToolItem, room: Room): string {
  const text = tool.errorText ?? textOf(tool.result)
  if (text === undefined) return 'Ocorreu um erro ao executar a ferramenta.'
  const code = text.trim()
  if (!isFailureCode(code)) return text
  return specOf(tool.toolName, room)?.thrownText?.[code] ?? sentenceOfCode(code)
}

/** What an open row of a failed call says: a label and the system's message as it came. */
type FailureDetail = { label: string; message: string | undefined }

/**
 * What a failed agent tool says when opened, never the JSON it threw: a write the system refused says
 * so from the record's row (the outcome is the record's, never the model's text), and a read the system
 * refused says the system did, with its message. `null`: a failure with nothing to add to the line;
 * `undefined`: the call did not fail with a Hub failure, and the row keeps its own words.
 */
export function failureDetail(
  tool: Pick<ToolItem, 'toolName' | 'toolCallId' | 'errorText' | 'result' | 'isError'>,
  room: Room,
): FailureDetail | null | undefined {
  const saved = room.kind === 'SAVED_AGENT' ? room : undefined
  const write = saved?.writeOf(tool.toolName)
  if (saved !== undefined && write !== undefined) {
    const row = writtenBy(saved.writes, tool.toolCallId)
    if (row?.state === 'REFUSED') {
      return {
        label: refusedLabelText(room.connectors.name(write.connector)),
        message: row.message ?? undefined,
      }
    }
  }
  const thrown = thrownOf(tool)
  if (thrown === undefined) return undefined
  if (write !== undefined || thrown.status === null) return null
  const connector = saved?.connectorOf(tool.toolName)
  const system = connector === undefined ? 'sistema' : room.connectors.name(connector)
  return { label: readRefusedText(system), message: thrown.message ?? undefined }
}

/** Whether the agent's read failed with a kind that asks the person to link the connection again. */
export function asksToReconnect(tool: ToolItem, room: Room): boolean {
  const kind = thrownOf(tool)?.kind
  return kind !== undefined && specOf(tool.toolName, room)?.reconnects?.includes(kind) === true
}

export function Reason({ tool }: { tool: ToolItem }) {
  const room = useRoom()
  const detail = failureDetail(tool, room)
  if (detail === null) return null
  if (detail === undefined)
    return <pre className={cn(BLOCK, 'text-danger')}>{shown(reasonOf(tool, room))}</pre>
  return (
    <>
      <p className="font-semibold text-danger">{detail.label}</p>
      {detail.message !== undefined && (
        <pre className={cn(BLOCK, 'text-danger')}>{shown(detail.message)}</pre>
      )}
    </>
  )
}
