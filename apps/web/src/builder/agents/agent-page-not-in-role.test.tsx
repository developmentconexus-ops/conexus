import { FAILURES, PROBLEM_MEDIA_TYPE } from '@conexus/hub-api'
import { fireEvent, screen, within } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'
import { problemOf } from '../../platform/fixtures.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import { AGENT, AREA, agent } from './test-agents.ts'
import { agentScreens } from './test-hub.tsx'

// Publicar com uma operação fora do papel de quem publica (Papéis da empresa, U2 e U3).
const server = hubServer()
const { at } = agentScreens(server)
const PAGE = `${AREA}/${AGENT}`

test('Publicar com uma operação fora do papel diz o rótulo da operação, nunca o id', async () => {
  at(PAGE, {
    agents: [agent()],
    answers: {
      publish: () =>
        HttpResponse.json(
          { ...problemOf('NOT_IN_ROLE'), operation: 'Contas a receber' },
          {
            status: FAILURES.NOT_IN_ROLE.status,
            headers: { 'content-type': PROBLEM_MEDIA_TYPE },
          },
        ),
    },
  })
  fireEvent.click(await screen.findByRole('button', { name: /^Publicar v\d/ }))
  const dialog = await screen.findByRole('dialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Publicar versão' }))
  expect(
    await within(dialog).findByText(/Seu papel não pode usar a ferramenta Contas a receber\./),
  ).toBeTruthy()
  expect(within(dialog).queryByText(/contasAReceber/)).toBeNull()
})
