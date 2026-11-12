import { z } from 'zod'

// 20 whole rows show the variation in real Sankhya rows; Factory lists 25.
const CUT_ROWS = 20
// A 50-column read measured 33 KB for 20 rows; 16 KB is about 4-5k tokens, between Mastra's 2k and Codex's 10k per tool output.
const CUT_BYTES = 16 * 1024
// A single row over the bytes loses its long text before any row is dropped: Mastra Factory read-tools.ts MAX_TEXT = 600 (:53, :57-59).
const MAX_TEXT = 600

/** Every read lists its rows in `linhas`; the page reads add `temMais`, the DbExplorer door `completo`. Whatever else a read sent is kept as it came. */
export const Listed = z.looseObject({
  linhas: z.array(z.unknown()),
  temMais: z.boolean().nullable().optional(),
})

function size(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value) ?? '')
}

/** Every string past `MAX_TEXT` cut with an ellipsis; false when nothing was cut. */
function shortened(value: unknown): { value: unknown; cut: boolean } {
  if (typeof value === 'string')
    return value.length > MAX_TEXT
      ? { value: `${value.slice(0, MAX_TEXT)}…`, cut: true }
      : { value, cut: false }
  if (Array.isArray(value)) {
    const parts = value.map(shortened)
    return { value: parts.map((part) => part.value), cut: parts.some((part) => part.cut) }
  }
  if (typeof value === 'object' && value !== null) {
    const parts = Object.entries(value).map(([key, one]) => [key, shortened(one)] as const)
    return {
      value: Object.fromEntries(parts.map(([key, part]) => [key, part.value])),
      cut: parts.some(([, part]) => part.cut),
    }
  }
  return { value, cut: false }
}

export type Shaped = { value: unknown; complete: boolean; rows: number; bytes: number }

function answer(value: unknown, complete: boolean, rows: number): Shaped {
  return { value, complete, rows, bytes: size(value) }
}

/**
 * What the model reads of a read (the tool's own paged answer, never a filter over Mastra's
 * output): up to 20 whole rows, long text cut, then rows dropped from the end, the last one too,
 * until the value is at most 16 KB. `rows` and `bytes` size what it reads. `complete` is false when either cut took something or the
 * provider said more exists. A value that is no list of rows has its long text cut, and so is a
 * list's other fields once no row is left; either is `null` when it still passes 16 KB.
 */
export function shaped(value: unknown): Shaped {
  const listed = Listed.safeParse(value)
  if (!listed.success) {
    const short = shortened(value)
    if (size(short.value) > CUT_BYTES) return answer(null, false, 0)
    return answer(short.value, !short.cut, 0)
  }
  let rows = listed.data.linhas.slice(0, CUT_ROWS)
  let complete = rows.length === listed.data.linhas.length && listed.data.temMais !== true
  function build(kept: unknown[]) {
    return { ...listed.data, linhas: kept }
  }
  if (size(build(rows)) > CUT_BYTES) {
    const short = shortened(rows)
    if (short.cut) complete = false
    rows = z.array(z.unknown()).parse(short.value)
  }
  while (rows.length > 0 && size(build(rows)) > CUT_BYTES) {
    rows = rows.slice(0, -1)
    complete = false
  }
  // The fields besides the rows are the model's too: past 16 KB without a single row, nothing of it passes.
  if (size(build(rows)) > CUT_BYTES) return answer(null, false, 0)
  return answer(build(rows), complete, rows.length)
}
