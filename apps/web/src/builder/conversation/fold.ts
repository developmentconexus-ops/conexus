import { MachineData } from '@conexus/hub-api'
import type { ToolItem, TranscriptItem } from './rows.ts'
import { specOf } from './tool-registry.ts'

export type Row = { kind: 'item'; item: TranscriptItem } | { kind: 'group'; tools: ToolItem[] }

const TOOL_GROUP_MIN = 3

function isMachine(item: TranscriptItem): boolean {
  return item.kind === 'conexus' && item.partType === 'data-conexus-machine'
}

function isSending(item: TranscriptItem): boolean {
  return (
    item.kind === 'conexus' &&
    item.partType === 'data-conexus-machine' &&
    MachineData.safeParse(item.data).data?.phase === 'sending'
  )
}

function isPreview(item: TranscriptItem): boolean {
  return item.kind === 'conexus' && item.partType === 'data-conexus-preview'
}

/**
 * The rows of a turn. The send's step is told in the machine's one line, which sits at the turn's
 * head, but it follows the version the turn saved: it closes the turn until the Prévia says how it went.
 */
export function fold(all: readonly TranscriptItem[]): Row[] {
  const sending = all.some(isPreview) ? [] : all.filter(isSending)
  const items = sending.length > 0 ? all.filter((item) => !isSending(item)) : all
  const rows = foldSteps(items)
  for (const item of sending) rows.push({ kind: 'item', item })
  return rows
}

function foldSteps(items: readonly TranscriptItem[]): Row[] {
  const rows: Row[] = []
  let run: ToolItem[] = []

  function close() {
    if (run.length >= TOOL_GROUP_MIN) {
      rows.push({ kind: 'group', tools: run })
    } else {
      for (const t of run) {
        rows.push({ kind: 'item', item: t })
      }
    }
    run = []
  }

  // A machine's step says what the turn waits for, until anything else comes.
  const said = items.some((item) => !isMachine(item))
  for (const item of items) {
    if (isMachine(item) && said) {
      continue
    }

    if (item.kind === 'tool') {
      if (specOf(item.toolName)?.groups ?? true) {
        run.push(item)
      } else {
        close()
        rows.push({ kind: 'item', item })
      }
    } else {
      close()
      rows.push({ kind: 'item', item })
    }
  }

  close()
  return rows
}
