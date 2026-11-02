import { AutomationRunId } from '@conexus/hub-api'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test, vi } from 'vitest'
import { COMPANY } from '../../platform/fixtures.ts'
import { hubServer, PEDIDOS, projectsRead, refusal } from '../../platform/test-hub.tsx'
import { assistantScreens, COMPANY_ROOT } from '../assistant/test-hub.tsx'
import { onPhone } from '../conversation/test-hub.tsx'
import { automation, automationsHub, METAS, RAN, RESUMO, run } from './test-hub.tsx'

// Automações: the person's own, the actions on each and the history (step 24.2, criteria 19 and 20).
const server = hubServer()
const { at } = assistantScreens(server)
const LIST = `${COMPANY_ROOT}/automations`

const refusedProject = http.get(`*/api/companies/${COMPANY.id}/projects/:projectId`, () =>
  refusal('NOT_FOUND'),
)

function later(ms: number) {
  return new Promise((done) => setTimeout(done, ms))
}

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

function RUN_AT(n: number) {
  return AutomationRunId.parse(`sched_${RESUMO}_179352000000${n}`)
}

test('o histórico mostra cada execução, da mais nova à mais velha: rodando, não rodou, falhou com a frase e pronta com Abrir a conversa', async () => {
  automationsHub(server, {
    automations: [automation()],
    runs: [
      run({ runId: RUN_AT(4), state: { kind: 'RUNNING', conversationId: null } }),
      run({ runId: RUN_AT(3), state: { kind: 'SKIPPED', reason: 'OWNER_CANNOT_ASK' } }),
      run({
        runId: RUN_AT(2),
        trigger: 'MANUAL',
        state: { kind: 'FAILED', code: 'MODEL_NO_ACCOUNT', conversationId: null },
      }),
      run({ runId: RUN_AT(1) }),
    ],
  })
  const { conexus } = at(`${LIST}/${RESUMO}`)
  expect(await screen.findByRole('heading', { name: 'Resumo de vendas' })).toBeTruthy()
  const rows = (await screen.findAllByText(/Horário|Manual/)).map((each) => each.parentElement)
  expect(rows).toHaveLength(4)
  const [running, skipped, failed, done] = rows
  if (!running || !skipped || !failed || !done) throw new Error('a run row is missing')
  expect(within(running).getByText('Rodando')).toBeTruthy()
  expect(within(running).queryByRole('link', { name: 'Abrir a conversa' })).toBeNull()
  expect(within(skipped).getByText('Não rodou')).toBeTruthy()
  expect(within(skipped).getByText('Você não pode mais perguntar ao Assistente.')).toBeTruthy()
  expect(within(failed).getByText('Falhou')).toBeTruthy()
  expect(
    within(failed).getByText('Nenhuma conta que você pode usar atende a este modelo.'),
  ).toBeTruthy()
  expect(within(failed).getByText('Manual')).toBeTruthy()
  expect(within(failed).queryByRole('link', { name: 'Abrir a conversa' })).toBeNull()
  expect(within(done).getByText('Pronta')).toBeTruthy()
  expect(within(done).getByText('Horário')).toBeTruthy()
  const open = within(done).getByRole('link', { name: 'Abrir a conversa' })
  expect(open.getAttribute('href')).toBe(`${COMPANY_ROOT}/conversations/${RAN}`)
  fireEvent.click(open)
  await waitFor(() =>
    expect(conexus.router.state.location.pathname).toBe(`${COMPANY_ROOT}/conversations/${RAN}`),
  )
})

test('uma execução que falhou diz a frase do código', async () => {
  automationsHub(server, {
    automations: [automation()],
    runs: [run({ state: { kind: 'FAILED', code: 'MODEL_NO_ACCOUNT', conversationId: RAN } })],
  })
  at(`${LIST}/${RESUMO}`)
  const failed = (await screen.findByText('Falhou')).parentElement
  if (failed === null) throw new Error('the failed run has no row')
  expect(failed.textContent).toContain('Nenhuma conta que você pode usar atende a este modelo.')
  expect(within(failed).getByRole('link', { name: 'Abrir a conversa' })).toBeTruthy()
})

