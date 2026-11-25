import { FAILURES } from '@conexus/hub-api'
import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { LIST, lakeRun, lakeTable, openData } from './test-hub.tsx'

// The page of one lake table: its label first, four tabs, the rounds with the machine (criteria 55 and 119).
const server = hubServer()

const TABLE = lakeTable()
const ADDRESS = `${LIST}/lake/${TABLE.id}`
const OTHER = '44444444-4444-4444-8444-444444444444'

type Held = Parameters<typeof openData>[1]

async function page(held: Held, address = ADDRESS) {
  openData(server, { tables: [TABLE], ...held }, address)
  await screen.findByRole('heading', { name: TABLE.label })
  return within(screen.getByRole('main'))
}

async function tab(held: Held, name: string) {
  const main = await page(held)
  fireEvent.click(main.getByRole('tab', { name }))
  return main
}

const MACHINE = {
  allocated: { vcpu: 1, memoryMib: 2048 },
  peak: { vcpu: 1, memoryMib: 771 },
  everySeconds: 5,
  samples: [],
}

test('a página mostra o rótulo primeiro, o nome no lago e a origem embaixo, e as quatro abas (critério 55)', async () => {
  const main = await page({})
  const title = main.getByRole('heading', { name: 'Notas e pedidos' })
  const head = title.parentElement
  if (head === null) throw new Error('the head')
  expect(head.textContent).toBe('Matriz · LagoNotas e pedidossankhya_notasSankhya · TGFCABEm dia')
  expect(main.getAllByRole('tab').map((one) => one.textContent)).toEqual([
    'Visão geral',
    'Colunas',
    'Rodadas',
    'Detalhes',
  ])
  expect(main.getByRole('link', { name: 'Dados' }).getAttribute('href')).toBe(LIST)
})

test('Visão geral: a última rodada pelo tipo, as linhas, as colunas e a próxima rodada', async () => {
  const main = await page({ tables: [lakeTable({ lastRun: lakeRun({ whole: true }) })] })
  const facts = main.getByRole('tabpanel')
  expect(facts.textContent).toBe(
    [
      'Última rodada',
      'Em dia',
      '02/11 10:02',
      'Completa · inteira',
      'Linhas no lago',
      '118.402',
      'Colunas',
      '2',
      'Próxima rodada',
      '03/11 10:00',
      'Intervalo',
      '24 h',
    ].join(''),
  )
})

test('Visão geral: uma tabela só manual diz Só manual na próxima rodada', async () => {
  const main = await page({ tables: [lakeTable({ interval: 'MANUAL', next: null })] })
  expect(
    within(main.getByRole('tabpanel')).getByText('Só manual', { selector: 'span' }),
  ).toBeTruthy()
})

test('Colunas: o nome, o tipo e a descrição de cada uma', async () => {
  const main = await tab({}, 'Colunas')
  const table = await main.findByRole('table', { name: 'Colunas da tabela' })
  const rows = within(table).getAllByRole('row').slice(1)
  expect(
    rows.map((row) => {
      const cells = within(row).getAllByRole('cell')
      return [
        within(row).getByText(/^[A-Z]+$/).textContent,
        cells[1]?.textContent,
        cells[2]?.textContent,
      ]
    }),
  ).toEqual([
    ['NUNOTA', 'inteiro', 'Chave da nota'],
    ['DTALTER', 'data e hora', ''],
  ])
  expect(main.getByText('2 colunas')).toBeTruthy()
})

