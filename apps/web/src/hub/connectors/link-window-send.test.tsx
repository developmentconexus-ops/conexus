import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer, refusal } from '../../platform/test-hub.tsx'
import { connectionOf } from './fixtures.ts'
import { readyLake } from './lake-fixtures.ts'
import type { Answers } from './test-hub.tsx'
import { fill, openForm, openIntegrations, viewOf } from './test-hub.tsx'

const server = hubServer()
const NEXT_STEPS =
  'Quando a outra pessoa enviar, a ligação nova aparece em Integrações. Abra-a e clique em Escolher o que copiar.'

async function toSend(answers: Answers = {}) {
  const sent = openIntegrations(server, viewOf({ lake: readyLake() }), answers)
  const dialog = await openForm()
  fill('Comercial')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Enviar link' }))
  return { sent, dialog }
}

test('enviar link: marca o que a outra pessoa preenche e o resto vai do que foi digitado; o endereço sai uma vez com Copiar e a hora', async () => {
  const { sent, dialog } = await toSend()
  const make = within(dialog).getByRole('button', { name: 'Gerar o link' })
  expect(make.hasAttribute('disabled')).toBe(true)
  expect(within(dialog).queryByText(NEXT_STEPS)).toBeNull()
  fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Client Secret' }))
  fireEvent.click(within(dialog).getByRole('checkbox', { name: 'X-Token' }))
  fireEvent.click(make)
  expect(
    await within(dialog).findByText('https://hub.example.test/connection-links/segredo'),
  ).toBeTruthy()
  expect(sent.find((one) => one.path.endsWith('/connection-links'))?.body).toEqual({
    connector: 'sankhya',
    name: 'Comercial',
    asked: ['clientSecret', 'xToken'],
    filled: { clientId: 'id-plantado-1' },
  })
  expect(within(dialog).getByText(/^Vale até \d\d:\d\d\.$/)).toBeTruthy()
  expect(within(dialog).getByText(NEXT_STEPS)).toBeTruthy()
  expect(within(dialog).getByRole('button', { name: 'Copiar' })).toBeTruthy()
  expect(
    within(dialog).getByRole('checkbox', { name: 'X-Token' }).getAttribute('aria-disabled'),
  ).toBe('true')
  fireEvent.click(within(dialog).getByRole('button', { name: 'Voltar ao acesso' }))
  expect(await within(dialog).findByLabelText('Client ID', { exact: true })).toBeTruthy()
  expect(sent.filter((one) => one.path.endsWith('/connections'))).toHaveLength(0)
})

test('enviar link: Copiar leva o endereço à área de transferência', async () => {
  const copied: string[] = []
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: (text: string) => Promise.resolve(void copied.push(text)) },
  })
  const { dialog } = await toSend()
  fireEvent.click(within(dialog).getByRole('checkbox', { name: 'X-Token' }))
  fireEvent.click(within(dialog).getByRole('button', { name: 'Gerar o link' }))
  fireEvent.click(await within(dialog).findByRole('button', { name: 'Copiar' }))
  await waitFor(() => expect(copied).toEqual(['https://hub.example.test/connection-links/segredo']))
})

test('enviar link: a recusa do Hub aparece com a frase e o botão segue, sem endereço', async () => {
  const { dialog } = await toSend({ link: () => refusal('CONNECTION_CREDENTIAL_INVALID') })
  fireEvent.click(within(dialog).getByRole('checkbox', { name: 'X-Token' }))
  fireEvent.click(within(dialog).getByRole('button', { name: 'Gerar o link' }))
  expect(
    await within(dialog).findByText('Confira os campos: cole cada chave inteira.'),
  ).toBeTruthy()
  expect(within(dialog).getByRole('button', { name: 'Gerar o link' })).toBeTruthy()
  expect(screen.queryByText(/connection-links/)).toBeNull()
})

async function toSendWithNameTaken() {
  const sent = openIntegrations(
    server,
    viewOf({ lake: readyLake(), connections: [connectionOf({ name: 'Sankhya' })] }),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Ligar outra ligação do Sankhya' }))
  const dialog = await screen.findByRole('dialog', { name: 'Ligar Sankhya' })
  fill()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Enviar link' }))
  return { sent, dialog }
}

test('enviar link: com o nome do sistema já usado o nome está à mostra, e o link sai com o que a pessoa dá', async () => {
  const { sent, dialog } = await toSendWithNameTaken()
  const name = within(dialog).getByLabelText<HTMLInputElement>('Nome da ligação')
  expect(name.value).toBe('')
  expect(within(dialog).getByText('Dê um nome à ligação, de até 60 letras.')).toBeTruthy()
  fireEvent.click(within(dialog).getByRole('checkbox', { name: 'X-Token' }))
  expect(
    within(dialog).getByRole('button', { name: 'Gerar o link' }).hasAttribute('disabled'),
  ).toBe(true)
  fireEvent.change(name, { target: { value: 'Filial' } })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Gerar o link' }))
  expect(
    await within(dialog).findByText('https://hub.example.test/connection-links/segredo'),
  ).toBeTruthy()
  expect(sent.find((one) => one.path.endsWith('/connection-links'))?.body).toMatchObject({
    name: 'Filial',
  })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Voltar ao acesso' }))
  expect((await within(dialog).findByLabelText<HTMLInputElement>('Nome da ligação')).value).toBe(
    'Filial',
  )
})

test('enviar link: repetir o nome de uma ligação do mesmo sistema é recusado no campo, sem pedir o link', async () => {
  const { sent, dialog } = await toSendWithNameTaken()
  fireEvent.click(within(dialog).getByRole('checkbox', { name: 'X-Token' }))
  fireEvent.change(within(dialog).getByLabelText('Nome da ligação'), {
    target: { value: ' Sankhya ' },
  })
  expect(
    within(dialog).getByText('Já existe uma ligação desse conector com esse nome. Dê outro nome.'),
  ).toBeTruthy()
  expect(
    within(dialog).getByRole('button', { name: 'Gerar o link' }).hasAttribute('disabled'),
  ).toBe(true)
  expect(sent.filter((one) => one.path.endsWith('/connection-links'))).toHaveLength(0)
})
