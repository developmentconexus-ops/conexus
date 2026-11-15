import type { ModelId } from '@conexus/hub-api'
import type { LanguageModel, MastraModelConfig } from '@mastra/core/llm'
import type { RequestContext } from '@mastra/core/request-context'
import { Failure } from '../../platform/failure.ts'
import { callFailureOf } from './errors.ts'
import type { QueueDeps } from './queue.ts'
import { callModel, providerOf } from './queue.ts'
import type { Picked, Turn } from './turn.ts'
import { chosenModel, turnIn } from './turn.ts'

/** A model the queue answers with when no account is left: it fails here and calls no one. */
function noAccountConfig(modelId: ModelId) {
  function fail(): Promise<never> {
    return Promise.reject(new Failure('MODEL_NO_ACCOUNT'))
  }
  return {
    specificationVersion: 'v2',
    provider: providerOf(modelId),
    modelId,
    supportedUrls: {},
    doGenerate: fail,
    doStream: fail,
  } as const
}

export function noAccountModel(modelId: ModelId) {
  return callModel(noAccountConfig(modelId))
}

/** Mastra's own calls in a turn that are not the agent's: what the log names a failed one by. */
export type SideCall = 'title' | 'observer' | 'reflection' | 'subagent'

/**
 * The model with its failures logged by call and account, since Mastra's own log line carries
 * neither and its message is not ours to keep (security S41). The error is thrown on, to Mastra.
 */
export function watched(
  deps: QueueDeps,
  turn: Turn,
  account: Picked,
  call: SideCall,
  stepMs?: number,
): LanguageModel {
  const model = account.models.system
  if (typeof model === 'string' || model.specificationVersion !== 'v3') return model
  function report(error: unknown): never {
    const fields = { companyId: turn.companyId, accountId: account.id, call }
    deps.log.info({ ...fields, failure: callFailureOf(error).kind }, 'MODEL_SIDE_CALL_FAILED')
    throw error
  }
  type Options = Parameters<typeof model.doGenerate>[0]
  // A call with a budget gives up when the budget ends or the caller stops it, whichever is first.
  function budgeted(options: Options): Options {
    if (stepMs === undefined) return options
    const budget = AbortSignal.timeout(stepMs)
    return {
      ...options,
      abortSignal:
        options.abortSignal === undefined ? budget : AbortSignal.any([options.abortSignal, budget]),
    }
  }
  return {
    specificationVersion: 'v3',
    provider: model.provider,
    modelId: model.modelId,
    supportedUrls: model.supportedUrls,
    id: model.id,
    doGenerate: (options: Options) =>
      Promise.resolve(model.doGenerate(budgeted(options))).catch(report),
    doStream: (options: Options) =>
      Promise.resolve(model.doStream(budgeted(options))).catch(report),
  }
}

/**
 * The name the subagent's definition carries as its model: Mastra refuses a subagent with none
 * (`createSubagentTool`), and `subagentModel` ignores the name that reaches it.
 */
export const TURN_ACCOUNT = 'conexus/turn-account'

/**
 * The model of a subagent (U12): the account the turn is calling now, taken from the copy of the
 * run's context the subagent gets, so its calls go to the company's credential and its failures
 * are logged as `subagent`. No rotation and no notice: a failure is the tool's error to the main
 * agent. Without a turn or an account it fails at once and calls no one. Whatever model id the
 * main agent wrote is ignored. Each model call has the step's budget (`stepMs`).
 */
export function subagentModel(deps: QueueDeps, stepMs: number) {
  return (_name: string, options: { requestContext?: RequestContext }): MastraModelConfig => {
    const turn = turnIn(options.requestContext)
    const account = turn?.calling()
    if (turn === undefined || account === undefined) {
      return noAccountConfig(chosenModel(options.requestContext))
    }
    return watched(deps, turn, account, 'subagent', stepMs)
  }
}