test('Rodadas: cada rodada diz Completa · inteira ou Completa · só o que mudou, pelo whole', async () => {
  const runs = [
    lakeRun({ id: '55555555-5555-4555-8555-555555555551', whole: false }),
    lakeRun({
      id: '55555555-5555-4555-8555-555555555552',
      whole: true,
      startedAt: '2026-11-01T13:00:00.000Z',
      endedAt: '2026-11-01T13:41:00.000Z',
    }),
  ]
  const main = await tab({ runs: { [TABLE.id]: runs } }, 'Rodadas')
  const table = await main.findByRole('table', { name: 'Rodadas da tabela' })
  const kinds = within(table)
    .getAllByText(/^Completa · /)
    .map((cell) => cell.textContent)
  expect(kinds).toEqual(['Completa · só o que mudou', 'Completa · inteira'])
  expect(within(table).getByText('2 min 14 s')).toBeTruthy()
  expect(within(table).getByText('41 min')).toBeTruthy()
})

test('Rodadas: sem rodada, "Esta tabela ainda não rodou."; a rodada aberta diz Rodando… sem linhas', async () => {
  const none = await tab({ runs: { [TABLE.id]: [] } }, 'Rodadas')
  expect(await none.findByText('Esta tabela ainda não rodou.')).toBeTruthy()
})

test('Rodadas: a rodada aberta diz Rodando…, sem linhas nem Máquina', async () => {
  const open = { ...lakeRun(), outcome: 'RUNNING', endedAt: undefined, read: undefined }
  const main = await tab({ runs: { [TABLE.id]: [lakeRun(open)] } }, 'Rodadas')
  const table = await main.findByRole('table', { name: 'Rodadas da tabela' })
  expect(within(table).getByText('Rodando…')).toBeTruthy()
  expect(within(table).queryByRole('button', { name: 'Máquina' })).toBeNull()
})

test('Rodadas: a rodada com erro diz a frase do código, onde parou e a resposta do sistema por extenso', async () => {
  const failed = lakeRun({
    outcome: 'ERROR',
    code: 'COPY_SOURCE_UNREACHABLE',
    failedTable: 'sankhya_notas',
    system: { status: 504, code: 'GATEWAY', message: 'O gateway respondeu 504 depois de 60 s.' },
  })
  const main = await tab({ runs: { [TABLE.id]: [failed] } }, 'Rodadas')
  const alert = await main.findByRole('alert')
  expect(alert.textContent).toBe(
    'Parou em sankhya_notas. Sankhya não respondeu. A próxima rodada tenta de novo.' +
      'O sistema disse: 504 GATEWAY · O gateway respondeu 504 depois de 60 s.',
  )
})

test('Rodadas: a rodada interrompida diz Interrompida.', async () => {
  const main = await tab({ runs: { [TABLE.id]: [lakeRun({ outcome: 'INTERRUPTED' })] } }, 'Rodadas')
  expect(await main.findByText('Interrompida.')).toBeTruthy()
})

test('Rodadas: a falha de ler as rodadas diz a frase e Tentar de novo', async () => {
  let fail = true
  const main = await tab(
    {
      runs: { [TABLE.id]: [lakeRun()] },
      runsAnswer: () => (fail ? refusal('DATABASE_UNAVAILABLE') : undefined),
    },
    'Rodadas',
  )
  expect((await main.findByRole('alert')).textContent).toBe(
    'Não deu para ler as rodadas agora. Tente de novo em instantes.',
  )
  fail = false
  fireEvent.click(main.getByRole('button', { name: 'Tentar de novo' }))
  expect(await main.findByRole('table', { name: 'Rodadas da tabela' })).toBeTruthy()
})

test('Rodadas: cada rodada abre Máquina com o tamanho, a duração e os picos com a fração (critério 119)', async () => {
  const run = lakeRun({
    startedAt: '2026-11-02T13:00:00.000Z',
    endedAt: '2026-11-02T13:09:48.000Z',
    machine: MACHINE,
  })
  const main = await tab(
    { tables: [TABLE, lakeTable({ id: OTHER, name: 'sankhya_x' })], runs: { [TABLE.id]: [run] } },
    'Rodadas',
  )
  const trigger = await main.findByRole('button', { name: 'Máquina' })
  expect(main.queryByText('771 MB · 38% de 2 GB')).toBeNull()
  fireEvent.click(trigger)
  const body = (await main.findByText('Tamanho')).closest('dl')?.parentElement
  if (!body) throw new Error('the machine')
  expect(body.textContent).toBe(
    [
      'Tamanho',
      '1 vCPU · 2 GB',
      'Duração',
      '9 min 48 s',
      'Pico de memória',
      '771 MB · 38% de 2 GB',
      'Pico de CPU',
      '1,0 vCPU · 100%',
      'Da rodada inteira, com as 2 tabelas dela.',
    ].join(''),
  )
})

