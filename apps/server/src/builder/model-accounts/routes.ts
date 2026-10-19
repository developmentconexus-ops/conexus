import {
  assignModelAccount,
  changeModelAccount,
  completeModelAccountSignIn,
  connectModelAccount,
  getAccountKinds,
  listModelAccounts,
  listModelProviders,
  orderModelAccounts,
  removeModelAccount,
  setAccountKinds,
  setDefaultModel,
  startModelAccountSignIn,
} from '@conexus/hub-api'
import type { FastifyInstance } from 'fastify'
import { answer, serve } from '../../platform/http.ts'
import type { Deps } from './accounts.ts'
import { readKinds, setKinds } from './kinds.ts'
import { listKeyProviders } from './providers.ts'
import type { SignInFlows } from './sign-ins.ts'
import { completeSignIn, startSignIn } from './sign-ins.ts'
import type { ModelAccountStore } from './store.ts'

const PROVIDERS = { providers: listKeyProviders() }

export function registerModelAccountRoutes(
  app: FastifyInstance,
  deps: Deps & { store: ModelAccountStore; flows: SignInFlows },
): void {
  const { store } = deps

  serve(app, listModelProviders, () => answer(PROVIDERS))

  serve(app, listModelAccounts, async ({ person, params }) =>
    answer(await store.list({ person, ...params })),
  )

  serve(app, connectModelAccount, async ({ person, params, body, attemptKey, log }) => {
    const made = await store.connect({ person, ...params, ...body, attemptKey })
    if (made.created) {
      const { id, provider, owner } = made.account
      log.info(
        { companyId: params.companyId, accountId: id, provider, owner },
        'MODEL_ACCOUNT_LINKED',
      )
    }
    return answer({ account: made.account })
  })

  serve(app, changeModelAccount, async ({ person, params, body, log }) => {
    const changed = await store.change({ person, ...params, ...body })
    log.info(
      { companyId: params.companyId, accountId: params.accountId, state: changed.account.state },
      'MODEL_ACCOUNT_CHANGED',
    )
    return answer(changed)
  })

  serve(app, assignModelAccount, async ({ person, params, body, log }) => {
    const given = await store.assign({ person, ...params, personIds: body.personIds })
    const fields = {
      companyId: params.companyId,
      accountId: params.accountId,
      assignees: given.account.assignees.length,
    }
    log.info(fields, 'MODEL_ACCOUNT_CHANGED')
    return answer(given)
  })

  serve(app, setDefaultModel, async ({ person, params, body, log }) => {
    const set = await store.setDefault({ person, ...params, model: body.model })
    log.info({ companyId: params.companyId, model: set.defaultModel }, 'MODEL_ACCOUNT_CHANGED')
    return answer(set)
  })

  serve(app, orderModelAccounts, async ({ person, params, body, log }) => {
    const ordered = await store.order({ person, ...params, ids: body.ids })
    const { companyId, owner, provider } = params
    log.info({ companyId, owner, provider, accounts: body.ids.length }, 'MODEL_ACCOUNTS_ORDERED')
    return answer(ordered)
  })

  serve(app, removeModelAccount, async ({ person, params, log }) => {
    const { removed } = await store.remove({ person, ...params })
    if (removed !== undefined) {
      log.info(
        { companyId: params.companyId, accountId: params.accountId, provider: removed.provider },
        'MODEL_ACCOUNT_REMOVED',
      )
    }
    return answer(undefined)
  })

  serve(app, getAccountKinds, async ({ person, params }) =>
    answer(await readKinds(deps, { person, ...params })),
  )

  serve(app, setAccountKinds, async ({ person, params, body, log }) => {
    const set = await setKinds(deps, { person, ...params, kinds: body.kinds })
    log.info(
      { companyId: params.companyId, personId: person.id, kinds: set.kinds.join(',') },
      'ACCOUNT_KINDS_SET',
    )
    return answer(set)
  })

  registerSignInRoutes(app, deps)
}

function registerSignInRoutes(app: FastifyInstance, deps: Deps & { flows: SignInFlows }) {
  serve(app, startModelAccountSignIn, async ({ person, params, body, log }) => {
    const started = await startSignIn(deps, { person, ...params, ...body })
    log.info(
      {
        companyId: params.companyId,
        signInId: started.signInId,
        kind: body.kind,
        owner: body.owner,
      },
      'MODEL_ACCOUNT_SIGN_IN_STARTED',
    )
    return answer(started)
  })

  serve(app, completeModelAccountSignIn, async ({ person, params, body, log }) => {
    const linked = await completeSignIn(deps, { person, ...params, code: body.code })
    const { id, provider, owner, kind } = linked.account
    log.info(
      { companyId: params.companyId, accountId: id, provider, owner, kind },
      'MODEL_ACCOUNT_LINKED',
    )
    return answer(linked)
  })
}
