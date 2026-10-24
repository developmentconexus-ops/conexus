// Defect: `node --test --test-shard=N/4` splits the server's test files by their order, not by their
// time, so the four jobs took 181 to 437 s and the slowest held every pull request. Here the files go
// to the lightest shard longest first, by the seconds in server-test-seconds.json plus each file's
// start; a file the record lacks weighs the average of the others. `server-shards.ts 2/4` prints the files of the second shard
// of four, one per line and relative to apps/server, where `npm test` runs; `all` prints every file.
// `server-shards.ts --record <log>...` rewrites the record from the "Test files" tables that
// scripts/test-reporter.ts prints in the log of each shard's job: run it on the logs of one run of
// all four shards, since a file's time does not depend on the shard it ran in.
// The assignment is proved in server-shards.test.ts.
// Revalidate by 2027-04-20, or when the shards drift apart again.
import { globSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'

const RECORD = join(import.meta.dirname, 'server-test-seconds.json')
const USAGE = 'usage: server-shards.ts <index>/<total> | all | --record <log>...'
const Seconds = z.record(z.string(), z.number().positive())
// The record holds a file's tests; its process start and module load come on top, about 1.7 s a file
// in CI with the compile cache (run 40091617511: 1321 s of steps for 1100 s of file time, 127 files).
const FILE_START_SECONDS = 1.7

/** Each file goes, heaviest first, to the shard with the least seconds so far. */
export function shardsOf(
  files: string[],
  seconds: Record<string, number>,
  total: number,
): string[][] {
  const known = files.flatMap((file) => seconds[file] ?? [])
  const average = known.length === 0 ? 1 : known.reduce((a, b) => a + b, 0) / known.length
  function weight(file: string): number {
    return (seconds[file] ?? average) + FILE_START_SECONDS
  }
  const shards = Array.from({ length: total }, (): { files: string[]; load: number } => ({
    files: [],
    load: 0,
  }))
  const heaviest = files.toSorted((a, b) => weight(b) - weight(a) || a.localeCompare(b))
  for (const file of heaviest) {
    const lightest = shards.reduce((least, shard) => (shard.load < least.load ? shard : least))
    lightest.files.push(file)
    lightest.load += weight(file)
  }
  return shards.map((shard) => shard.files.toSorted())
}

/** The seconds of each file in the "Test files" tables of logs: `| 12.3 | src/hub/a.test.ts |`. */
export function secondsIn(logs: string[]): Record<string, number> {
  const seconds: Record<string, number> = {}
  for (const log of logs) {
    for (const line of log.split('\n')) {
      const row = /\| (\d+(?:\.\d+)?) \| (\S+\.test\.ts) \|\s*$/.exec(line)
      if (row?.[1] !== undefined && row[2] !== undefined) {
        seconds[row[2]] = Math.max(Number(row[1]), 0.1)
      }
    }
  }
  return seconds
}

function main(): void {
  const [first, ...rest] = process.argv.slice(2)
  if (first === '--record') {
    if (rest.length === 0) throw new Error(USAGE)
    const seconds = secondsIn(rest.map((log) => readFileSync(log, 'utf8')))
    const sorted = Object.fromEntries(
      Object.entries(seconds).toSorted(([a], [b]) => a.localeCompare(b)),
    )
    writeFileSync(RECORD, `${JSON.stringify(sorted, null, 2)}\n`)
    return
  }
  const files = globSync('src/**/*.test.ts', { cwd: process.cwd() }).toSorted()
  if (first === 'all' && rest.length === 0) return void console.log(files.join('\n'))
  const match = /^([1-9]\d*)\/([1-9]\d*)$/.exec(first ?? '')
  const index = Number(match?.[1])
  const total = Number(match?.[2])
  if (match === null || rest.length > 0 || index > total) throw new Error(USAGE)
  const seconds = Seconds.parse(JSON.parse(readFileSync(RECORD, 'utf8')))
  console.log((shardsOf(files, seconds, total)[index - 1] ?? []).join('\n'))
}

if (import.meta.main) main()
