import { createReadStream } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

/** What of the provider's control a slow read needs: its pace, and the count of reads cut. */
type Pace = { chunkMs: number; readsCut: number }

/** A file sent in 64 KiB chunks, `chunkMs` apart, until the read's signal aborts it. */
export async function* slowly(control: Pace, path: string, signal: AbortSignal | undefined) {
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
