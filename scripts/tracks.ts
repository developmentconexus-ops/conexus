import { existsSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import type { Track } from './cli.ts'
import { STEP_CARD, trackOf } from './cli.ts'
import { runCommand } from './command.ts'

const CARDS = 'docs/steps/'

/**
 * The track a product file belongs to (delivery L1): the design track owns `DESIGN.md` and
 * `apps/web/src/{brand,ui}/`, the Assistant track `apps/server/src/builder/assistant/`, the pattern
 * track `packages/connectors/src/<provider>/`, and any other file of `apps/`, `packages/`, `tests/`
 * or `infra/` is the frontier's. Documents, skills, scripts and workflows belong to no track.
 */
function trackOfFile(file: string): Track | undefined {
  if (file === 'DESIGN.md' || /^apps\/web\/src\/(brand|ui)\//.test(file)) return 'design'
  if (file.startsWith('apps/server/src/builder/assistant/')) return 'assistant'
  if (/^packages\/connectors\/src\/[^/]+\//.test(file)) return 'pattern'
  return /^(apps|packages|tests|infra)\//.test(file) ? 'frontier' : undefined
}

/** The card files of `docs/steps/` at `root`, with the track each belongs to. */
export function cardsInConstruction(root: string, names: string[]): Map<string, Track> {
  return new Map(
    names
      .filter((name) => STEP_CARD.test(name))
      .map((name) => [name, trackOf(name, readFileSync(join(root, CARDS, name), 'utf8'))]),
  )
}

/**
 * The tracks a pull request touches: the track of each card it changes or deletes, read from the
 * base when the card is gone, and of each product file it changes (delivery L1, L20). A change of
 * the method alone touches none.
 */
export function tracksTouched(root: string, base: string): Set<Track> {
  const changed = runCommand('git', ['diff', '--name-only', '--no-renames', `${base}...HEAD`], {
    cwd: root,
  })
    .split('\n')
    .filter(Boolean)
  const tracks = new Set<Track>()
  for (const file of changed) {
    const isCard = file.startsWith(CARDS) && STEP_CARD.test(file.slice(CARDS.length))
    if (!isCard) {
      const track = trackOfFile(file)
      if (track !== undefined) tracks.add(track)
      continue
    }
    const text = existsSync(join(root, file))
      ? readFileSync(join(root, file), 'utf8')
      : runCommand('git', ['show', `${base}:${file}`], { cwd: root })
    tracks.add(trackOf(basename(file), text))
  }
  return tracks
}
