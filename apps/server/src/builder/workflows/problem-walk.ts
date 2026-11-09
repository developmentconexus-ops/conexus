import type { Balloon, Path, WorkflowProblem } from '@conexus/hub-api'

/** One balloon of the draft where it lives: its path in the document, and what the balloons around it let it see. */
export type Spot = Readonly<{
  balloon: Balloon
  /** `balloons.3.then.0`: the document path of the balloon, to which a field is appended. */
  path: string
  /** Pre-order position in the whole document: the order the person reads it. */
  order: number
  /** The ids a value of this balloon may read: the balloons before it in its list and in every list around it. */
  seen: ReadonlySet<string>
  /** The containers this balloon sits inside. */
  inside: readonly Balloon[]
  /** The balloon right before it in its own list; none for the first. */
  previous: Balloon | null
}>

function listsOf(balloon: Balloon, path: string): { list: Path; path: string }[] {
  switch (balloon.kind) {
    case 'IF':
      return [
        { list: balloon.then, path: `${path}.then` },
        { list: balloon.else, path: `${path}.else` },
      ]
    case 'PARALLEL':
      return balloon.paths.map((list, index) => ({ list, path: `${path}.paths.${index}` }))
    case 'FOREACH':
    case 'LOOP':
      return [{ list: balloon.body, path: `${path}.body` }]
    default:
      return []
  }
}

/** Every balloon of the draft, the ones inside a path too, in the order a person reads them. */
export function spotsOf(balloons: Path): Spot[] {
  const spots: Spot[] = []
  function visit(
    list: Path,
    base: string,
    seen: ReadonlySet<string>,
    inside: readonly Balloon[],
  ): void {
    const before = new Set(seen)
    list.forEach((balloon, index) => {
      const path = `${base}.${index}`
      spots.push({
        balloon,
        path,
        order: spots.length,
        seen: new Set(before),
        inside,
        previous: list[index - 1] ?? null,
      })
      for (const child of listsOf(balloon, path)) {
        visit(child.list, child.path, before, [...inside, balloon])
      }
      before.add(balloon.id)
    })
  }
  visit(balloons, 'balloons', new Set(), [])
  return spots
}

/** A problem at a balloon, by its path and the field it names; the sentence names the balloon by its title. */
export function problemAt(
  code: WorkflowProblem['code'],
  spot: Spot,
  field: string | null,
  message: string,
): WorkflowProblem {
  const path = field === null ? spot.path : `${spot.path}.${field}`
  return { code, severity: 'ERROR', balloonId: spot.balloon.id, path, message }
}
