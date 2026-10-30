import { readdirSync, readFileSync } from 'node:fs'

/** The skill as its folder holds it: `SKILL.md`, and each part of `references/` by file name. */
export function readSkill(folder: URL) {
  const references = new URL('references/', folder)
  return {
    content: readFileSync(new URL('SKILL.md', folder), 'utf8'),
    references: Object.fromEntries(
      readdirSync(references)
        .sort()
        .map((name) => [name, readFileSync(new URL(name, references), 'utf8')]),
    ),
  }
}
