import type {
  ErrorProcessor,
  InputProcessor,
  ProcessAPIErrorArgs,
  ProcessInputStepArgs,
  ProcessInputStepResult,
} from '@mastra/core/processors'
import { StreamErrorRetryProcessor } from '@mastra/core/processors'
import type { RequestContext } from '@mastra/core/request-context'
import { z } from 'zod'
import { callFailureOf } from './errors.ts'
import { nextModels } from './fallback.ts'
import type { QueueDeps } from './queue.ts'
import { callModel, markAccount, pickAccount, providerName, providerOf } from './queue.ts'
import type { Picked, Turn } from './turn.ts'
import { turnIn } from './turn.ts'

/** At most ten calls for one question, as Claude Code and Codex (founder, card reading 7). */
export const MAX_PROCESSOR_RETRIES = 9
const NOTICE_PART = 'data-conexus-notice'
const WEB_SEARCH = 'web_search'

type NoticeKind = 'account-switched' | 'accounts-exhausted' | 'model-switched'
type Writer = ProcessAPIErrorArgs['writer']

type InfoEvent = { type: 'info'; message: string }
const ControllerContext = z.object({
  session: z.object({ modelId: z.string() }),
  emitEvent: z
    .custom<(event: InfoEvent) => void>((value) => typeof value === 'function')
    .optional(),
})

/** The conversation's model, as the controller holds it for this run (`session.model.switch`). */
export function chosenModel(context: RequestContext | undefined): string {
  const parsed = ControllerContext.safeParse(context?.get('controller'))
  return parsed.success ? parsed.data.session.modelId : ''
}

/**
 * The notice the person reads: kept in the answer as a data part, and said live as the controller's
 * `info` event, since a live `data-*` chunk is dropped (`session-run-engine.ts:1580`), as Mastra
 * Code does (`account-rotation-processor.ts:390-406`).
 */