test('Máquina arredonda a fração ao inteiro e o pico de CPU a uma casa', async () => {
  const run = lakeRun({
    machine: {
      ...MACHINE,
      allocated: { vcpu: 2, memoryMib: 4096 },
      peak: { vcpu: 0.62, memoryMib: 745 },
    },
  })
  const main = await tab({ runs: { [TABLE.id]: [run] } }, 'Rodadas')
  fireEvent.click(await main.findByRole('button', { name: 'Máquina' }))
  expect(await main.findByText('745 MB · 18% de 4 GB')).toBeTruthy()
  expect(main.getByText('0,6 vCPU · 31%')).toBeTruthy()
  expect(main.getByText('2 vCPU · 4 GB')).toBeTruthy()
  expect(main.getByText('Da rodada inteira, com a única tabela dela.')).toBeTruthy()
})

test('a rodada sem medida diz "Sem medida da máquina nesta rodada." e nenhum número', async () => {
  const main = await tab({ runs: { [TABLE.id]: [lakeRun({ machine: null })] } }, 'Rodadas')
  fireEvent.click(await main.findByRole('button', { name: 'Máquina' }))
  expect(await main.findByText('Sem medida da máquina nesta rodada.')).toBeTruthy()
  expect(main.queryByText('Pico de memória')).toBeNull()
  expect(main.queryByText(/vCPU/)).toBeNull()
})

test('Detalhes: o modo, a data que limita, o histórico e onde ficam as linhas; sem Amostra, Quem lê nem Projetos', async () => {
  const main = await tab({ tables: [lakeTable({ startDate: '2021-11-24' })] }, 'Detalhes')
  const panel = main.getByRole('tabpanel')
  expect(panel.textContent).toBe(
    [
      'Nome no lago',
      'sankhya_notas',
      ' · o nome não muda mais',
      'Origem',
      'TGFCAB',
      ' · Sankhya',
      'Ligação',
      'Matriz',
      'Modo',
      'Só o que mudou, por DTALTER',
      'Data inicial',
      'Desde 24/11/2021',
      'Histórico',
      'Só a versão de hoje',
      'As linhas ficam no lago da empresa.',
    ].join(''),
  )
  for (const absent of ['Amostra', 'Quem lê', 'Projetos']) {
    expect(main.queryByText(absent)).toBeNull()
    expect(main.queryByRole('tab', { name: absent })).toBeNull()
  }
})

test('Detalhes: uma tabela que a data não limita diz Todo o histórico', async () => {
  const main = await tab(
    { tables: [lakeTable({ mode: { kind: 'FULL' }, startDate: null })] },
    'Detalhes',
  )
  expect(within(main.getByRole('tabpanel')).getByText('Todo o histórico')).toBeTruthy()
  expect(main.getByText('Inteira')).toBeTruthy()
})

test('uma tabela que saiu da lista diz que não é mais copiada', async () => {
  openData(server, { tables: [] }, ADDRESS)
  expect(await screen.findByText('Esta tabela não é mais copiada.')).toBeTruthy()
})

test('um endereço que não é de uma tabela é a página que não existe', async () => {
  openData(server, { tables: [TABLE] }, `${LIST}/lake/nao-e-um-id`)
  expect(await screen.findByText(FAILURES.NOT_FOUND.phrase)).toBeTruthy()
})
