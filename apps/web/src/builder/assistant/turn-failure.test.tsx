import { screen } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { START_NO_ACCOUNT } from '../conversation/public.ts'
import { stepStarted } from '../conversation/test-events.ts'
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

test('o turno com as contas no limite diz o limite e o que fazer, não que falta conta', async () => {
  const line = await running(at(OPEN, { conversations: [assistantConversation()] }))
  line.emit(
    stepStarted(`${ASKED}:failure`, [
      { type: 'data-conexus-failure', data: { code: 'MODEL_ACCOUNTS_LIMITED' } },
    ]),
  )
  expect(
    await screen.findByText(
      'As contas que você pode usar para este modelo estão no limite. Espere o limite passar ou escolha outro modelo.',
    ),
  ).toBeTruthy()
  expect(screen.queryByText(START_NO_ACCOUNT)).toBeNull()
})
