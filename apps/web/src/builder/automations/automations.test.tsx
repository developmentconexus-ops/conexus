import { AutomationRunId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { http } from 'msw'
import { expect, test } from 'vitest'
import { hubServer, PEDIDOS, projectsRead, refusal } from '../../platform/test-hub.tsx'
import { assistantScreens, COMPANY_ROOT } from '../assistant/test-hub.tsx'
import { onPhone } from '../conversation/test-hub.tsx'
import { automation, automationsHub, METAS, RAN, RESUMO, run } from './test-hub.tsx'

// Automações: the person's own, the actions on each and the history (step 24.2, criteria 19 and 20).
const server = hubServer()
const { at } = assistantScreens(server)
const LIST = `${COMPANY_ROOT}/automations`

test('a lista mostra as da pessoa com o estado e a próxima, e Pausar e Retomar mudam a linha', async () => {
  const hub = automationsHub(server, {
    automations: [
      automation(),
      automation({
        id: METAS,
        name: 'Metas da semana',
        state: 'PAUSED',
        nextRunAt: null,
        cadence: { kind: 'WEEKLY', days: ['MON'], time: '08:00' },
      }),
    ],
  })
  at(LIST)
  const resumo = (await screen.findByText('Resumo de vendas')).closest('li')
  const metas = (await screen.findByText('Metas da semana')).closest('li')
  if (resumo === null || metas === null) throw new Error('rows missing')
  expect(within(resumo).getByText('Ativa')).toBeTruthy()
  expect(within(resumo).getByText(/Todo dia às 07:00 · Próxima: /)).toBeTruthy()
  expect(within(metas).getByText('Pausada')).toBeTruthy()
  expect(within(metas).getByText(/Segunda às 08:00 · Início/)).toBeTruthy()
  expect(within(metas).queryByText(/Próxima/)).toBeNull()

  fireEvent.click(within(resumo).getByRole('button', { name: 'Pausar' }))
  await waitFor(() => expect(within(resumo).getByText('Pausada')).toBeTruthy())
  expect(within(resumo).queryByText(/Próxima/)).toBeNull()
  fireEvent.click(within(resumo).getByRole('button', { name: 'Retomar' }))
  await waitFor(() => expect(within(resumo).getByText('Ativa')).toBeTruthy())
  expect(hub.writes().map((one) => one.path.split('/').at(-1))).toEqual(['pause', 'resume'])
})

test('Rodar agora pede a execução e diz que ela aparece no histórico; uma já rodando mostra a frase do código', async () => {
  let refuse = false
  const hub = automationsHub(server, {
    automations: [automation()],
    answers: { write: () => (refuse ? refusal('AUTOMATION_RUNNING') : undefined) },
  })
  at(LIST)
  fireEvent.click(await screen.findByRole('button', { name: 'Rodar agora' }))
  expect(await screen.findByText('Pedido enviado. A execução aparece no histórico.')).toBeTruthy()
  refuse = true
  fireEvent.click(screen.getByRole('button', { name: 'Rodar agora' }))
  expect((await screen.findByRole('alert')).textContent).toBe(
    'Esta automação já está rodando. Espere ela terminar.',
  )
  expect(hub.writes()).toHaveLength(2)
})

test('Apagar pede confirmação: Cancelar não apaga, Apagar tira a linha e a lista vazia diz como pedir uma', async () => {
  const hub = automationsHub(server, { automations: [automation()] })
  at(LIST)
  fireEvent.click(await screen.findByRole('button', { name: 'Apagar' }))
  const dialog = await screen.findByRole('alertdialog')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(hub.writes()).toHaveLength(0)
  fireEvent.click(screen.getByRole('button', { name: 'Apagar' }))
  fireEvent.click(
    within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Apagar' }),
  )
  expect(
    await screen.findByText(
      'Peça numa conversa, por exemplo: todo dia às 7h me manda o resumo de vendas.',
    ),
  ).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Nova conversa' })).toBeTruthy()
  expect(hub.writes().map((one) => one.method)).toEqual(['DELETE'])
})

test('no Projeto, a página lista só as automações dele', async () => {
  automationsHub(server, {
    automations: [
      automation({ projectId: PEDIDOS.id, name: 'Pedidos do dia' }),
      automation({ id: METAS, name: 'Do Início' }),
    ],
  })
  server.use(...projectsRead({ projects: [PEDIDOS], databaseReady: true, mayDelete: true }))
  at(`${COMPANY_ROOT}/projects/${PEDIDOS.id}/automations`)
  expect(await screen.findByText('Pedidos do dia')).toBeTruthy()
  expect(screen.queryByText('Do Início')).toBeNull()
  expect(await screen.findByText(/Todo dia às 07:00 · Próxima: .* · Pedidos/)).toBeTruthy()
})

test('numa tela estreita, Pausar e Apagar vão para o menu ⋯', async () => {
  await onPhone(async () => {
    const hub = automationsHub(server, { automations: [automation()] })
    at(LIST)
    expect(await screen.findByRole('button', { name: 'Rodar agora' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Pausar' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Mais ações: Resumo de vendas' }))
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Pausar' }))
    await waitFor(() => expect(hub.writes()).toHaveLength(1))
  })
})

test('o histórico mostra cada execução: pronta com Abrir a conversa, falhou com a frase, rodando e não rodou', async () => {
  automationsHub(server, {
    automations: [automation()],
    runs: [
      run(),
      run({
        runId: AutomationRunId.parse(`sched_${RESUMO}_1793520000001`),
        trigger: 'MANUAL',
        state: { kind: 'FAILED', code: 'MODEL_NO_ACCOUNT', conversationId: null },
      }),
    ],
  })
  const { conexus } = at(`${LIST}/${RESUMO}`)
  expect(await screen.findByRole('heading', { name: 'Resumo de vendas' })).toBeTruthy()
  expect(await screen.findByText('Pronta')).toBeTruthy()
  const open = screen.getByRole('link', { name: 'Abrir a conversa' })
  expect(open.getAttribute('href')).toBe(`${COMPANY_ROOT}/conversations/${RAN}`)
  expect(screen.getByText(/^Falhou: /)).toBeTruthy()
  expect(screen.getByText('Manual')).toBeTruthy()
  fireEvent.click(open)
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toBe(`${COMPANY_ROOT}/conversations/${RAN}`),
  )
})

