import { LakeRun, LakeRunMachine, LakeTableName, SystemMessage } from '@conexus/hub-api'
import type { lakeRun } from './tables.ts'

type RunRow = typeof lakeRun.$inferSelect

/** What a round carried: the sums of its tables' counts, or one table's own, and whether the read was whole. */
export type RunCarried = Readonly<{ read: number; written: number; whole: boolean }>

const MachineSamples = LakeRunMachine.pick({ everySeconds: true, samples: true })

function machineOf(row: RunRow) {
  if (
    row.cpuAllocated === null ||
    row.memoryAllocatedMib === null ||
    row.cpuPeak === null ||
    row.memoryPeakMib === null
  )
    return null
  const series = MachineSamples.parse(row.machineSamples)
  return {
    allocated: { vcpu: row.cpuAllocated, memoryMib: row.memoryAllocatedMib },
    peak: { vcpu: row.cpuPeak, memoryMib: row.memoryPeakMib },
    ...series,
  }
}

/**
 * A round as the contract states it, the one place a `lake_run` row becomes a `LakeRun` (C21): open
 * is `RUNNING`; a closed one carries its counts, and an error its code, its table and the answer of
 * the system.
 */
export function runViewOf(row: RunRow, carried: RunCarried): LakeRun {
  const base = { id: row.id, startedAt: row.startedAt.toISOString(), whole: carried.whole }
  if (row.endedAt === null || row.outcome === null)
    return LakeRun.parse({ ...base, outcome: 'RUNNING' })
  const ended = {
    ...base,
    endedAt: row.endedAt.toISOString(),
    read: carried.read,
    written: carried.written,
    machine: machineOf(row),
  }
  switch (row.outcome) {
    case 'COMPLETE':
    case 'INTERRUPTED':
      return LakeRun.parse({ ...ended, outcome: row.outcome })
    case 'ERROR':
      return LakeRun.parse({
        ...ended,
        outcome: 'ERROR',
        code: row.code,
        failedTable: row.failedTable === null ? null : LakeTableName.parse(row.failedTable),
        system:
          row.systemStatus === null && row.systemCode === null && row.systemMessage === null
            ? null
            : SystemMessage.parse({
                status: row.systemStatus,
                code: row.systemCode,
                message: row.systemMessage,
              }),
      })
    default:
      return row.outcome satisfies never
  }
}
