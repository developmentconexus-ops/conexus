import {
  listModelAccounts,
  listModelProviders,
  readObservationalMemoryModels,
} from '@conexus/hub-api'
import type { Replies } from './layout-harness.ts'
import { ok } from './layout-harness.ts'

/** The company's model accounts and the providers of their keys, which the rail preloads on focus. */
export function modelAccountsPage(id: string, mayManage: boolean): Replies {
  return {
    [`GET /api/companies/${id}/observational-memory-models`]: ok(readObservationalMemoryModels, {
      observer: null,
      reflector: null,
    }),
    [`GET /api/companies/${id}/model-accounts`]: ok(listModelAccounts, {
      company: [],
      mine: [],
      order: [],
      kinds: [],
      defaults: { company: null, mine: null, start: null, companyStart: null },
      choices: { mine: [], company: [] },
      fallback: { enabled: false, chain: [], revision: 0 },
      usableProviders: [],
      mayManage,
    }),
    'GET /api/model-providers': ok(listModelProviders, {
      providers: [
        {
          id: 'anthropic',
          name: 'Anthropic',
          models: [
            { id: 'anthropic/claude-sonnet-4', efforts: ['off', 'low', 'high'] },
            { id: 'anthropic/claude-opus-4', efforts: ['off'] },
          ],
        },
      ],
    }),
  }
}
