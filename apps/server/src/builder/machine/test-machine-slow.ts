import { createReadStream } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
import type { Control } from './test-machine.ts'

/** A file sent in 64 KiB chunks, `chunkMs` apart, until the read's signal aborts it. */
export async function* slowly(control: Control, path: string, signal: AbortSignal | undefined) {
  for await (const chunk of createReadStream(path, { highWaterMark: 65_536 })) {
    try {
      await sleep(control.chunkMs, undefined, { signal })
    } catch (error) {
      control.readsCut += 1
      throw error
    }
    yield chunk
  }
}
