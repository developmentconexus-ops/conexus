import { CHECK_LIMITS } from '@conexus/app/check'
import type { SkillFiles } from '@conexus/app/skills'
import { readSkills } from '@conexus/app/skills'
import type { CompanyId, ProjectId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import { createSkill, validateSkillContent } from '@mastra/core/skills'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'
import { APP_FOLDER } from '../machine/public.ts'
import { chosenModel } from '../model-accounts/public.ts'
import type { Runs } from '../runs/public.ts'
import { fillPrompt, MODEL_KNOWLEDGE_CUTOFFS, projectContext, turnDate } from './prompt/prompt.ts'

type ProjectIds = { companyId: CompanyId; projectId: ProjectId }

/**
 * The Builder's instructions as a function of the turn (Conexus OS `e0353c36`
 * `harness/prompt.ts:61-66`): resolved again on each call of the agent, a resumed one included,
 * with the Projeto's name, today, the model's cutoff and what `main` holds.
 */
export function builderInstructions(deps: {
  runs: Pick<Runs, 'repositoryOf'>
  /** The Projeto of the conversation the run is, read before the run takes it (`turnOf`). */
  projectOf: (requestContext: RequestContext) => Promise<ProjectIds | undefined>
  projectName: (ids: ProjectIds) => Promise<string | undefined>
}) {
  return async ({ requestContext }: { requestContext: RequestContext }): Promise<string> => {
    const ids = await deps.projectOf(requestContext)
    if (ids === undefined) {
      throw new Failure('INTERNAL_UNEXPECTED', {
        details: { reason: 'PROMPT_WITHOUT_CONVERSATION' },
      })
    }
    const [projectName, context] = await Promise.all([
      deps.projectName(ids),
      projectContext(deps.runs.repositoryOf(ids)),
    ])
    if (projectName === undefined) {
      throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'PROMPT_PROJECT_GONE' } })
    }
    const modelId = chosenModel(requestContext)
    return fillPrompt({
      ...context,
      projectName,
      date: turnDate(),
      cutoff: Object.hasOwn(MODEL_KNOWLEDGE_CUTOFFS, modelId)
        ? (MODEL_KNOWLEDGE_CUTOFFS[modelId] ?? null)
        : null,
      appFolder: APP_FOLDER,
      checks: CHECK_LIMITS.checks,
    })
  }
}

const Metadata = z.object({ name: z.string(), description: z.string() })

/** A skill of `@conexus/app/skills`, checked as Mastra checks a `SKILL.md` it loads (code C27). */
function skillOf(files: SkillFiles) {
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

/**
 * The Builder's skills (card of step 14, U7), held in the server as inline skills: read through the
 * skill tools, never written into the machine.
 */
export const APP_SKILLS = readSkills().map(skillOf)
