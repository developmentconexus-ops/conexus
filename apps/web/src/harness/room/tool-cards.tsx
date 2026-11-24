import {
  DraftRef,
  ProposedApp,
  ProposedAutomation,
  ProposedCompanyMemory,
  ShownFile,
} from '@conexus/hub-api'
import { BotIcon, FileTextIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { useEffect, useEffectEvent } from 'react'
import type { z } from 'zod'
import { Button } from '../../ui/button.tsx'
import { TraceDescription, TraceIcon, TraceLine, TraceTitle } from '../../ui/trace.tsx'
import type { OpenedFile, Room, RoomKind, RoomOf } from './room.ts'
import { isRoom } from './room.ts'
import type { ToolItem } from './rows.ts'
import type { ToolBody } from './tool-registry.ts'
import { specOf } from './tool-registry.ts'

/** The Assistant's shown file, a button that opens it beside the chat. */
function ShownLine(props: {
  file: OpenedFile
  /** The screen heard the call as it ran: the file opens by itself, once; a conversation read afterwards waits for the click. */
  live: boolean
  room: RoomOf<'ASSISTANT' | 'SAVED_AGENT'>
}) {
  const { file, room } = props
  const open = useEffectEvent(() => room.openFile(file))
  useEffect(() => {
    if (props.live) open()
  }, [props.live])
  return (
    <Button
      aria-label={`Abrir ${file.name}`}
      aria-pressed={room.openedPath === file.path}
      onClick={() => room.openFile(file)}
      className="w-fit max-w-full"
    >
      <FileTextIcon aria-hidden="true" />
      <span className="truncate">{file.name}</span>
    </Button>
  )
}

/** The agent the Construtor saved: its line says so and, clicked, opens the draft beside the chat. */
function AgentLine(props: {
  draft: DraftRef
  sentence: string
  live: boolean
  room: RoomOf<'AGENT_BUILDER'>
}) {
  const { draft, sentence, live, room } = props
  const { agent } = draft
  // A call heard as it ran opens its draft; a conversation read afterwards opens the newest one. Only on
  // mount: a tap changes `openedAgent`, and that must not re-open the line's own agent.
  const open = useEffectEvent(() => {
    if (live || room.openedAgent === undefined) room.openAgent(agent.id, 'CALL')
  })
  useEffect(() => open(), [])
  return (
    <button
      type="button"
      aria-pressed={room.openedAgent === agent.id}
      onClick={() => room.openAgent(agent.id, 'TAP')}
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

type CardCall = { toolCallId: string; toolName: string; live: boolean; closed: boolean }

type CardRow<K extends RoomKind, T> = {
  rooms: readonly K[]
  result: z.ZodType<T>
  draw: (value: T, call: CardCall, room: RoomOf<K>) => ReactNode
}

type Card = {
  draw: (result: unknown, call: CardCall, room: Room) => ReactNode | undefined
}

function card<K extends RoomKind, T>(row: CardRow<K, T>): Card {
  return {
    draw(result, call, room) {
      if (!isRoom(room, row.rooms)) return undefined
      const parsed = row.result.safeParse(result)
      return parsed.success ? row.draw(parsed.data, call, room) : undefined
    },
  }
}

/** The shown file the card opens: a refusal to show has no file to open. */
const OpenableFile = ShownFile.refine((file): file is OpenedFile => file.kind !== 'SHOW_REFUSED')

type CardBody = Extract<ToolBody, 'shown' | 'proposal' | 'automation' | 'companyMemory' | 'agent'>

/**
 * The cards a tool's result draws, by the body its row names, and the rooms that draw each; a call
 * in any other room draws the plain line. The question, the plan and the notebook's card are the
 * transcript's, not a tool's, and are drawn in every room.
 */
export const CARDS = {
  shown: card({
    rooms: ['ASSISTANT', 'SAVED_AGENT'],
    result: OpenableFile,
    draw: (file, call, room) => <ShownLine file={file} live={call.live} room={room} />,
  }),
  proposal: card({
    rooms: ['ASSISTANT'],
    result: ProposedApp,
    draw: (proposed, call, room) =>
      room.proposals.app({ proposed, toolCallId: call.toolCallId, closed: call.closed }),
  }),
  automation: card({
    rooms: ['ASSISTANT'],
    result: ProposedAutomation,
    draw: (proposed, call, room) =>
      room.proposals.automation({ proposed, toolCallId: call.toolCallId }),
  }),
  companyMemory: card({
    rooms: ['ASSISTANT'],
    result: ProposedCompanyMemory,
    draw: (proposed, call, room) =>
      room.proposals.companyMemory({ proposed, toolCallId: call.toolCallId }),
  }),
  agent: card({
    rooms: ['AGENT_BUILDER'],
    result: DraftRef,
    draw: (draft, call, room) => (
      <AgentLine
        draft={draft}
        sentence={specOf(call.toolName, room)?.done ?? ''}
        live={call.live}
        room={room}
      />
    ),
  }),
} satisfies Record<CardBody, Card>

function isCardBody(body: ToolBody | undefined): body is CardBody {
  return body !== undefined && Object.hasOwn(CARDS, body)
}

export function cardOf(tool: ToolItem, room: Room): ReactNode | undefined {
  const body = specOf(tool.toolName, room)?.body
  if (!isCardBody(body)) return undefined
  return CARDS[body].draw(
    tool.result,
    {
      toolCallId: tool.toolCallId,
      toolName: tool.toolName,
      live: tool.startedAt !== undefined,
      closed: tool.closed === true,
    },
    room,
  )
}
