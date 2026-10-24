import type { ModelId } from '@conexus/hub-api'
import { FailureData, MachineData, NoticeData, RestartedData, VersionData } from '@conexus/hub-api'
import { ConexusMark } from '../../brand/mark.tsx'
import { hourOf } from '../../platform/dates.ts'
import { Bubble, BubbleContent } from '../../ui/bubble.tsx'
import { Message, MessageContent, MessageHeader } from '../../ui/message.tsx'
import { modelLabel } from '../model-accounts/public.ts'
import type { Row } from './fold.ts'
import { fold } from './fold.ts'
import {
  FailureLine,
  MachineLine,
  NoticeLine,
  RestartedLine,
  VersionLine,
} from './machine-line.tsx'
import { Markdown } from './markdown.tsx'
import { PersonBubble } from './person-turn.tsx'
import { PlanCard } from './plan-card.tsx'
import { QuestionCard } from './question-card.tsx'
import { ThinkingLine } from './thinking-line.tsx'
import { ToolGroup } from './tool-group.tsx'
import { ToolRow } from './tool-row.tsx'
import type { TranscriptItem } from './transcript.ts'

function ConexusPartRow({ item }: { item: Extract<TranscriptItem, { kind: 'conexus' }> }) {
  if (item.partType === 'data-conexus-machine') {
    const parsed = MachineData.safeParse(item.data)
    return parsed.success ? <MachineLine data={parsed.data} /> : null
  }
  if (item.partType === 'data-conexus-version') {
    const parsed = VersionData.safeParse(item.data)
    return parsed.success ? <VersionLine data={parsed.data} /> : null
  }
  if (item.partType === 'data-conexus-restarted') {
    const parsed = RestartedData.safeParse(item.data)
    return parsed.success ? <RestartedLine data={parsed.data} /> : null
  }
  if (item.partType === 'data-conexus-failure') {
    const parsed = FailureData.safeParse(item.data)
    return parsed.success ? <FailureLine data={parsed.data} /> : null
  }
  if (item.partType === 'data-conexus-notice') {
    const parsed = NoticeData.safeParse(item.data)
    return parsed.success ? <NoticeLine data={parsed.data} /> : null
  }
  return null
}

function ItemRow({ item, streaming }: { item: TranscriptItem; streaming: boolean }) {
  switch (item.kind) {
    case 'person':
      return <PersonBubble text={item.text} footer={hourOf(item.createdAt)} />
    case 'text':
      return (
        <Bubble variant="ghost">
          <BubbleContent>
            <Markdown text={item.text} streaming={streaming} />
          </BubbleContent>
        </Bubble>
      )
    case 'reasoning':
      return <ThinkingLine part={item} />
    case 'tool':
      return <ToolRow tool={item} />
    case 'card':
      return item.cardKind === 'question' ? <QuestionCard part={item} /> : <PlanCard part={item} />
    case 'conexus':
      return <ConexusPartRow item={item} />
    default:
      return item satisfies never
  }
}

function rowKey(row: Row, index: number): string {
  if (row.kind === 'group') {
    return `group-${row.tools[0]?.id ?? index}`
  }
  return row.item.id
}

/**
 * The Builder's turn (Criteria 8-12): mark, name, model badge, and its rows in arrival order.
 */
export function BuilderTurn(props: {
  items: readonly TranscriptItem[]
  model: ModelId | null
  streaming: boolean
}) {
  const rows = fold(props.items)

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
            part={{
              kind: 'reasoning',
              id: 'waiting',
              reasoning: '',
              seconds: null,
              streaming: true,
            }}
          />
        )}
        {rows.map((row, index) =>
          row.kind === 'group' ? (
            <ToolGroup
              key={rowKey(row, index)}
              tools={row.tools}
              working={props.streaming && index === rows.length - 1}
            />
          ) : (
            <ItemRow key={rowKey(row, index)} item={row.item} streaming={props.streaming} />
          ),
        )}
      </MessageContent>
    </Message>
  )
}
