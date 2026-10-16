// Defect: two readers decide what a Conexus log line is and disagree (code C72). A line is one JSON
// object whose top level has exactly one `level`, a pino number (10, 20, 30, 40, 50 or 60, as the
// Hub logs it), and exactly one `msg`, a string that is a code (code C50, C54). Nothing else in the
// line is checked.
// Both entry points for a test's raw output call this: scripts/test-reporter.ts for an in-process
// test, and `startHub` in apps/server/src/platform/test-database.ts for a spawned Hub's pipes.
// Every refusal is planted in scripts/log-line.test.ts; "linha crua" in
// scripts/test-reporter.test.ts and apps/server/src/platform/test-database.test.ts prove both entry
// points call it. Its row in docs/reference/boundaries.md says when to revalidate it.

const CODE = /^[A-Z][A-Z0-9_]*$/
const PINO_LEVELS = new Set([10, 20, 30, 40, 50, 60])

export type LogLine = Record<string, unknown>

/**
 * The decoded keys of the object's own level, so a repeated key is seen, whether it is written
 * plain or with escapes, and a nested one is not; `JSON.parse` keeps only the last of a repeated
 * key. Each key literal is decoded by `JSON.parse` itself. Only valid JSON may reach it: every string in
 * valid JSON closes, so the scan ends.
 */
function topLevelKeys(json: string): string[] {
  const keys: string[] = []
  let depth = 0
  for (let i = 0; i < json.length; i++) {
    const char = json[i]
    if (char === '{' || char === '[') depth++
    else if (char === '}' || char === ']') depth--
    else if (char === '"') {
      let end = i + 1
      while (json[end] !== '"') end += json[end] === '\\' ? 2 : 1
      let after = end + 1
      while (/\s/.test(json[after] ?? '')) after++
      const key: unknown = JSON.parse(json.slice(i, end + 1))
      if (depth === 1 && json[after] === ':' && typeof key === 'string') keys.push(key)
      i = end
    }
  }
  return keys
}

function isRecord(value: unknown): value is LogLine {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseLogLine(text: string): LogLine | undefined {
  try {
    const line: unknown = JSON.parse(text)
    if (!isRecord(line)) return undefined
    const keys = topLevelKeys(text)
    for (const name of ['level', 'msg']) {
      if (keys.filter((key) => key === name).length !== 1) return undefined
    }
    const { level, msg } = line
    if (typeof level !== 'number' || !PINO_LEVELS.has(level)) return undefined
    return typeof msg === 'string' && CODE.test(msg) ? line : undefined
  } catch {
    return undefined
  }
}