test('uma execução que ainda roda mostra Rodando, e quando o Hub a dá por pronta a tela muda sem foco nem recarga', async () => {
  // Testing Library's `waitFor` polls with `setInterval`, so this test waits with `setTimeout` instead.
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  try {
    const held = {
      automations: [automation()],
      runs: [run({ state: { kind: 'RUNNING', conversationId: RAN } })],
    }
    automationsHub(server, held)
    at(`${LIST}/${RESUMO}`)
    await later(300)
    expect(screen.getByText('Rodando')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Abrir a conversa' })).toBeTruthy()
    held.runs = [run({ state: { kind: 'DONE', conversationId: RAN } })]
    await vi.advanceTimersByTimeAsync(5_000)
    await later(300)
    expect(screen.getByText('Pronta')).toBeTruthy()
    expect(screen.queryByText('Rodando')).toBeNull()
  } finally {
    vi.useRealTimers()
  }
})

test('uma execução que já terminou não é lida de novo sozinha', async () => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  try {
    const hub = automationsHub(server, { automations: [automation()], runs: [run()] })
    at(`${LIST}/${RESUMO}`)
    await later(300)
    const before = hub.runReads()
    expect(before).toBeGreaterThan(0)
    await vi.advanceTimersByTimeAsync(30_000)
    await later(300)
    expect(hub.runReads()).toBe(before)
  } finally {
    vi.useRealTimers()
  }
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

test('o botão tocado mostra que está ocupado, e os outros ficam parados até a resposta', async () => {
  let release: () => void = () => undefined
  const hold = new Promise<void>((resolve) => {
    release = resolve
  })
  automationsHub(server, { automations: [automation()], answers: { hold } })
  at(LIST)
  fireEvent.click(await screen.findByRole('button', { name: 'Pausar' }))
  expect(await screen.findByRole('button', { name: 'Pausando…' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Rodar agora' }).hasAttribute('disabled')).toBe(true)
  release()
  expect(await screen.findByRole('button', { name: 'Retomar' })).toBeTruthy()
})

test('uma automação que o Hub não tem mais sai da lista, e a lista é lida de novo', async () => {
  const held = { automations: [automation(), automation({ id: METAS, name: 'Metas da semana' })] }
  automationsHub(server, {
    ...held,
    answers: {
      write: () => {
        held.automations.splice(0, 1)
        return refusal('AUTOMATION_NOT_FOUND')
      },
    },
  })
  at(LIST)
  const resumo = (await screen.findByText('Resumo de vendas')).closest('li')
  if (resumo === null) throw new Error('the row is missing')
  fireEvent.click(within(resumo).getByRole('button', { name: 'Pausar' }))
  await waitFor(() => expect(screen.queryByText('Resumo de vendas')).toBeNull())
  expect(screen.getByText('Metas da semana')).toBeTruthy()
})

test('enquanto a lista não chega ela está em esqueleto, e se a leitura falha diz a frase com Tentar de novo', async () => {
  let failing = true
  automationsHub(server, { automations: [automation()] })
  server.use(
    http.get('*/api/companies/:companyId/automations', () =>
      failing
        ? refusal('DATABASE_UNAVAILABLE')
        : HttpResponse.json({ automations: [automation()] }),
    ),
  )
  at(LIST)
  const retry = await screen.findByRole('button', { name: 'Tentar de novo' })
  failing = false
  fireEvent.click(retry)
  expect(await screen.findByText('Resumo de vendas')).toBeTruthy()
})

test('o nome do Projeto vem da leitura dele, também quando não está na primeira página dos Projetos', async () => {
  automationsHub(server, { automations: [automation({ projectId: PEDIDOS.id })] })
  at(`${COMPANY_ROOT}/projects/${PEDIDOS.id}/automations`)
  server.use(
    http.get(`*/api/companies/${COMPANY.id}/projects`, () =>
      HttpResponse.json({ projects: [], next: { kind: 'END' }, databaseReady: true }),
    ),
  )
  expect(await screen.findByText(/Todo dia às 07:00 · Próxima: .* · Pedidos/)).toBeTruthy()
})

test('o Projeto apagado: a página de Automações dele dá não encontrado', async () => {
  automationsHub(server, { automations: [] })
  at(`${COMPANY_ROOT}/projects/${PEDIDOS.id}/automations`)
  server.use(refusedProject)
  expect(await screen.findByText('Não encontramos o que você procurou.')).toBeTruthy()
})
