import { z } from 'zod'

const Child = z.object({ line: z.number(), column: z.number() })
const Entry = z.object({
  name: z.string(),
  children: z.array(Child),
  passed_on_attempt: z.number().optional().default(0),
})
const State = z.array(z.record(z.string(), Entry))

/**
 * The tests a second run took from red to green, read from the file `--test-rerun-failures` keeps
 * (Node 24.21): its last entry holds every test and suite that has passed, keyed `file:line:column`,
 * each with the attempt it passed on. A test inside a suite is named after the suite; a suite that
 * passed late with none of its tests late, as when a hook failed once, is reported by itself.
 */
export function flakyTests(stateText: string): { file: string; name: string }[] {
  const last = Object.entries(State.parse(JSON.parse(stateText)).at(-1) ?? {})
  const late = last.filter(([, entry]) => entry.passed_on_attempt > 0)
  const lateKeys = new Set(late.map(([key]) => key))
  const suiteOf = new Map<string, string>()
  for (const [key, entry] of last) {
    const file = key.replace(/:\d+:\d+$/, '')
    for (const child of entry.children)
      suiteOf.set(`${file}:${child.line}:${child.column}`, entry.name)
  }
  return late.flatMap(([key, entry]) => {
    const file = key.replace(/:\d+:\d+$/, '')
    const holdsLateTest = entry.children.some((child) =>
      lateKeys.has(`${file}:${child.line}:${child.column}`),
    )
    if (holdsLateTest) return []
    const suite = suiteOf.get(key)
    return [{ file, name: suite === undefined ? entry.name : `${suite} › ${entry.name}` }]
  })
}
