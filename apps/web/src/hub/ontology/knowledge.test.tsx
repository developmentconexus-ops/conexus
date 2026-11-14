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

test('Conceitos: a coluna Lido de traz a conexão de cada conceito, e um traço sem fonte', async () => {
  openKnowledge(
    server,
    {
      view: view({
        concepts: [conceptRow(), conceptRow({ key: 'origem', name: 'Origem', source: null })],
      }),
    },
    KNOWLEDGE,
  )
  expect(await screen.findByRole('columnheader', { name: 'Lido de' })).toBeTruthy()
  const documento = screen.getByRole('link', { name: 'Documento' }).closest('tr')
  const origem = screen.getByRole('link', { name: 'Origem' }).closest('tr')
  if (!(documento instanceof HTMLElement) || !(origem instanceof HTMLElement))
    throw new Error('no row')
  expect(within(documento).getByText('Sankhya Matriz')).toBeTruthy()
  expect(within(origem).queryByText('Sankhya Matriz')).toBeNull()
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
    expect(screen.getAllByText('Lido de Sankhya Matriz').length).toBe(2)
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

test('a página diz de onde lê pelo nome da conexão, e a consulta abre sob Ver a consulta', async () => {
  openKnowledge(server, { view: view(), concepts: { documento: page() } }, `${KNOWLEDGE}/documento`)
  expect(await screen.findByText('Sankhya Matriz')).toBeTruthy()
  expect(screen.queryByText('SELECT NUNOTA FROM TGFCAB')).toBeNull()
  fireEvent.click(screen.getByText('Ver a consulta'))
  expect(await screen.findByText('SELECT NUNOTA FROM TGFCAB')).toBeTruthy()
})

test('a conexão que saiu: a página diz isso e não um traço', async () => {
  const gone = page()
  openKnowledge(
    server,
    {
      view: view(),
      concepts: {
        documento: { ...gone, source: gone.source && { ...gone.source, connectionName: null } },
      },
    },
    `${KNOWLEDGE}/documento`,
  )
  expect(await screen.findByText('uma conexão que saiu')).toBeTruthy()
})

test('a 390 px a página do conceito é uma lista de linhas "Nome · tipo", com Ver e sugerir à vista', async () => {
  await onPhone(async () => {
    openKnowledge(
      server,
      { view: view(), concepts: { documento: page() } },
      `${KNOWLEDGE}/documento`,
    )
    expect(await screen.findByText('Número único · código')).toBeTruthy()
    expect(screen.getByText('Tipo de operação · lista')).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getByRole('link', { name: 'Ver e sugerir' })).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Sugerir mudança' })).toHaveLength(1)
  })
})

test('a 390 px os códigos são cartões, cada um com Sugerir mudança dentro da tela', async () => {
  await onPhone(async () => {
    openKnowledge(
      server,
      { view: view(), concepts: { documento: page() } },
      `${KNOWLEDGE}/documento?campo=tipo`,
    )
    expect(await screen.findByText('Documento › Tipo de operação')).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
    expect(screen.getByText('Venda tirada fora da loja.')).toBeTruthy()
    expect(screen.getAllByRole('button', { name: 'Sugerir mudança' })).toHaveLength(3)
    const [first] = screen.getAllByRole('button', { name: 'Sugerir mudança' })
    if (first === undefined) throw new Error('no button')
    fireEvent.click(first)
    expect(await screen.findByLabelText('Sugerir mudança no 100')).toBeTruthy()
  })
})

test('a página não termina num link solto "Conceitos": as abas levam de volta', async () => {
  openKnowledge(server, { view: view(), concepts: { documento: page() } }, `${KNOWLEDGE}/documento`)
  await screen.findByRole('heading', { name: 'Documento' })
  expect(screen.queryByRole('link', { name: 'Conceitos' })).toBeNull()
})
