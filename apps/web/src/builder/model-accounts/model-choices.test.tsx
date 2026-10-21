import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import type { View } from './test-hub.tsx'
import { modelHub } from './test-hub.tsx'

const server = hubServer()

function view(fields: Partial<View> = {}): View {
  return {
    company: [],
    mine: [],
    order: [],
    kinds: [],
    connected: { mine: [], company: [] },
    defaults: { company: null, mine: null, start: null, companyStart: null },
    mayManage: true,
    ...fields,
  }
}

async function openPicker(path: string, shown: View, heading: string, name: string) {
  server.use(...modelHub(shown).handlers)
  render(
    <Conexus
      conexus={createConexus(
        createMemoryHistory({ initialEntries: [`/companies/${COMPANY.id}/${path}`] }),
      )}
    />,
  )
  await screen.findByRole('heading', { name: heading })
  fireEvent.click(await screen.findByRole('combobox', { name }))
  return screen.findByRole('listbox')
}

test('Meus padrões lista só os fornecedores de connected.mine; Padrões da empresa e a fila, só os de connected.company', async () => {
  const shown = view({ connected: { mine: ['openai'], company: ['anthropic'] } })
  await openPicker('settings/my-defaults', shown, 'Meus padrões', 'Modelo e raciocínio')
  expect(screen.getAllByRole('option').map((one) => one.textContent)).toEqual(['GPT 5'])
})

test('Padrões da empresa lista os de connected.company', async () => {
  const shown = view({ connected: { mine: ['openai'], company: ['anthropic'] } })
  await openPicker('settings/defaults', shown, 'Padrões da empresa', 'Modelo e raciocínio')
  expect(screen.getAllByRole('option').map((one) => one.textContent)).toEqual([
    'Claude Sonnet 4',
    'Claude Opus 4',
  ])
})

test('a fila da troca automática lista os de connected.company', async () => {
  const shown = view({ connected: { mine: ['openai'], company: ['openai'] } })
  await openPicker('settings/model-accounts', shown, 'Contas de modelo', 'Modelo da troca')
  expect(screen.getAllByRole('option').map((one) => one.textContent)).toEqual(['GPT 5'])
})

test('sem fornecedor conectado a escolha diz "Conecte uma conta de modelo"', async () => {
  await openPicker('settings/my-defaults', view(), 'Meus padrões', 'Modelo e raciocínio')
  expect(await screen.findByText('Conecte uma conta de modelo')).toBeTruthy()
  expect(screen.queryAllByRole('option')).toEqual([])
})

test('os pickers listam só os modelos que o Hub diz que a conta atende', async () => {
  const sonnet = { id: 'anthropic/claude-sonnet-4', efforts: ['off', 'low', 'high'] }
  const only = [{ id: 'anthropic', name: 'Anthropic', models: [sonnet] }]
  const shown = view({ choices: { mine: only, company: only } })
  await openPicker('settings/defaults', shown, 'Padrões da empresa', 'Modelo e raciocínio')
  expect(screen.getAllByRole('option').map((one) => one.textContent)).toEqual(['Claude Sonnet 4'])
})
