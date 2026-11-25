import type { SkillFiles } from '@conexus/app/skills'
import { createSkill, validateSkillContent } from '@mastra/core/skills'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'

const Metadata = z.object({ name: z.string(), description: z.string() })

/** A skill of `@conexus/app/skills`, checked as Mastra checks a `SKILL.md` it loads (code C27). */
export function skillOf(files: SkillFiles) {
  const checked = validateSkillContent({ content: files.content, directoryName: files.directory })
  if (!checked.valid) {
    throw new Failure('INTERNAL_UNEXPECTED', {
      details: {
        reason: 'SKILL_INVALID',
        skill: files.directory,
        errors: checked.errors.join('; '),
      },
    })
  }
  const { name, description } = Metadata.parse(checked.metadata)
  const instructions = checked.instructions ?? ''
  return createSkill({ name, description, instructions, references: files.references })
}
