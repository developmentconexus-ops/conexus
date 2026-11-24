import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { START_NO_ACCOUNT } from '../../harness/room/public.ts'
import { stepStarted } from '../../harness/room/test-events.ts'
import { hubServer } from '../../platform/test-hub.tsx'
import {
  ASKED,
  assistantConversation,
  assistantScreens,
  COMPANY_ROOT,
  running,
} from './test-hub.tsx'

const { at } = assistantScreens(hubServer())
const OPEN = `${COMPANY_ROOT}/conversations/${ASKED}`

test('o turno sem conta de modelo diz a frase do Início, sem mandar escolher outro modelo (QA F6)', async () => {
  const line = await running(at(OPEN, { conversations: [assistantConversation()] }))
  line.emit(
    stepStarted(`${ASKED}:failure`, [
      { type: 'data-conexus-failure', data: { code: 'MODEL_NO_ACCOUNT' } },
    ]),
  )
  expect(await screen.findByText(START_NO_ACCOUNT)).toBeTruthy()
  expect(screen.queryByText(/Escolha outro modelo/)).toBeNull()
})

const ACCOUNTS = [
  [
    'MODEL_ACCOUNTS_LIMITED',
    'As contas que você pode usar para este modelo estão no limite. Espere o limite passar ou escolha outro modelo.',
  ],
  [
    'MODEL_ACCOUNTS_NO_CREDIT',
    'As contas que você pode usar para este modelo estão sem crédito. Confira o crédito da conta no fornecedor ou escolha outro modelo.',
  ],
  [
    'MODEL_ACCOUNTS_REFUSED',
    'As contas que você pode usar para este modelo foram recusadas. Ligue a conta de novo em Minhas contas de modelo ou escolha outro modelo.',
  ],
] as const

test.each(ACCOUNTS)(
  'o turno que termina em %s diz o estado das contas e o que fazer, não que falta conta',
  async (code, sentence) => {
    const line = await running(at(OPEN, { conversations: [assistantConversation()] }))
    line.emit(stepStarted(`${ASKED}:failure`, [{ type: 'data-conexus-failure', data: { code } }]))
    expect(await screen.findByText(sentence)).toBeTruthy()
    expect(screen.queryByText(START_NO_ACCOUNT)).toBeNull()
  },
)
