import { z } from 'zod'

const Child = z.object({ line: z.number(), column: z.number(), name: z.string() })
const Entry = z.object({
  name: z.string(),
  children: z.array(Child),
  passed_on_attempt: z.number().optional().default(0),
})
const State = z.array(z.record(z.string(), Entry))

// `file:line:column`, and `file:line:column:(n)` for the n-th test a loop makes at the same place.
const KEY = /^(.*):(\d+):(\d+)(?::\(\d+\))?$/

/** A test's own identity within a run: where its code is and what it is called. */
function identity(file: string, line: number | string, column: number | string, name: string) {
  return JSON.stringify([file, Number(line), Number(column), name])
}

/**
 * The tests a second run took from red to green, read from the file `--test-rerun-failures` keeps
 * (Node 24.21): its last entry holds every test and suite that has passed, keyed `file:line:column`
 * (with `:(n)` after it for a test a loop makes at the same place), each with the attempt it passed
 * on. A test is named by its file and name, never by its line or its place in a loop, so the same
 * test is the same record when the code above it moves. A test inside a suite is named after the
 * suite, unless two suites hold a test of that name at that place; a suite that passed late with
 * none of its tests late, as when a hook failed once, is reported by itself.
 */
export function flakyTests(stateText: string): { file: string; name: string }[] {
  const last = Object.entries(State.parse(JSON.parse(stateText)).at(-1) ?? {}).flatMap(
    ([key, entry]) => {
      const found = KEY.exec(key)
      if (found === null) return []
      const [, file = '', line = '', column = ''] = found
      return [{ file, id: identity(file, line, column, entry.name), entry }]
    },
  )
  const late = last.filter(({ entry }) => entry.passed_on_attempt > 0)
  const lateIds = new Set(late.map(({ id }) => id))
  const suitesOf = new Map<string, Set<string>>()
  for (const { file, entry } of last)
    for (const child of entry.children) {
      const id = identity(file, child.line, child.column, child.name)
      suitesOf.set(id, (suitesOf.get(id) ?? new Set()).add(entry.name))
    }
  return late.flatMap(({ file, id, entry }) => {
    const holdsLateTest = entry.children.some((child) =>
      lateIds.has(identity(file, child.line, child.column, child.name)),
    )
    if (holdsLateTest) return []
    const suites = [...(suitesOf.get(id) ?? [])]
    const [suite] = suites
    return [{ file, name: suites.length === 1 ? `${suite} › ${entry.name}` : entry.name }]
  })
}
