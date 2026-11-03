import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { AGENT, AREA, agent } from './test-agents.ts'
import { agentScreens } from './test-hub.tsx'

// O formulário da ferramenta criada no painel (step 24.3, U5, criterion 27; web W24, code C37).
const server = hubServer()
const { at } = agentScreens(server)

test('a resposta de criar a ferramenta se perde: tocar de novo leva a mesma chave', async () => {
  let calls = 0
  const hub = at(`${AREA}/${AGENT}`, {
    agents: [agent()],
    answers: { createTool: () => (++calls === 1 ? HttpResponse.error() : undefined) },
  })
  const panel = await screen.findByRole('region', { name: 'Configuração' })
  fireEvent.click(await within(panel).findByRole('button', { name: 'Criar' }))
  const dialog = await screen.findByRole('dialog')
  fireEvent.change(within(dialog).getByLabelText('Nome da ferramenta'), {
    target: { value: 'pedidos_de_ontem' },
  })
  fireEvent.change(within(dialog).getByLabelText('O que ela faz'), {
    target: { value: 'Pedidos de ontem.' },
  })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Criar ferramenta' }))
  expect(await within(dialog).findByRole('alert')).toBeTruthy()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Criar ferramenta' }))
  await waitFor(() =>
    expect(hub.writes().filter((one) => one.path.endsWith('/tools'))).toHaveLength(2),
  )
  const keys = hub
    .writes()
    .filter((one) => one.path.endsWith('/tools'))
    .map((one) => one.key)
  expect(keys[0]).not.toBeNull()
  expect(keys[1]).toBe(keys[0])
})
