import { screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { AGENT_START, agentEnd, RUNNING, signalStarted } from './test-events.ts'
import { conversationOf, FIRST, say, screens, typed, view } from './test-hub.tsx'
import { builderSaid } from './test-stream.tsx'

const { openConversation } = screens(hubServer())

test('a mensagem recusada durante a atualização diz a frase da tabela e mantém o texto (0b)', async () => {
  const { field } = await openConversation(conversationOf({ id: FIRST }), view(), {
    message: () => refusal('HUB_UPDATING'),
  })
  say(field, 'Compare')
  expect((await screen.findByRole('alert')).textContent).toBe(
    'O Conexus está sendo atualizado. Tente em um minuto.',
  )
  expect(typed(field)).toBe('Compare')
  expect(screen.queryByText('Pensando…')).toBeNull()
})

test('a resposta cortada pela atualização diz a frase da tabela (0c)', async () => {
  const opened = await openConversation(conversationOf({ id: FIRST }))
  say(opened.field, 'Compare')
  await waitFor(() => expect(opened.sent).toHaveLength(1))
  opened.line().emit(AGENT_START)
  opened.line().emit(RUNNING)
  opened.line().emit(signalStarted(opened.shown.conversations[0]?.messages[0]?.id ?? '', 'Compare'))
  await screen.findByText('Pensando…')
  const cut = builderSaid('', 'ours-1')
  cut.content = {
    ...cut.content,
    parts: [{ type: 'data-conexus-failure', data: { code: 'HUB_UPDATED' } }],
  }
  opened.shown.conversations[0]?.messages.push(cut)
  opened.line().emit(agentEnd('aborted'))
  const log = screen.getByRole('log', { name: 'Conversa com o Builder' })
  await waitFor(() =>
    expect(
      within(log)
        .getAllByRole('alert')
        .map((alert) => alert.textContent),
    ).toEqual(['A atualização do Conexus cortou esta resposta. Mande de novo.']),
  )
})
