import type { MessagePart, ModelId } from '@conexus/hub-api'
import { CircleAlertIcon, InfoIcon } from 'lucide-react'
import { ConexusMark } from '../../brand/mark.tsx'
import { sentenceOfCode } from '../../platform/hub.ts'
import { Bubble, BubbleContent } from '../../ui/bubble.tsx'
import { Marker, MarkerContent, MarkerIcon } from '../../ui/marker.tsx'
import { Message, MessageContent, MessageHeader } from '../../ui/message.tsx'
import { modelLabel } from '../model-accounts/public.ts'
import type { Row } from './fold.ts'
import { fold } from './fold.ts'
import { MachineLine, RestartedLine, VersionLine } from './machine-line.tsx'
import { Markdown } from './markdown.tsx'
import { ShellOutput } from './shell-output.tsx'
import { ThinkingLine } from './thinking-line.tsx'
import { ToolGroup } from './tool-group.tsx'
import { ToolRow } from './tool-row.tsx'

function PartRow(props: { part: MessagePart; streaming: boolean }) {
  const { part } = props
  switch (part.type) {
    case 'text':
      return (
        <Bubble variant="ghost">
          <BubbleContent>
            <Markdown text={part.text} streaming={props.streaming} />
          </BubbleContent>
        </Bubble>
      )
    case 'reasoning':
      return <ThinkingLine part={part} />
    case 'tool':
      return <ToolRow tool={part} />
    case 'shell':
      return <ShellOutput part={part} />
    case 'machine':
      return <MachineLine key={part.phase} part={part} />
    case 'version':
      return <VersionLine part={part} />
    case 'restarted':
      return <RestartedLine part={part} />
    case 'file':
      return null
    case 'notice':
      return (
        <Marker className="text-text">
          <MarkerIcon>
            <InfoIcon />
          </MarkerIcon>
          <MarkerContent>{part.text}</MarkerContent>
        </Marker>
      )
    case 'failure':
      return (
        <Marker role="alert" className="text-danger">
          <MarkerIcon>
            <CircleAlertIcon />
          </MarkerIcon>
          <MarkerContent>{sentenceOfCode(part.code)}</MarkerContent>
        </Marker>
      )
    default:
      return part satisfies never
  }
}

function keyOf(row: Row, at: number): string {
  if (row.kind === 'group') return `group:${row.tools[0]?.id}`
  if ('id' in row.part) return row.part.id
  return 'toolId' in row.part ? `${row.part.type}:${row.part.toolId}` : `${row.part.type}:${at}`
}

/**
 * The Builder's turn: its mark, name and model, then its rows in the order they came. The last
 * row of an answer still arriving is the one at work.
 */
export function BuilderTurn(props: {
  parts: readonly MessagePart[]
  model: ModelId | null
  streaming: boolean
}) {
  const rows = fold(props.parts)
  return (
    <Message>
      <MessageContent>
        <MessageHeader>
          <ConexusMark size={16} />
          <span className="font-semibold text-text">Conexus</span>
          {props.model !== null && (
            <span className="min-w-0 truncate rounded-pill bg-surface-3 px-sm py-xs">
              {modelLabel(props.model)}
            </span>
          )}
        </MessageHeader>
        {rows.length === 0 && props.streaming && (
          <ThinkingLine
            part={{ type: 'reasoning', id: 'waiting', state: 'running', seconds: null }}
          />
        )}
        {rows.map((row, at) =>
          row.kind === 'group' ? (
            <ToolGroup
              key={keyOf(row, at)}
              tools={row.tools}
              working={props.streaming && at === rows.length - 1}
            />
          ) : (
            <PartRow key={keyOf(row, at)} part={row.part} streaming={props.streaming} />
          ),
        )}
      </MessageContent>
    </Message>
  )
}
