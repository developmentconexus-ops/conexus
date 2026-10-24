import type { ModelId } from '@conexus/hub-api'
import type { MessageList } from '@mastra/core/agent'
import type { LanguageModel } from '@mastra/core/llm'
import { parseModelString } from '@mastra/core/llm'
import type {
  ErrorProcessor,
  InputProcessor,
  ProcessAPIErrorArgs,
  ProcessInputStepArgs,
  ProcessInputStepResult,
} from '@mastra/core/processors'
import {
  CyberRefusalHandler,
  defaultStabilityErrorProcessors,
  StreamErrorRetryProcessor,
} from '@mastra/core/processors'
import type { RequestContext } from '@mastra/core/request-context'
import { z } from 'zod'
import { Failure } from '../../platform/failure.ts'
import type { AccountFailure } from './errors.ts'
import { callFailureOf } from './errors.ts'
import { nextModels } from './fallback.ts'
import type { QueueDeps } from './queue.ts'
import { callModel, markAccount, pickAccount, providerName, providerOf } from './queue.ts'
import type { ProviderOptions } from './thinking.ts'
import { providerOptionsOf } from './thinking.ts'
import type { Notice, Picked, Turn } from './turn.ts'
import { chosenModel, NOTICE_PART, turnIn } from './turn.ts'

/** At most ten calls for one question, as Claude Code and Codex (founder, card reading 7). */
export const MAX_PROCESSOR_RETRIES = 9
const WEB_SEARCH = 'web_search'
/** The steps one turn may take (card, limits); Mastra's own ceiling is a thousand. */
const TURN_STEPS = 100
const LAST_STEP =
  'This is the last step of this turn: use no tool. Say in Brazilian Portuguese what you did and what is left, and that the person can answer "continue" for more.'

/** On the last step the model is given no tool and one sentence on why, so the turn ends in text, never in `abort()`. */
function lastStep(args: ProcessInputStepArgs): ProcessInputStepResult {
  if (args.stepNumber !== TURN_STEPS - 1) return {}
  return {
    toolChoice: 'none',
    systemMessages: [...args.systemMessages, { role: 'system', content: LAST_STEP }],
  }
}

type Writer = ProcessAPIErrorArgs['writer']

type InfoEvent = { type: 'info'; message: string }
const ControllerEvents = z.object({
  emitEvent: z.custom<(event: InfoEvent) => void>((value) => typeof value === 'function'),
})

type Notifier = { requestContext?: RequestContext }

/**
 * A notice the person reads, said live as the controller's `info` event, since a live `data-*`
 * chunk is dropped (`session-run-engine.ts:1580`), as Mastra Code does
 * (`account-rotation-processor.ts:390-406`), and kept on the turn for its answer (`keepNotices`).
 */
function notify(args: Notifier, turn: Turn, kind: Notice['kind'], text: string) {
  turn.notices.push({ kind, text })
  const controller = ControllerEvents.safeParse(args.requestContext?.get('controller'))
  if (controller.success) controller.data.emitEvent({ type: 'info', message: text })
}

/**
 * The turn's end when its accounts ran out, with the notice that says so: the reason the last
 * account was lost (refused, in its limit) when the turn saw one, else that none is left.
 */
function exhaust(args: Notifier, turn: Turn, modelId: ModelId, reason: string | undefined) {
  turn.finish('exhausted')
  const provider = providerName(providerOf(modelId))
  const text =
    reason === undefined
      ? `As contas ${provider} que você pode usar estão indisponíveis. Escolha outro modelo ou fale com quem administra a empresa.`
      : `${reason}.`
  notify(args, turn, 'accounts-exhausted', text)
}

function refusedText(label: string) {
  return `${label} foi recusada. Ligue de novo`
}

/**
 * Writes into the answer the turn's notices it does not hold yet, as data parts Mastra saves with
 * the answer and leaves out of the prompt (`sanitizeV5UIMessages`). A retried attempt is rolled
 * back with what was written in it (`rollbackToStepBoundary`), so the attempt that answers, or the
 * one that ends the turn, writes them again: the answer holds each notice once, in order.
 */
async function keepNotices(args: { writer?: Writer; messageList: MessageList }, turn: Turn) {
  const kept = args.messageList.get.response
    .db()
    .flatMap((message) => message.content.parts)
    .filter((part) => part.type === NOTICE_PART).length
  for (const data of turn.notices.slice(kept)) {
    await args.writer?.custom({ type: NOTICE_PART, data })
  }
}

const TIME = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  hour: '2-digit',
  minute: '2-digit',
})

function until(date: Date): string {
  return TIME.format(date).replace(':', 'h')
}

/** A model the queue answers with when no account is left: it fails here and calls no one. */
function noAccountModel(modelId: ModelId) {
  function fail(): Promise<never> {
    return Promise.reject(new Failure('MODEL_NO_ACCOUNT'))
  }
  return callModel({
    specificationVersion: 'v2',
    provider: providerOf(modelId),
    modelId,
    supportedUrls: {},
    doGenerate: fail,
    doStream: fail,
  })
}

