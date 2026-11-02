import { listNotifications, NotificationId } from '@conexus/hub-api'
import { fireEvent, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { assistantScreens, COMPANY_ROOT } from '../assistant/test-hub.tsx'
import { automation, automationsHub, RAN, RESUMO, run } from './test-hub.tsx'

// O sino depois de Rodar agora (step 24.2, criterion 21).
const server = hubServer()
const { at } = assistantScreens(server)
const LIST = `${COMPANY_ROOT}/automations`

test('Rodar agora: quando a execução termina, o sino mostra a notificação sem clique e sem esperar o minuto', async () => {
  const running = run({ state: { kind: 'RUNNING', conversationId: null }, trigger: 'MANUAL' })
  const runs = [running]
  automationsHub(server, { automations: [automation()], runs })
  let unread = 0
  server.use(
    http.get('*/api/companies/:companyId/notifications', () =>
      HttpResponse.json({
        notifications:
          unread === 0
            ? []
            : [
                listNotifications.success.body.shape.notifications.element.parse({
                  kind: 'AUTOMATION_DONE',
                  id: NotificationId.parse('00000000-0000-4000-8000-000000000001'),
                  createdAt: '2026-11-02T10:00:00.000Z',
                  read: false,
                  automation: { id: RESUMO, name: 'Resumo de vendas' },
                  projectId: null,
                  conversationId: RAN,
                }),
              ],
        unread,
        next: { kind: 'END' },
      }),
    ),
  )
  at(LIST)
  fireEvent.click(await screen.findByRole('button', { name: 'Rodar agora' }))
  await screen.findByText('Pedido enviado. A execução aparece no histórico.')
  runs[0] = run({ trigger: 'MANUAL' })
  unread = 1
  expect(
    await screen.findByRole('button', { name: 'Notificações: 1 não lida' }, { timeout: 9000 }),
  ).toBeTruthy()
}, 15_000)
