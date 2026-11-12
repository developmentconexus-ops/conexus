import { getProfileMemory, setProfileMemory } from '@conexus/hub-api'
import { createMemoryHistory } from '@tanstack/react-router'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { expect, test } from 'vitest'
import { Conexus, createConexus } from '../../main.tsx'
import { ANA, COMPANY } from '../../platform/fixtures.ts'
import { sentenceOfCode } from '../../platform/hub.ts'
import { companyRead, hubServer, refusal, sessionRead } from '../../platform/test-hub.tsx'

const server = hubServer()
const PAGE = `/companies/${COMPANY.id}/settings/account`
const PATH = `*/api/companies/${COMPANY.id}/assistant/profile-memory`
const TITLE = 'O que o Assistente lembra de você'
const EMPTY =
  'O Assistente ainda não guardou nada sobre você. Ele guarda o que você pedir para lembrar, e o que aprender nas conversas.'
const KEPT = 'Acompanha a linha de bebidas.'
const UNSAVED = 'Não confirmamos se a memória foi salva. Confira o texto e tente de novo.'

type Hub = { text: string | null; reads: number; writes: unknown[]; erased: number }

/** Sua conta as a member opens it: the person's own memory, never another's, so no role refuses it. */
function open(text: string | null, read?: Parameters<typeof http.get>[1]) {
  const hub: Hub = { text, reads: 0, writes: [], erased: 0 }
  server.use(
    sessionRead(() => ANA),
    ...companyRead({ role: 'member' }),
    http.get(
      PATH,
      read ??
        (() => {
          hub.reads += 1
          return HttpResponse.json(getProfileMemory.success.body.parse({ text: hub.text }))
        }),
    ),
    http.put(PATH, async ({ request }) => {
      const body = setProfileMemory.input.body.parse(await request.json())
      hub.writes.push(body)
      hub.text = body.text
      return HttpResponse.json(setProfileMemory.success.body.parse(body))
    }),
    http.delete(PATH, () => {
      hub.erased += 1
      hub.text = null
      return new HttpResponse(null, { status: 204 })
    }),
  )
  render(<Conexus conexus={createConexus(createMemoryHistory({ initialEntries: [PAGE] }))} />)
  return hub
}

async function section() {
  return within(await screen.findByRole('region', { name: TITLE }))
}

async function box(): Promise<HTMLTextAreaElement> {
  const found = await (await section()).findByRole('textbox', { name: TITLE })
  if (!(found instanceof HTMLTextAreaElement)) throw new Error('the memory is not a text box')
  return found
}

test('carregando: o texto carregando no lugar da caixa', async () => {
  const { promise: held, resolve: release } = Promise.withResolvers<void>()
  open(null, async () => {
    await held
    return HttpResponse.json({ text: KEPT })
  })
  const shown = await section()
  expect(shown.getByRole('status', { name: 'Carregando' })).toBeTruthy()
  expect(shown.queryByRole('textbox')).toBeNull()
  release()
  expect((await box()).value).toBe(KEPT)
})

test('primeira vez e vazio: a frase do vazio, a caixa vazia e nada para apagar', async () => {
  open(null)
  const shown = await section()
  expect(await shown.findByText(EMPTY)).toBeTruthy()
  expect((await box()).value).toBe('')
  expect(shown.queryByRole('button', { name: 'Apagar tudo' })).toBeNull()
})

test('com texto: o texto na caixa, a contagem do teto e Apagar tudo', async () => {
  open(KEPT)
  expect((await box()).value).toBe(KEPT)
  const shown = await section()
  expect(shown.getByText(`${KEPT.length} / 4.000`)).toBeTruthy()
  expect(shown.queryByText(EMPTY)).toBeNull()
  expect(shown.getByRole('button', { name: 'Apagar tudo' })).toBeTruthy()
})

test('editando: Cancelar aparece com a mudança e volta ao texto guardado', async () => {
  open(KEPT)
  const field = await box()
  const shown = await section()
  expect(shown.queryByRole('button', { name: 'Cancelar' })).toBeNull()
  fireEvent.change(field, { target: { value: 'Acompanha a linha de sucos.' } })
  expect(await shown.findByText('27 / 4.000')).toBeTruthy()
  fireEvent.click(shown.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(field.value).toBe(KEPT))
  expect(shown.queryByRole('button', { name: 'Cancelar' })).toBeNull()
})

