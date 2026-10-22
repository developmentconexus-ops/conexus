import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** The Builder's skills (card of step 14, U7): one folder each, its `SKILL.md` and its references. */
export const SKILLS_DIR = fileURLToPath(new URL('../skills', import.meta.url))

/** A skill as its folder holds it: the folder's name, the `SKILL.md` text, and each reference by file name. */
export type SkillFiles = Readonly<{
  directory: string
  content: string
  references: Readonly<Record<string, string>>
}>

/** Every skill of `SKILLS_DIR`, read from disk; the server makes them inline skills, so none is written into a machine. */
export function readSkills(): SkillFiles[] {
  return readdirSync(SKILLS_DIR)
    .sort()
    .map((directory) => {
      const folder = join(SKILLS_DIR, directory)
      const referencesDir = join(folder, 'references')
      const names = existsSync(referencesDir) ? readdirSync(referencesDir).sort() : []
      const references = Object.fromEntries(
        names.map((name) => [name, readFileSync(join(referencesDir, name), 'utf8')]),
      )
      return { directory, content: readFileSync(join(folder, 'SKILL.md'), 'utf8'), references }
    })
}