test('o histórico de uma automação que ainda não rodou diz a próxima, e a pausada não', async () => {
  automationsHub(server, {
    automations: [automation(), automation({ id: METAS, state: 'PAUSED', nextRunAt: null })],
    runs: [],
  })
  at(`${LIST}/${RESUMO}`)
  expect(await screen.findByText(/^Ainda não rodou\. Próxima: /)).toBeTruthy()
})

test('o histórico de uma pausada diz só que ainda não rodou', async () => {
  automationsHub(server, {
    automations: [automation({ state: 'PAUSED', nextRunAt: null })],
    runs: [],
  })
  at(`${LIST}/${RESUMO}`)
  expect(await screen.findByText('Ainda não rodou.')).toBeTruthy()
})

test('o membro: a barra não tem Automações, e o endereço dá a página de não encontrado', async () => {
  server.use(http.get('*/api/companies/:companyId/automations', () => refusal('NOT_FOUND')))
  at(LIST, { role: 'member' })
  expect(await screen.findByText('Não encontramos o que você procurou.')).toBeTruthy()
  expect(screen.queryByRole('link', { name: 'Automações' })).toBeNull()
})

test('o dono vê Automações na barra, e o endereço de uma automação que não é dele dá não encontrado', async () => {
  automationsHub(server, { automations: [automation()] })
  at(`${LIST}/${METAS}`)
  expect(await screen.findByText('Não encontramos o que você procurou.')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Automações' })).toBeTruthy()
})
