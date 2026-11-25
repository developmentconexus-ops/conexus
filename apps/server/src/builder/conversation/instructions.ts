import { CHECK_LIMITS } from '@conexus/app/check'
import { readSkills } from '@conexus/app/skills'
import type { CompanyId, ProjectId } from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import { APP_FOLDER } from '../../harness/machine/public.ts'
import { chosenModel } from '../../harness/model-accounts/public.ts'
import { skillOf, turnDate } from '../../harness/spec/public.ts'
import type { GrantedConnection } from '../../harness/tools/public.ts'
import { dataOrder } from '../../harness/tools/public.ts'
import { Failure } from '../../platform/failure.ts'
import type { Runs } from '../runs/public.ts'
import {
  connectionsContext,
  fillPrompt,
  MODEL_KNOWLEDGE_CUTOFFS,
  projectContext,
} from './prompt/prompt.ts'

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
  /** The Projeto's granted connections for the turn, read once for the run's tools, skills and these instructions. */
  granted: (requestContext: RequestContext) => Promise<readonly GrantedConnection[]>
}) {
  return async ({ requestContext }: { requestContext: RequestContext }): Promise<string> => {
    const ids = await deps.projectOf(requestContext)
    if (ids === undefined) {
      throw new Failure('INTERNAL_UNEXPECTED', {
        details: { reason: 'PROMPT_WITHOUT_CONVERSATION' },
      })
    }
    const [projectName, context, granted] = await Promise.all([
      deps.projectName(ids),
      projectContext(deps.runs.repositoryOf(ids)),
      deps.granted(requestContext),
    ])
    if (projectName === undefined) {
      throw new Failure('INTERNAL_UNEXPECTED', { details: { reason: 'PROMPT_PROJECT_GONE' } })
    }
    const modelId = chosenModel(requestContext)
    const prompt = fillPrompt({
      ...context,
      projectName,
      date: turnDate(),
      cutoff: Object.hasOwn(MODEL_KNOWLEDGE_CUTOFFS, modelId)
        ? (MODEL_KNOWLEDGE_CUTOFFS[modelId] ?? null)
        : null,
      appFolder: APP_FOLDER,
      checks: CHECK_LIMITS.checks,
      connections: connectionsContext(granted),
    })
    return `${prompt}\n\n${dataOrder()}`
  }
}

/**
 * The Builder's skills (card of step 14, U7), held in the server as inline skills: read through the
 * skill tools, never written into the machine.
 */
export const APP_SKILLS = readSkills().map(skillOf)
