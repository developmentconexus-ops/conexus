import { existsSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import type { Track } from './cli.ts'
import { STEP_CARD, trackOf } from './cli.ts'
import { runCommand } from './command.ts'

const CARDS = 'docs/steps/'

function trackOfFile(file: string): Track | undefined {
  if (file === 'DESIGN.md' || /^apps\/web\/src\/(brand|ui)\//.test(file)) return 'design'
  if (file.startsWith('apps/server/src/builder/assistant/')) return 'assistant'
  if (/^packages\/connectors\/src\/[^/]+\//.test(file)) return 'pattern'
  return /^(apps|packages|tests|infra)\//.test(file) ? 'frontier' : undefined
}

export function cardsInConstruction(root: string, names: string[]): Map<string, Track> {
  return new Map(
    names
      .filter((name) => STEP_CARD.test(name))
      .map((name) => [name, trackOf(name, readFileSync(join(root, CARDS, name), 'utf8'))]),
  )
}

export function tracksAffected(root: string, base: string, inConstruction: Set<Track>): Set<Track> {
  const touched = tracksTouched(root, base)
  return touched.size > 0 ? touched : inConstruction
}

function tracksTouched(root: string, base: string): Set<Track> {
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
