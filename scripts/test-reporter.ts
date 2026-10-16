// Defect: a suite that ran zero tests reports green, a skipped test hides without saying why
// (testing T4), and a line a test process prints outside the log format reaches nobody (code C50,
// C54): a library that prints by itself, such as better-call's `# SERVER_ERROR`, or a Node warning.
// Everything else is the spec reporter's output. A spawned Hub's pipes reach no reporter, so
// `startHub` in apps/server/src/platform/test-database.ts holds the same line rule for them, both
// through `parseLogLine` in scripts/log-line.ts.
// The refusals are proved by planting each one in test-reporter.test.ts.
// Revalidate by 2027-04-13, or when Node changes the test event stream.
import { Readable } from 'node:stream'
import type { TestEvent } from 'node:test/reporters'
import { spec } from 'node:test/reporters'
import { parseLogLine } from './log-line.ts'

function isLogLine(line: string): boolean {
  return parseLogLine(line) !== undefined
}

async function* watched(source: AsyncIterable<TestEvent>): AsyncGenerator<TestEvent, void> {
  const pending = new Map<string, string>()
  for await (const event of source) {
    if (event.type === 'test:stdout' || event.type === 'test:stderr') {
      const key = `${event.type} ${event.data.file ?? ''}`
      const lines = `${pending.get(key) ?? ''}${event.data.message}`.split('\n')
      pending.set(key, lines.pop() ?? '')
      for (const line of lines.filter((text) => text.trim() !== '')) {
        if (!isLogLine(line)) {
          process.stderr.write(`raw-output: ${event.data.file ?? ''}: ${line}\n`)
          process.exitCode = 1
        }
      }
    }
    if (event.type === 'test:pass' && event.data.skip !== undefined && event.data.skip !== false) {
      const reason = typeof event.data.skip === 'string' ? event.data.skip : ''
      if (!reason.startsWith('opt-in:')) {
        process.stderr.write(`skip-without-opt-in: ${event.data.name}\n`)
        process.exitCode = 1
      }
    }
    if (event.type === 'test:pass' && event.data.name === event.data.file) {
      process.stderr.write(`zero-tests: no test ran in ${event.data.file}\n`)
      process.exitCode = 1
    }
    if (
      event.type === 'test:summary' &&
      event.data.file === undefined &&
      event.data.counts.tests === 0
    ) {
      process.stderr.write(`zero-tests: no test ran\n`)
      process.exitCode = 1
    }
    yield event
  }
  for (const [key, rest] of pending) {
    if (rest.trim() !== '' && !isLogLine(rest)) {
      process.stderr.write(`raw-output: ${key}: ${rest}\n`)
      process.exitCode = 1
    }
  }
}

export default async function* testReporter(source: AsyncIterable<TestEvent>) {
  yield* Readable.from(watched(source)).compose(spec())
}
