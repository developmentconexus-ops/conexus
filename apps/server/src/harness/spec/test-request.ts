import type { TestContext } from 'node:test'
import { turnDate } from './speakers.ts'

/**
 * What changes from one run to the next and nothing else: a uuid (Mastra's and the Anthropic
 * double's `toolu_<uuid>`); an id of 32 hex digits, as the Hub makes one (`hub/projects/projects.ts:112`)
 * and the test database names itself (`platform/test-database.ts:180`); and the 8 hex digits of the
 * Chat Completions double's `call_` id.
 */
const RUN_ID =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|(?<![0-9a-f])[0-9a-f]{32}(?![0-9a-f])|(?<=\bcall_)[0-9a-f]{8}\b/g

/**
 * The judge's message, as Mastra writes it after `isTaskComplete` refuses: its `Duration: <n>ms` line is
 * the wall time the scorers took (`@mastra/core` 1.86.0 `dist/run-registry-Bx06ZIN_.js:65033`,
 * `:65093`, written at `:65386-65404` by `formatStreamCompletionFeedback`, called at `:80217`). Firstmate, 2026-11-23: only that value.
 */
const JUDGED = '#### Completion Check Results'
const JUDGE_DURATION = /^Duration: \d+ms$/m

/**
 * A connector read's result, as the model reads it: `at` is the instant its answer came back
 * (`connectors/connector-tools.ts:238`), and `file` is named by the first 8 characters of the turn's
 * uuid key (`assistant/connector-access.ts:19`, `spec/turns.ts:146`). Firstmate, 2026-11-23:
 * a value that changes every run is marked only in its shape; the instant's zone, the company's, stays.
 */
const READ_AT = /"at":"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(Z|[+-]\d{2}:\d{2})"/g
const READ_FILE = /\breads\/[0-9a-f]{8}-(\d+)\.json\b/g
/** A saved agent as a tool's result gives it: `updatedAt` is its row's `now()` (`agents/store.ts:99`). */
const UPDATED_AT = /"updatedAt":"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z"/g

/** Today with its weekday, as the prompts write it (`speakers.ts`), and alone. */
function todayIn(text: string): string {
  const today = turnDate()
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(
    new Date(`${today}T12:00:00Z`),
  )
  return text
    .replaceAll(`${today} (${weekday})`, '<today> (<weekday>)')
    .replaceAll(today, '<today>')
}

/**
 * A model call as its snapshot keeps it: the whole body, with each uuid, the turn's date and weekday
 * and each tool call id the double gave as numbered marks; the judge's duration, a read's instant, the
 * turn in its file's name and a saved agent's `updatedAt` as their marks; and each text with a line
 * break as its lines.
 */
export function requestOf(body: unknown): unknown {
  const marks = new Map<string, string>()
  function marked(id: string): string {
    const known = marks.get(id)
    if (known !== undefined) return known
    const mark = `<id-${marks.size + 1}>`
    marks.set(id, mark)
    return mark
  }
  function textOf(text: string): string {
    const judged = text.startsWith(JUDGED)
      ? text.replace(JUDGE_DURATION, 'Duration: <duration>ms')
      : text
    const read = judged
      .replace(READ_AT, '"at":"<read-at>$1"')
      .replace(READ_FILE, 'reads/<turn>-$1.json')
      .replace(UPDATED_AT, '"updatedAt":"<updated-at>"')
    return todayIn(read.replace(RUN_ID, marked))
  }
  function kept(value: unknown): unknown {
    if (typeof value === 'string') {
      const text = textOf(value)
      return text.includes('\n') ? text.split('\n') : text
    }
    if (Array.isArray(value)) return value.map(kept)
    if (typeof value === 'object' && value !== null) {
      return Object.fromEntries(
        Object.entries(value).map(([key, each]) => [textOf(key), kept(each)]),
      )
    }
    return value
  }
  return kept(body)
}

/** Every call of the turn, in order, against the scenario's snapshot (`t.assert.fileSnapshot`). */
export function sameRequests(
  t: TestContext,
  bodies: readonly unknown[],
  snapshotPath: string,
): void {
  t.assert.fileSnapshot(bodies.map(requestOf), snapshotPath)
}
