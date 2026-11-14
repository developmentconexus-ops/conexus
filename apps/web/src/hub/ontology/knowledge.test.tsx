import { fireEvent, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'
import { hubServer } from '../../platform/test-hub.tsx'
import { conceptRow, KNOWLEDGE, onPhone, openKnowledge, page, view } from './test-hub.tsx'

// Conhecimento: the rail, Conceitos, a concept's page and Histórico (A Ontologia da empresa, U4).
const server = hubServer()

test('Conhecimento: todo membro tem a entrada e abre em Conceitos', async () => {
  openKnowledge(
    server,
    { view: view({ mayApprove: false, awaits: 'APPROVER' }) },
    KNOWLEDGE,
    'member',
  )
  expect(await screen.findByRole('heading', { name: 'Conhecimento' })).toBeTruthy()
  expect(screen.getAllByRole('link', { name: 'Conhecimento' }).length).toBeGreaterThan(0)
  expect(screen.getByText('Como a empresa é')).toBeTruthy()
  expect(await screen.findByText('Nenhum fluxo ainda.')).toBeTruthy()
  expect(screen.getByText(/entram com a etapa O fluxo da empresa/)).toBeTruthy()
})

test('Conceitos: a lista traz o papel com o nome da base, as contagens e a revisão', async () => {
  openKnowledge(server, { view: view() }, KNOWLEDGE)
  const cliente = (await screen.findByRole('link', { name: 'Cliente' })).closest('tr')
  if (!(cliente instanceof HTMLElement)) throw new Error('no row')
  expect(within(cliente).getByText('papel de parceiro')).toBeTruthy()
  expect(screen.getByText(/Revisão atual: 2, aprovada por Administrador/)).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Ver o histórico' })).toBeTruthy()
})

test('Conceitos: sem conceito aprovado, a frase de primeira vez', async () => {
  openKnowledge(server, { view: view({ concepts: [], revision: null }) }, KNOWLEDGE)
  expect(
    await screen.findByText(
      'Nenhum conceito aprovado ainda. O Builder propõe conceitos quando você pede um app.',
    ),
  ).toBeTruthy()
})

test('Conceitos: a 390 px cada conceito é um cartão com as contagens', async () => {
  await onPhone(async () => {
    openKnowledge(server, { view: view() }, KNOWLEDGE)
    expect(await screen.findByText('1 campo · 0 códigos · ativo')).toBeTruthy()
  })
})

test('a aba fica no endereço: Para revisar traz a contagem', async () => {
  openKnowledge(server, { view: view({ toReview: 2 }) }, `${KNOWLEDGE}?aba=historico`)
  expect(await screen.findByText('Nenhuma revisão ainda.')).toBeTruthy()
  expect(screen.getByRole('tab', { name: /Para revisar/ }).textContent).toContain('2')
  fireEvent.click(screen.getByRole('tab', { name: /Para revisar/ }))
  expect(await screen.findByText('Nada para revisar.')).toBeTruthy()
})

test('a página de um conceito: o que é, de onde lê, a prova e os campos', async () => {
  openKnowledge(server, { view: view(), concepts: { documento: page() } }, `${KNOWLEDGE}/documento`)
  expect(await screen.findByRole('heading', { name: 'Documento' })).toBeTruthy()
  expect(
    screen.getByText(/Também: venda · chave: Número único · mostra: Número do documento/),
  ).toBeTruthy()
  expect(screen.getByText('Prova: 1.240 linhas em', { exact: false })).toBeTruthy()
  expect(screen.getByText('Tipo de operação')).toBeTruthy()
  expect(screen.getAllByRole('button', { name: 'Sugerir mudança' }).length).toBeGreaterThan(0)
})

test('um papel diz de que conceito é, com o link para a base', async () => {
  const role = conceptRow({ key: 'cliente', name: 'Cliente', base: 'parceiro' })
  openKnowledge(
    server,
    { view: view(), concepts: { cliente: page({ concept: role }) } },
    `${KNOWLEDGE}/cliente`,
  )
  expect(await screen.findByText(/Papel de/)).toBeTruthy()
})

test('um conceito que saiu: a frase da matriz e o caminho de volta', async () => {
  openKnowledge(server, { view: view(), concepts: {} }, `${KNOWLEDGE}/fantasma`)
  expect(await screen.findByText('Este conceito não existe.')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Voltar aos conceitos' })).toBeTruthy()
})

test('um código que saiu: a frase da matriz e Voltar ao conceito', async () => {
  openKnowledge(
    server,
    { view: view(), concepts: { documento: page() } },
    `${KNOWLEDGE}/documento?campo=sumiu`,
  )
  expect(await screen.findByText('Este código não existe mais.')).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Voltar ao conceito' })).toBeTruthy()
})
