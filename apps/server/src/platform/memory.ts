import { getHeapStatistics } from 'node:v8'
import type { FailureLog, Scalar } from './failure.ts'

/** Once a minute: a climb to the heap's limit shows in the log before the process dies. */
const MEMORY_EVERY_MS = 60_000

const MIB = 1024 * 1024

/** The Hub's heap used, its limit and its resident memory, in MiB (`HUB_MEMORY`). */
export function logMemory(log: FailureLog, fields: Record<string, Scalar> = {}): void {
  const heap = getHeapStatistics()
  log.info(
    {
      ...fields,
      heapUsedMib: Math.round(heap.used_heap_size / MIB),
      heapLimitMib: Math.round(heap.heap_size_limit / MIB),
      rssMib: Math.round(process.memoryUsage.rss() / MIB),
    },
    'HUB_MEMORY',
  )
}

/** Logs the memory each minute until the process ends; the timer never keeps it alive. */
export function watchMemory(log: FailureLog): void {
  setInterval(() => logMemory(log), MEMORY_EVERY_MS).unref()
}
