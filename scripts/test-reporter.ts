// Defect: a suite that ran zero tests reports green, and a skipped test hides without saying why
// (testing T4). Everything else is the spec reporter's output.
// The refusals are proved by planting each one in test-reporter.test.ts.
// Revalidate by 2027-04-13, or when Node changes the test event stream.
import { Readable } from 'node:stream'
import type { TestEvent } from 'node:test/reporters'
import { spec } from 'node:test/reporters'

async function* watched(source: AsyncIterable<TestEvent>): AsyncGenerator<TestEvent, void> {
  for await (const event of source) {
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
}

export default async function* testReporter(source: AsyncIterable<TestEvent>) {
  yield* Readable.from(watched(source)).compose(spec())
}
