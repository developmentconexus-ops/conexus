import { MachineData, machinePhaseLasts } from '@conexus/hub-api'
import { specOf } from './tool-registry.ts'
import type { ToolItem, TranscriptItem } from './transcript-items.ts'

export type Row = { kind: 'item'; item: TranscriptItem } | { kind: 'group'; tools: ToolItem[] }

const TOOL_GROUP_MIN = 3

function isMachine(item: TranscriptItem): boolean {
  return item.kind === 'conexus' && item.partType === 'data-conexus-machine'
}

function checkMachineLasts(item: TranscriptItem): boolean {
  if (item.kind !== 'conexus' || !isMachine(item)) return true
  const parsed = MachineData.safeParse(item.data)
  return parsed.success && machinePhaseLasts(parsed.data.phase)
}

export function fold(items: readonly TranscriptItem[]): Row[] {
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

  // A machine's step that does not last says what the turn waits for, until anything else comes.
  const said = items.some((item) => !isMachine(item))
  for (const item of items) {
    if (isMachine(item) && said && !checkMachineLasts(item)) {
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
