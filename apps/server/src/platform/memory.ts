import { monitorEventLoopDelay, performance } from 'node:perf_hooks'
import { getHeapStatistics } from 'node:v8'
import type { FailureLog, Scalar } from './failure.ts'

/** Once a minute: a climb to the heap's limit shows in the log before the process dies. */
const MEMORY_EVERY_MS = 60_000

const MIB = 1024 * 1024
const NS_PER_MS = 1_000_000

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

/**
 * The event loop's delay at its 99th percentile and the process's share of one CPU since the last
 * call (step 24.3): the signals of when the agents outgrow one process, measured as the load study's
 * `bench/measure.ts` did.
 */
function minuteMeter(): () => Record<string, Scalar> {
  const delay = monitorEventLoopDelay()
  delay.enable()
  let cpu = process.cpuUsage()
  let at = performance.now()
  return () => {
    const used = process.cpuUsage(cpu)
    const now = performance.now()
    const fields = {
      loopDelayP99Ms: Math.round(delay.percentile(99) / NS_PER_MS),
      cpuPercent: Math.round((used.user + used.system) / 10 / (now - at)),
    }
    delay.reset()
    cpu = process.cpuUsage()
    at = now
    return fields
  }
}

/** Logs the memory, the loop's delay and the CPU each minute until the process ends; the timer never keeps it alive. */
export function watchMemory(log: FailureLog): void {
  const minute = minuteMeter()
  setInterval(() => logMemory(log, minute()), MEMORY_EVERY_MS).unref()
}