test('salvando: Salvando… enquanto grava, e a caixa mostra o que ficou ao reler', async () => {
  const hub = open(KEPT)
  const { promise: held, resolve: release } = Promise.withResolvers<void>()
  server.use(
    http.put(PATH, async ({ request }) => {
      const body = setProfileMemory.input.body.parse(await request.json())
      await held
      hub.writes.push(body)
      hub.text = body.text
      return HttpResponse.json(body)
    }),
  )
  const corrected = 'Acompanha a linha de bebidas e de sucos.'
  fireEvent.change(await box(), { target: { value: corrected } })
  const shown = await section()
  fireEvent.click(shown.getByRole('button', { name: 'Salvar' }))
  expect(await shown.findByRole('button', { name: 'Salvando…' })).toBeTruthy()
  release()
  await waitFor(() => expect(hub.writes).toEqual([{ text: corrected }]))
  await waitFor(() => expect(hub.reads).toBeGreaterThan(1))
  expect(await shown.findByRole('button', { name: 'Salvar' })).toBeTruthy()
  expect((await box()).value).toBe(corrected)
  expect(shown.queryByRole('button', { name: 'Cancelar' })).toBeNull()
})

test('erro na leitura: "Não foi possível ler a memória." com Tentar de novo, que relê', async () => {
  let failing = true
  open(null, () => (failing ? refusal('DATABASE_UNAVAILABLE') : HttpResponse.json({ text: KEPT })))
  const shown = await section()
  expect(await shown.findByText('Não foi possível ler a memória.')).toBeTruthy()
  failing = false
  fireEvent.click(shown.getByRole('button', { name: 'Tentar de novo' }))
  expect((await box()).value).toBe(KEPT)
})

test('erro na gravação: a recusa do Hub com a frase do código, e o texto da pessoa fica na caixa', async () => {
  open(KEPT)
  server.use(http.put(PATH, () => refusal('NOT_FOUND')))
  fireEvent.change(await box(), { target: { value: 'Outra coisa.' } })
  const shown = await section()
  fireEvent.click(shown.getByRole('button', { name: 'Salvar' }))
  expect(await shown.findByText(sentenceOfCode('NOT_FOUND'))).toBeTruthy()
  expect((await box()).value).toBe('Outra coisa.')
})

test('erro na gravação: a resposta cortada diz que não confirmou', async () => {
  open(KEPT)
  server.use(http.put(PATH, () => new HttpResponse('{"text"', { status: 200 })))
  fireEvent.change(await box(), { target: { value: 'Outra coisa.' } })
  const shown = await section()
  fireEvent.click(shown.getByRole('button', { name: 'Salvar' }))
  expect(await shown.findByText(UNSAVED)).toBeTruthy()
})

test('sem rede na gravação: a tela diz que não confirmou', async () => {
  open(KEPT)
  fireEvent.change(await box(), { target: { value: 'Outra coisa.' } })
  server.use(http.put(PATH, () => HttpResponse.error()))
  const shown = await section()
  fireEvent.click(shown.getByRole('button', { name: 'Salvar' }))
  expect(await shown.findByText(UNSAVED)).toBeTruthy()
})

test('sem rede na leitura: "Não foi possível ler a memória." com Tentar de novo', async () => {
  open(null, () => HttpResponse.error())
  const shown = await section()
  expect(await shown.findByText('Não foi possível ler a memória.')).toBeTruthy()
  expect(shown.getByRole('button', { name: 'Tentar de novo' })).toBeTruthy()
})

test('acima do teto de texto: a frase do campo, e nada é gravado', async () => {
  const hub = open(KEPT)
  fireEvent.change(await box(), { target: { value: 'a'.repeat(4001) } })
  const shown = await section()
  expect(await shown.findByText('4.001 / 4.000')).toBeTruthy()
  fireEvent.click(shown.getByRole('button', { name: 'Salvar' }))
  expect(await shown.findByText('Escreva até 4.000 caracteres.')).toBeTruthy()
  expect(hub.writes).toEqual([])
})

test('apagar com confirmação: Apagar tudo pergunta antes, apaga e mostra a frase do vazio', async () => {
  const hub = open(KEPT)
  const shown = await section()
  fireEvent.click(await shown.findByRole('button', { name: 'Apagar tudo' }))
  const dialog = within(await screen.findByRole('alertdialog'))
  expect(dialog.getByText('Apagar o que o Assistente lembra de você?')).toBeTruthy()
  fireEvent.click(dialog.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(hub.erased).toBe(0)

  fireEvent.click(shown.getByRole('button', { name: 'Apagar tudo' }))
  const again = within(await screen.findByRole('alertdialog'))
  fireEvent.click(again.getByRole('button', { name: 'Apagar tudo' }))
  expect(await shown.findByText(EMPTY)).toBeTruthy()
  expect(hub.erased).toBe(1)
  expect(hub.writes).toEqual([])
  expect((await box()).value).toBe('')
})

test('sem permissão: não acontece, o membro lê, corrige e apaga a sua', async () => {
  const hub = open(KEPT)
  const shown = await section()
  const field = await box()
  expect(field.disabled).toBe(false)
  fireEvent.change(field, { target: { value: 'Acompanha sucos.' } })
  fireEvent.click(shown.getByRole('button', { name: 'Salvar' }))
  await waitFor(() => expect(hub.writes).toEqual([{ text: 'Acompanha sucos.' }]))
})
