/** A line of the difference, named by where it is on each side. */
export type DiffLine = { change: ' ' | '-' | '+'; text: string; place: string }

/**
 * The lines of `before` and `after` as one difference: the longest run of lines they share stays,
 * the rest is taken out or put in. Each side holds at most the 200 lines the Hub keeps of an edit
 * (`DETAIL_LIMITS.editLines`), so the table is small.
 */
export function lineDiff(before: string, after: string): DiffLine[] {
  const old = before.split('\n')
  const fresh = after.split('\n')
  const width = fresh.length + 1
  // shared[i * width + j]: how many lines old[i..] and fresh[j..] share, in order.
  const shared = new Array<number>((old.length + 1) * width).fill(0)
  function at(i: number, j: number): number {
    return shared[i * width + j] ?? 0
  }
  for (let i = old.length - 1; i >= 0; i--) {
    for (let j = fresh.length - 1; j >= 0; j--) {
      shared[i * width + j] =
        old[i] === fresh[j] ? at(i + 1, j + 1) + 1 : Math.max(at(i + 1, j), at(i, j + 1))
    }
  }
  const lines: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < old.length || j < fresh.length) {
    const left = old[i]
    const right = fresh[j]
    if (left !== undefined && left === right) {
      lines.push({ change: ' ', text: left, place: `${i}:${j}` })
      i++
      j++
    } else if (right === undefined || (left !== undefined && at(i + 1, j) >= at(i, j + 1))) {
      lines.push({ change: '-', text: left ?? '', place: `${i}:${j}` })
      i++
    } else {
      lines.push({ change: '+', text: right, place: `${i}:${j}` })
      j++
    }
  }
  return lines
}
