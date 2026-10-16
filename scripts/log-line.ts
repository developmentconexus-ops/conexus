// Defect: two readers decide what a Conexus log line is and disagree (code C72). A line is one JSON
// object with exactly one top-level `level` and a `msg` that is a code (code C50, C54).
// Both entry points for a test's raw output call this: scripts/test-reporter.ts for an in-process
// test, and `startHub` in apps/server/src/platform/test-database.ts for a spawned Hub's pipes.
// Proved through both by "linha crua" in scripts/test-reporter.test.ts and
// apps/server/src/platform/test-database.test.ts. Revalidate by 2027-04-13.

const CODE = /^[A-Z][A-Z0-9_]*$/

export type LogLine = Record<string, unknown>

/**
 * The keys of the object's own level, so a repeated `level` is seen and a nested one is not;
 * `JSON.parse` keeps only the last of a repeated key. Only valid JSON may reach it: every string in
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
      if (depth === 1 && json[after] === ':') keys.push(json.slice(i + 1, end))
      i = end
    }
  }
  return keys
}

export function parseLogLine(text: string): LogLine | undefined {
  try {
    const parsed: unknown = JSON.parse(text)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return undefined
    if (topLevelKeys(text).filter((key) => key === 'level').length !== 1) return undefined
    const line: LogLine = Object.fromEntries(Object.entries(parsed))
    return CODE.test(String(line.msg)) ? line : undefined
  } catch {
    return undefined
  }
}
