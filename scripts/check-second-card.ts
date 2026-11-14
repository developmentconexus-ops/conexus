// Defect: a second step card of one track waits in docs/steps/ beside the one in construction
// (delivery L5). A draft pull request may hold it, and CONEXUS_DRAFT says whether this one is.
// This is waiting for the process, not broken code, so CI reports it in its own check, `processo`.
// Refusals are proved by planting each one in check-second-card.test.ts.
// Revalidate by 2027-04-13, or when the track list in delivery L5 changes.
import { existsSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { cardsInConstruction } from './tracks.ts'

const root = resolve(process.argv[2] ?? '.')
const draft = process.env.CONEXUS_DRAFT === 'true'
const stepsDir = join(root, 'docs/steps')

const byTrack = new Map<string, string[]>()
for (const [name, track] of cardsInConstruction(
  root,
  existsSync(stepsDir) ? readdirSync(stepsDir) : [],
)) {
  byTrack.set(track, [...(byTrack.get(track) ?? []), `docs/steps/${name}`])
}
const problems = [...byTrack]
  .filter(([, list]) => list.length > 1 && !draft)
  .map(([track, list]) => `second-card: docs/steps: ${track}: ${list.join(', ')}`)
if (problems.length > 0) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log('check-second-card: one card per track')
