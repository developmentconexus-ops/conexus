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
import { sentenceOfCode } from '../../platform/hub.ts'
import { companyRead, hubServer, refusal, sessionRead } from '../../platform/test-hub.tsx'

const server = hubServer()
const PAGE = `/companies/${COMPANY.id}/settings/observational-memory`
const BASE = `*/api/companies/${COMPANY.id}/observational-memory-models`
const MODEL = 'openai/gpt-5'

type Chosen = { observer: string | null; reflector: string | null }

/** The screen as a person who manages the accounts (`owner`) or one who does not (`member`) sees it. */
function open(role: 'owner' | 'member', save: Parameters<typeof http.put>[1]) {
  const state: Chosen = { observer: null, reflector: null }
  const providers = [{ id: 'openai', name: 'OpenAI', models: [{ id: MODEL, efforts: ['off'] }] }]
  server.use(
    sessionRead(() => ANA),
    ...companyRead({ role }),
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
          mayManage: role === 'owner',
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
    http.put(BASE, save),
  )
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [PAGE] }))} />)
  return state
}

test('o dono configura cada papel, salva e retorna um deles a seguir a conversa', async () => {
  let state: Chosen | undefined
  state = open('owner', async ({ request }) => {
    const body = setObservationalMemoryModel.input.body.parse(await request.json())
    if (state !== undefined) state[body.role] = body.model
    return HttpResponse.json(setObservationalMemoryModel.success.body.parse(state))
  })

  expect(await screen.findByRole('heading', { name: 'Memória observacional' })).toBeTruthy()
  expect(screen.getAllByRole('option', { name: 'Segue o modelo da conversa' })).toHaveLength(2)
  const observer = screen.getByRole('combobox', { name: 'Modelo do observador' })
  const reflector = screen.getByRole('combobox', { name: 'Modelo do refletor' })
  fireEvent.change(observer, { target: { value: MODEL } })
  await waitFor(() => expect(state?.observer).toBe(MODEL))

  fireEvent.change(reflector, { target: { value: MODEL } })
  await waitFor(() => expect(state?.reflector).toBe(MODEL))

  fireEvent.change(observer, { target: { value: '' } })
  await waitFor(() => expect(state?.observer).toBeNull())

  expect(state).toEqual({ observer: null, reflector: MODEL })
})

test('o modelo sem conta é recusado, e a tela diz a frase da recusa', async () => {
  open('owner', () => refusal('MODEL_NO_ACCOUNT'))

  const observer = await screen.findByRole('combobox', { name: 'Modelo do observador' })
  fireEvent.change(observer, { target: { value: MODEL } })

  expect(await screen.findByText(sentenceOfCode('MODEL_NO_ACCOUNT'))).toBeTruthy()
})

test('quem não gerencia as contas lê a escolha e não a muda', async () => {
  open('member', () => refusal('NOT_FOUND'))

  const observer = await screen.findByRole('combobox', { name: 'Modelo do observador' })
  expect(observer.hasAttribute('disabled')).toBe(true)
  expect(
    screen.getByText('Só o dono ou um administrador muda as configurações da empresa.'),
  ).toBeTruthy()
})
