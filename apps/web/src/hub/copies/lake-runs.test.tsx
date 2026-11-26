import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { LIST, lakeRun, lakeTable, openData } from './test-hub.tsx'

// What a round that did not complete says on the page of a lake table: the sentence of its code, the system's answer and the kind of read.
const server = hubServer()

const TABLE = lakeTable()

type Held = Parameters<typeof openData>[1]

async function page(held: Held) {
  openData(server, { tables: [TABLE], ...held }, `${LIST}/lake/${TABLE.id}`)
  await screen.findByRole('heading', { name: TABLE.label })
  return within(screen.getByRole('main'))
}

async function tab(held: Held, name: string) {
  const main = await page(held)
  fireEvent.click(main.getByRole('tab', { name }))
  return main
}

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
      'Sankhya respondeu 504, código GATEWAY: O gateway respondeu 504 depois de 60 s.',
  )
})

test('Rodadas: a rodada com erro de código do Hub ou da AWS diz só a frase da matriz, nunca o texto do system', async () => {
  const lost = lakeRun({
    outcome: 'ERROR',
    code: 'COPY_TASK_LOST',
    failedTable: null,
    system: { status: null, code: null, message: 'Essential container in task exited' },
  })
  const main = await tab({ runs: { [TABLE.id]: [lost] } }, 'Rodadas')
  const alert = await main.findByRole('alert')
  expect(alert.textContent).toBe('A cópia parou antes de terminar. A próxima rodada tenta de novo.')
  expect(main.queryByText(/Essential container/)).toBeNull()
  expect(main.queryByText(/respondeu/)).toBeNull()
})

test('Rodadas: o código da AWS que não grava no lago também não mostra o system', async () => {
  const failed = lakeRun({
    outcome: 'ERROR',
    code: 'COPY_LAKE_WRITE_FAILED',
    failedTable: null,
    system: { status: null, code: null, message: 'AccessDenied' },
  })
  const main = await tab({ runs: { [TABLE.id]: [failed] } }, 'Rodadas')
  expect((await main.findByRole('alert')).textContent).toBe(
    'Não deu para gravar no lago. A próxima rodada tenta de novo.',
  )
})

test('Rodadas: um sistema que não é HTTP e respondeu só com a mensagem diz o nome do sistema', async () => {
  const failed = lakeRun({
    outcome: 'ERROR',
    code: 'COPY_SOURCE_REFUSED',
    failedTable: null,
    system: { status: null, code: null, message: 'Conexão recusada' },
  })
  const main = await tab({ runs: { [TABLE.id]: [failed] } }, 'Rodadas')
  expect((await main.findByRole('alert')).textContent).toBe(
    'Sankhya recusou a leitura.Sankhya respondeu: Conexão recusada',
  )
})

test('Rodadas: a rodada interrompida diz Interrompida. e só o tipo da leitura, sem Completa', async () => {
  const main = await tab(
    { runs: { [TABLE.id]: [lakeRun({ outcome: 'INTERRUPTED', whole: false })] } },
    'Rodadas',
  )
  expect(await main.findByText('Interrompida.')).toBeTruthy()
  expect(main.getByText('Só o que mudou')).toBeTruthy()
  expect(main.queryByText(/Completa/)).toBeNull()
})

test('Rodadas: a rodada com erro diz Inteira, sem Completa', async () => {
  const failed = lakeRun({
    outcome: 'ERROR',
    code: 'COPY_TASK_LOST',
    failedTable: null,
    system: null,
    whole: true,
  })
  const main = await tab({ runs: { [TABLE.id]: [failed] } }, 'Rodadas')
  const table = await main.findByRole('table', { name: 'Rodadas da tabela' })
  expect(within(table).getByText('Inteira')).toBeTruthy()
  expect(within(table).queryByText(/Completa/)).toBeNull()
})

test('Visão geral: a última rodada com erro diz o tipo sem Completa', async () => {
  const failed = lakeRun({
    outcome: 'ERROR',
    code: 'COPY_TASK_LOST',
    failedTable: null,
    system: null,
    whole: true,
  })
  const main = await page({ tables: [lakeTable({ lastRun: failed })] })
  const panel = within(main.getByRole('tabpanel'))
  expect(panel.getByText('Inteira')).toBeTruthy()
  expect(panel.queryByText(/Completa/)).toBeNull()
})
