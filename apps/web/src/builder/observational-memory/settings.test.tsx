import {
  getAccountKinds,
  listModelAccounts,
  listModelProviders,
  readObservationalMemoryModels,
  setObservationalMemoryModel,
} from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { companyRead, hubServer, sessionRead } from '../../platform/test-hub.tsx'

const server = hubServer()
const PAGE = `/companies/${COMPANY.id}/settings/observational-memory`
const BASE = `*/api/companies/${COMPANY.id}/observational-memory-models`
const MODEL = 'openai/gpt-5'

test('o dono configura cada papel, salva e retorna um deles ao Automático', async () => {
  const state: { observer: string | null; reflector: string | null } = {
    observer: null,
    reflector: null,
  }
  const providers = [{ id: 'openai', name: 'OpenAI', models: [{ id: MODEL, efforts: ['off'] }] }]
  server.use(
    sessionRead(() => ANA),
    ...companyRead({ role: 'owner' }),
    http.get(`*/api/companies/${COMPANY.id}/model-accounts`, () =>
      HttpResponse.json(
        listModelAccounts.success.body.parse({
          defaults: { company: null, mine: null, start: null, companyStart: null },
          fallback: { enabled: false, chain: [], revision: 0 },
          usableProviders: [],
          choices: { mine: [], company: providers },
          company: [],
          mine: [],
          order: [],
          kinds: [],
          mayManage: true,
        }),
      ),
    ),
    http.get('*/api/model-providers', () =>
      HttpResponse.json(listModelProviders.success.body.parse({ providers })),
    ),
    http.get(`*/api/clients/${COMPANY.id}/account-kinds`, () =>
      HttpResponse.json(getAccountKinds.success.body.parse({ kinds: [] })),
    ),
    http.get(BASE, () =>
      HttpResponse.json(readObservationalMemoryModels.success.body.parse(state)),
    ),
    http.put(BASE, async ({ request }) => {
      const body = setObservationalMemoryModel.input.body.parse(await request.json())
      state[body.role] = body.model
      return HttpResponse.json(setObservationalMemoryModel.success.body.parse(state))
    }),
  )
  const conexus = createConexus(createMemoryHistory({ initialEntries: [PAGE] }))
  render(<Conexus conexus={conexus} />)

  expect(await screen.findByRole('heading', { name: 'Memória observacional' })).toBeTruthy()
  const observer = screen.getByRole('combobox', { name: 'Modelo do observador' })
  const reflector = screen.getByRole('combobox', { name: 'Modelo do refletor' })
  fireEvent.change(observer, { target: { value: MODEL } })
  await waitFor(() => expect(state.observer).toBe(MODEL))

  fireEvent.change(reflector, { target: { value: MODEL } })
  await waitFor(() => expect(state.reflector).toBe(MODEL))

  fireEvent.change(observer, { target: { value: '' } })
  await waitFor(() => expect(state.observer).toBeNull())

  expect(state).toEqual({ observer: null, reflector: MODEL })
})