/** The accounts refused as they were opened (a subscription's refresh), said with the next one. */
function sayRefused(args: Notifier, turn: Turn, next: Picked) {
  for (const label of turn.unsaid.splice(0)) {
    const text = `${refusedText(label)}; continuei pela ${next.label}.`
    notify(args, turn, 'account-switched', text)
  }
}

/**
 * The account for the turn's next attempt: in its model's queue, then in each next model of the
 * company's automatic switch, with its notice; none left, the turn ends with the notice that the
 * accounts ended.
 */
async function chooseAccount(deps: QueueDeps, turn: Turn, args: Notifier) {
  const chosen = turn.modelId(args.requestContext)
  const picked = await pickAccount(deps, turn, chosen)
  if (picked !== undefined) return picked
  for (const next of await nextModels(deps, turn, chosen)) {
    const switched = await pickAccount(deps, turn, next)
    if (switched === undefined) continue
    turn.switchTo(next, args.requestContext)
    const { modelId: name } = parseModelString(next)
    notify(args, turn, 'model-switched', `Troquei para ${name} pela troca automática da empresa.`)
    return switched
  }
  const refused = turn.unsaid.splice(0).map(refusedText)
  exhaust(args, turn, chosen, refused.length > 0 ? refused.join('. ') : turn.reasons.at(-1))
  return undefined
}

/**
 * The turn's account, picked once for all who ask meanwhile: the agent's step, its error lane, the
 * title and the observer await the same pick, so none overwrites another's or opens it twice.
 */
function accountOf(deps: QueueDeps, turn: Turn, args: Notifier): Promise<Picked | undefined> {
  return turn.account(() => chooseAccount(deps, turn, args))
}

/**
 * The step's provider options with the effort's merged in, per provider: the step takes the
 * processor's options whole (`composeStepInput`), so what the run set stays only through here.
 */
function withOptions(
  current: ProviderOptions | undefined,
  added: ProviderOptions,
): ProviderOptions {
  const merged: ProviderOptions = { ...current }
  for (const [provider, options] of Object.entries(added)) {
    merged[provider] = { ...current?.[provider], ...options }
  }
  return merged
}

/**
 * Input lane only (no `processAPIError`): the runner walks input processors first on an error, and
 * the queue must come after Mastra's retries (Mastra Code, `account-rotation-processor.ts:12-20`).
 * Each attempt gets its account's model; after the automatic switch, the new model reads pages
 * but does not search again (founder, card reading 3 A), since the search tool was resolved for
 * the first model (`agent.ts:5300-5301`). The set it narrows is the mode's own (`availableTools`,
 * `permissions.ts`), never the agent's whole toolset.
 */
export function accountPick(deps: QueueDeps): InputProcessor {
  return {
    id: 'conexus-account-pick',
    async processInputStep(args: ProcessInputStepArgs): Promise<ProcessInputStepResult> {
      const turn = turnIn(args.requestContext)
      if (turn === undefined) return {}
      const account = await accountOf(deps, turn, args)
      if (account !== undefined) sayRefused(args, turn, account)
      await keepNotices(args, turn)
      if (account === undefined)
        return { model: await noAccountModel(turn.modelId(args.requestContext)) }
      const result: ProcessInputStepResult = { ...lastStep(args), model: account.model }
      const thinking = providerOptionsOf(account.modelId, turn.effort(args.requestContext))
      if (thinking !== undefined)
        result.providerOptions = withOptions(args.providerOptions, thinking)
      if (turn.switched && args.activeTools !== undefined) {
        result.activeTools = args.activeTools.filter((name) => name !== WEB_SEARCH)
      }
      return result
    },
  }
}

function failedText(account: Picked, failure: AccountFailure) {
  if (failure.kind === 'limited') return `${account.label} no limite até ${until(failure.until)}`
  if (failure.kind === 'missing') return `${account.label} não atende a este modelo`
  return refusedText(account.label)
}

/**
 * Error lane, last, after Mastra's own processors: 429 and 402 put the account in its limit, 401
 * and 403 refuse it (a subscription refreshes once first), a 404 reads the models it serves again,
 * and the next account takes the call,
 * never `abort()`, which ends the stream silently (study, proved). A 400 or anything else Mastra
 * did not retry ends the turn as the model's failure, with no switch.
 */
function accountQueue(deps: QueueDeps): ErrorProcessor {
  return {
    id: 'conexus-account-queue',
    async processAPIError(args: ProcessAPIErrorArgs) {
      const turn = turnIn(args.requestContext)
      if (turn === undefined) return { retry: false }
      const result = await afterFailure(deps, args, turn)
      // A retried attempt is rolled back; the one that ends the turn keeps its notices.
      if (!result.retry) await keepNotices(args, turn)
      return result
    },
  }
}

