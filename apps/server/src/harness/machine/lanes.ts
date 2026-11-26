/** Work of one line runs one after another, in the order asked (code C65); other lines run beside it. */
export function createLanes<Line>() {
  const lanes = new Map<Line, Promise<unknown>>()
  return function inLane<T>(line: Line, work: () => Promise<T>): Promise<T> {
    const run = Promise.allSettled([lanes.get(line)]).then(work)
    const settled = Promise.allSettled([run])
    lanes.set(line, settled)
    void settled.then(() => {
      if (lanes.get(line) === settled) lanes.delete(line)
    })
    return run
  }
}
