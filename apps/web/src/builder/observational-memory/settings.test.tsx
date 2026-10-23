import { readObservationalMemoryModels, setObservationalMemoryModel } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import type { View } from '../model-accounts/test-hub.tsx'
import { modelHub } from '../model-accounts/test-hub.tsx'

const server = hubServer()
const PAGE = `/companies/${COMPANY.id}/settings/observational-memory`
const BASE = `*/api/companies/${COMPANY.id}/observational-memory-models`
const MODEL = 'openai/gpt-5'

test('o dono configura cada papel, salva e retorna um deles ao Automático', async () => {
  const state: { observer: string | null; reflector: string | null } = {
    observer: null,
    reflector: null,
  }
  const hub = modelHub({
    company: [],
    mine: [],
    order: [],
    kinds: [],
    mayManage: true,
    connected: { mine: [], company: ['openai'] },
  } satisfies View)
  server.use(
    ...hub.handlers,
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
