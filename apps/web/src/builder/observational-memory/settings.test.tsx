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

/** Opens a select of the house and chooses the option named `name`. */
async function choose(trigger: HTMLElement, name: string) {
  await waitFor(() => expect(trigger.hasAttribute('disabled')).toBe(false))
  fireEvent.click(trigger)
  const option = await screen.findByRole('option', { name })
  fireEvent.pointerDown(option)
  fireEvent.mouseDown(option)
  fireEvent.pointerUp(option)
  fireEvent.mouseUp(option)
  fireEvent.click(option)
}

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
  expect(screen.getByRole('region', { name: 'Observador' })).toBeTruthy()
  expect(screen.getByRole('region', { name: 'Refletor' })).toBeTruthy()
  expect(document.querySelector('select')).toBeNull()
  const observer = screen.getByRole('combobox', { name: 'Modelo do observador' })
  const reflector = screen.getByRole('combobox', { name: 'Modelo do refletor' })
  await choose(observer, 'GPT 5')
  await waitFor(() => expect(state?.observer).toBe(MODEL))

  await choose(reflector, 'GPT 5')
  await waitFor(() => expect(state?.reflector).toBe(MODEL))

  await choose(observer, 'Segue o modelo da conversa')
  await waitFor(() => expect(state?.observer).toBeNull())

  expect(state).toEqual({ observer: null, reflector: MODEL })
})

test('o modelo sem conta é recusado, e a tela diz a frase da recusa', async () => {
  open('owner', () => refusal('MODEL_NO_ACCOUNT'))

  const observer = await screen.findByRole('combobox', { name: 'Modelo do observador' })
  await choose(observer, 'GPT 5')

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

test('o modelo escolhido fica à vista no campo e uma resposta cortada diz que não confirmou', async () => {
  open('owner', () => new HttpResponse('{"observer"', { status: 200 }))

  const observer = await screen.findByRole('combobox', { name: 'Modelo do observador' })
  expect(observer.textContent).toContain('Segue o modelo da conversa')
  await choose(observer, 'GPT 5')

  expect(
    await screen.findByText(
      'Não foi possível confirmar se o modelo foi salvo. Confira e tente de novo.',
    ),
  ).toBeTruthy()
})

test('a recusa de quem escolhe o observador aparece no campo do observador, não no do refletor', async () => {
  open('owner', () => refusal('MODEL_NO_ACCOUNT'))
  const observer = await screen.findByRole('combobox', { name: 'Modelo do observador' })
  await choose(observer, 'GPT 5')
  const message = await screen.findByText(sentenceOfCode('MODEL_NO_ACCOUNT'))
  expect(screen.getByRole('region', { name: 'Observador' }).contains(message)).toBe(true)
  expect(screen.getByRole('region', { name: 'Refletor' }).contains(message)).toBe(false)
})