/** The queue's answer to a failed call: the next account's attempt, or the turn's end. */
async function afterFailure(deps: QueueDeps, args: ProcessAPIErrorArgs, turn: Turn) {
  const account = turn.calling()
  if (account === undefined) return { retry: false }
  const failure = callFailureOf(args.error)
  const fields = { companyId: turn.companyId, accountId: account.id, failure: failure.kind }
  if (failure.kind === 'unknown') {
    deps.log.info(fields, 'MODEL_CALL_FAILED')
    turn.finish('failed')
    return { retry: false }
  }
  deps.log.info(fields, 'MODEL_CALL_REFUSED')
  const resubscribe = failure.kind === 'refused' && account.kind === 'claude_subscription'
  // A first refusal of a subscription refreshes it; a refused refresh is said by `sayRefused`.
  const refreshing = resubscribe && !turn.refreshed.has(account.id)
  if (refreshing) {
    turn.refreshed.add(account.id)
  } else {
    await markAccount(deps, turn, account.id, failure)
    turn.tried.add(account.id)
    turn.reasons.push(failedText(account, failure))
  }
  if (args.retryCount >= MAX_PROCESSOR_RETRIES) {
    exhaust(args, turn, account.modelId, turn.reasons.at(-1))
    return { retry: false }
  }
  turn.drop()
  const next = await accountOf(deps, turn, args)
  if (next === undefined) return { retry: false }
  sayRefused(args, turn, next)
  if (!refreshing && next.modelId === account.modelId && next.id !== account.id) {
    notify(
      args,
      turn,
      'account-switched',
      `${failedText(account, failure)}; continuei pela ${next.label}.`,
    )
  }
  return { retry: true }
}

/** Mastra's own calls in a turn that are not the agent's: what the log names a failed one by. */
type SideCall = 'title' | 'observer' | 'reflection'

/**
 * The model with its failures logged by call and account, since Mastra's own log line carries
 * neither and its message is not ours to keep (security S41). The error is thrown on, to Mastra.
 */
function watched(deps: QueueDeps, turn: Turn, account: Picked, call: SideCall): LanguageModel {
  const { model } = account
  if (typeof model === 'string' || model.specificationVersion !== 'v3') return model
  function report(error: unknown): never {
    const fields = { companyId: turn.companyId, accountId: account.id, call }
    deps.log.info({ ...fields, failure: callFailureOf(error).kind }, 'MODEL_SIDE_CALL_FAILED')
    throw error
  }
  type Options = Parameters<typeof model.doGenerate>[0]
  const watching: LanguageModel = {
    specificationVersion: 'v3',
    provider: model.provider,
    modelId: model.modelId,
    supportedUrls: model.supportedUrls,
    id: model.id,
    doGenerate: (options: Options) => Promise.resolve(model.doGenerate(options)).catch(report),
    doStream: (options: Options) => Promise.resolve(model.doStream(options)).catch(report),
  }
  return watching
}

/**
 * The model of Mastra's own calls in a turn: the title's is the turn's account. The observer's and
 * the reflector's are the company's choice, read when the turn opened (`Turn.memoryModels`), picked
 * once for the turn beside the queue and never through it: no rotation, no notice, a failure is
 * the memory's own (`failurePolicy: 'continue'`) and is logged by `watched`. A choice with no
 * account left follows the conversation's model.
 */
export function accountModel(deps: QueueDeps, call: SideCall) {
  return async ({ requestContext }: { requestContext: RequestContext }) => {
    const turn = turnIn(requestContext)
    if (turn === undefined) return noAccountModel(chosenModel(requestContext))
    const chosen =
      call === 'title' ? null : turn.memoryModels[call === 'observer' ? 'observer' : 'reflector']
    const side =
      chosen === null || chosen === turn.modelId(requestContext)
        ? undefined
        : await turn.sidePick(chosen, () => pickAccount(deps, turn, chosen))
    const account = side ?? (await accountOf(deps, turn, { requestContext }))
    return account === undefined
      ? noAccountModel(turn.modelId(requestContext))
      : watched(deps, turn, account, call)
  }
}

/**
 * Mastra's default retry, told not to repeat a limit or a refusal so those reach the queue at
 * once: the default matchers (a reset connection, Gemini's `MALFORMED_FUNCTION_CALL`, a provider's
 * `isRetryable`) and its options stay as Mastra builds them (`stability-defaults.ts:114`). Mastra
 * exports neither its connection-reset matcher nor its options at 1.78.0, so this keeps the default
 * instance and answers before it only for an account's failure (code C75).
 */
function accountRetry(retry: StreamErrorRetryProcessor): ErrorProcessor {
  return {
    id: retry.id,
    name: retry.name,
    processAPIError(args: ProcessAPIErrorArgs) {
      if (callFailureOf(args.error).kind !== 'unknown') return undefined
      return retry.processAPIError(args)
    },
  }
}

/**
 * The agent's error lane: the refusal handler first, as `createCodingAgent` has it, so a cyber
 * refusal is retried once before the retry or the queue sees it (`coding-agent/index.ts:113-129`);
 * Mastra's stability defaults in their order, its retry not repeating an account's failure, then the
 * queue, last, as in Mastra Code (`index.ts:1345-1393`).
 */
export function accountErrorProcessors(deps: QueueDeps): ErrorProcessor[] {
  const defaults = defaultStabilityErrorProcessors().map((processor) =>
    processor instanceof StreamErrorRetryProcessor ? accountRetry(processor) : processor,
  )
  return [new CyberRefusalHandler(), ...defaults, accountQueue(deps)]
}