async function notify(
  args: { writer?: Writer; requestContext?: RequestContext },
  kind: NoticeKind,
  text: string,
) {
  await args.writer?.custom({ type: NOTICE_PART, data: { kind, text } })
  const controller = ControllerContext.safeParse(args.requestContext?.get('controller'))
  if (controller.success) controller.data.emitEvent?.({ type: 'info', message: text })
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
function noAccountModel(modelId: string) {
  function fail(): Promise<never> {
    return Promise.reject(new Error('NO_ACCOUNT_LEFT'))
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

type Notifier = { writer?: Writer; requestContext?: RequestContext }

/**
 * The account for the turn's next attempt: in its model's queue, then in each next model of the
 * company's automatic switch, with its notice; none left, the notice that the accounts ended.
 */
async function choose(deps: QueueDeps, turn: Turn, args: Notifier) {
  const chosen = turn.modelId ?? ''
  const picked = await pickAccount(deps, turn, chosen)
  if (picked !== undefined) return picked
  for (const next of await nextModels(deps, turn, chosen)) {
    const switched = await pickAccount(deps, turn, next)
    if (switched === undefined) continue
    turn.modelId = next
    turn.switched = true
    const name = next.slice(providerOf(next).length + 1)
    await notify(args, 'model-switched', `Troquei para ${name} pela troca automática da empresa.`)
    return switched
  }
  turn.outcome = 'exhausted'
  const provider = providerName(providerOf(chosen))
  await notify(
    args,
    'accounts-exhausted',
    `As contas ${provider} que você pode usar estão indisponíveis. Escolha outro modelo ou fale com quem administra a empresa.`,
  )
  return undefined
}

/**
 * Input lane only (no `processAPIError`): the runner walks input processors first on an error, and
 * the queue must come after Mastra's retries (Mastra Code, `account-rotation-processor.ts:12-20`).
 * Each attempt gets its account's model; after the automatic switch, the new model reads pages
 * but does not search again (founder, card reading 3 A), since the search tool was resolved for
 * the first model (`agent.ts:5300-5301`).
 */
export function accountPick(deps: QueueDeps): InputProcessor {
  return {
    id: 'conexus-account-pick',
    async processInputStep(args: ProcessInputStepArgs): Promise<ProcessInputStepResult> {
      const turn = turnIn(args.requestContext)
      if (turn === undefined) return {}
      turn.modelId ??= chosenModel(args.requestContext)
      if (turn.account === undefined && turn.outcome === undefined) {
        turn.account = await choose(deps, turn, args)
      }
      const account = turn.account
      if (account === undefined) return { model: await noAccountModel(turn.modelId) }
      const result: ProcessInputStepResult = { model: account.model }
      if (turn.switched) {
        result.activeTools = Object.keys(args.tools ?? {}).filter((name) => name !== WEB_SEARCH)
      }
      const line = account.systemLine
      if (line !== undefined && !args.systemMessages.some((each) => each.content === line)) {
        result.systemMessages = [{ role: 'system', content: line }, ...args.systemMessages]
      }
      return result
    },
  }
}

function failedText(account: Picked, failure: ReturnType<typeof callFailureOf>): string {
  return failure.kind === 'limited'
    ? `${account.label} no limite até ${until(failure.until)}`
    : `${account.label} foi recusada. Ligue de novo`
}

/**
 * Error lane, last, after Mastra's own processors: 429 and 402 put the account in its limit, 401
 * and 403 refuse it (a subscription refreshes once first), and the next account takes the call,
 * never `abort()`, which ends the stream silently (study, proved). A 400 or anything else ends the
 * turn as the model's failure, with no switch.
 */
export function accountQueue(deps: QueueDeps): ErrorProcessor {
  return {
    id: 'conexus-account-queue',
    async processAPIError(args: ProcessAPIErrorArgs) {
      const turn = turnIn(args.requestContext)
      const account = turn?.account
      if (turn === undefined || account === undefined) return { retry: false }
      const failure = callFailureOf(args.error)
      if (failure.kind === 'unknown') {
        turn.outcome = 'failed'
        return { retry: false }
      }
      const resubscribe = failure.kind === 'refused' && account.kind === 'claude_subscription'
      if (resubscribe && !turn.refreshed.has(account.id)) {
        turn.refreshed.add(account.id)
      } else {
        await markAccount(deps, turn, account.id, failure)
        turn.tried.add(account.id)
      }
      if (args.retryCount >= MAX_PROCESSOR_RETRIES) {
        turn.account = undefined
        turn.outcome = 'exhausted'
        const provider = providerName(providerOf(account.modelId))
        await notify(
          args,
          'accounts-exhausted',
          `As contas ${provider} que você pode usar estão indisponíveis. Escolha outro modelo ou fale com quem administra a empresa.`,
        )
        return { retry: false }
      }
      const next = await choose(deps, turn, args)
      turn.account = next
      if (next === undefined) return { retry: false }
      if (next.modelId === account.modelId && next.id !== account.id) {
        await notify(
          args,
          'account-switched',
          `${failedText(account, failure)}; continuei pela ${next.label}.`,
        )
      }
      return { retry: true }
    },
  }
}

/**
 * The model of Mastra's own calls in a turn, the title's and the observer's: the turn's account,
 * or the queue's next one when the observer runs before the queue (`agent.ts:2392-2404`).
 */
export function accountModel(deps: QueueDeps) {
  return async ({ requestContext }: { requestContext: RequestContext }) => {
    const turn = turnIn(requestContext)
    if (turn === undefined) return noAccountModel('')
    turn.modelId ??= chosenModel(requestContext)
    turn.account ??= await pickAccount(deps, turn, turn.modelId)
    return turn.account?.model ?? noAccountModel(turn.modelId)
  }
}

/**
 * The agent's error lane: Mastra's retry, told not to repeat a limit or a refusal (`maxRetries: 0`),
 * so those reach the queue, last, as in Mastra Code (`index.ts:1345-1393`); Mastra keeps its other
 * defaults in their places (`stability-defaults.ts:114`).
 */
export function accountErrorProcessors(deps: QueueDeps) {
  const accountFailure = {
    match: (error: unknown) => callFailureOf(error).kind !== 'unknown',
    maxRetries: 0,
  }
  return [new StreamErrorRetryProcessor({ matchers: [accountFailure] }), accountQueue(deps)]
}
