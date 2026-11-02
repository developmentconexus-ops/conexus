import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { getSession } from '@conexus/hub-api'
import type { Replies, Viewport } from './layout-harness.ts'
import { createHarness, DESKTOP, ok, PHONE, presses } from './layout-harness.ts'
import { central, companies, PROJECT_NAME } from './sweep-replies.ts'

const SIGNED_OUT: Replies = {
  'GET /api/sessions/current': ok(getSession, { state: 'SIGNED_OUT' }),
}
const HOUSE = companies([{ name: 'Empresa Teste', role: 'owner' }], false)

const harness = createHarness(import.meta.dirname)
before(() => harness.start())
after(async () => {
  await harness.stop()
  assert.deepEqual(harness.unanswered, [], 'the page asked the Hub for something no reply covers')
})

function open(path: string, viewport: Viewport, replies: Replies) {
  return harness.open(path, { viewport, replies })
}

test('o Tab passa pela entrada com o foco visível em cada parada: halo nos campos, contorno de 2px no resto', async () => {
  const page = await open('/login', DESKTOP, SIGNED_OUT)
  await page.getByRole('textbox', { name: 'E-mail' }).waitFor()
  assert.deepEqual(await presses(page, 'Tab', 5), [
    'email halo',
    'password halo',
    'Entrar solid 2px',
    'Esqueci minha senha solid 2px',
    'body',
  ])
  await page.close()
})

test('o contorno não vai ao título focado pelo programa', async () => {
  const page = await open('/', DESKTOP, HOUSE)
  await page.getByRole('button', { name: 'Conta de Ana Lima' }).waitFor()
  await page.keyboard.press('Tab')
  const outlines = await page.evaluate(() => {
    const title = document.querySelector<HTMLElement>('main h1')
    if (!title) throw new Error('the page has no title')
    const keyboard = getComputedStyle(document.activeElement ?? document.body).outlineStyle
    title.tabIndex = -1
    title.focus()
    return {
      keyboard,
      title: getComputedStyle(title).outlineStyle,
      focused: document.activeElement === title,
    }
  })
  assert.deepEqual(outlines, { keyboard: 'solid', title: 'none', focused: true })
  await page.close()
})

const RAIL = [
  'Início',
  'Novo projeto',
  PROJECT_NAME,
  'Todos os projetos',
  'Integrações',
  'Configurações',
  'Conta de Ana Lima',
].map((name) => `${name} solid 2px`)

test('o Tab passa pela barra com contorno de 2px numa tela de 1366px, antes do conteúdo', async () => {
  const page = await open('/', DESKTOP, HOUSE)
  await page.getByRole('button', { name: 'Conta de Ana Lima' }).waitFor()
  assert.deepEqual(await presses(page, 'Tab', RAIL.length), RAIL)
  await page.close()
})

test('numa tela de 390px o Tab começa em Abrir navegação e não entra na gaveta fechada', async () => {
  const page = await open('/', PHONE, HOUSE)
  await page.getByRole('heading', { name: 'Pergunte ou peça um app' }).waitFor()
  // The owner's Início opens with the preparation card, whose Continuar is the first of the content.
  // The card is not shown while its reads load, so Tab waits for it.
  await page.getByRole('link', { name: 'Continuar' }).waitFor()
  assert.deepEqual(await presses(page, 'Tab', 2), [
    'Abrir navegação solid 2px',
    'Continuar solid 2px',
  ])
  await page.close()
})

test('o menu da conta aberto pelo teclado mostra o contorno no primeiro item', async () => {
  const page = await open('/', DESKTOP, HOUSE)
  await page.getByRole('button', { name: 'Conta de Ana Lima' }).focus()
  assert.deepEqual(await presses(page, 'Enter', 1), ['Claro solid 2px inside'])
  await page.close()
})

test('a gaveta aberta pelo teclado prende o Tab, com contorno em cada parada', async () => {
  const page = await open('/', PHONE, HOUSE)
  await page.getByRole('button', { name: 'Abrir navegação' }).focus()
  assert.deepEqual(
    [...(await presses(page, 'Enter', 1)), ...(await presses(page, 'Tab', 8))],
    [...RAIL, 'Fechar navegação solid 2px', 'Início solid 2px'].map((stop) => `${stop} inside`),
  )
  await page.close()
})

test('na gaveta, Estado do Hub é um link: seguido, muda o endereço, fecha a gaveta e devolve o foco a "Abrir navegação"', async () => {
  const page = await open('/operations/clients/new', PHONE, central('NONE'))
  const opener = page.getByRole('button', { name: 'Abrir navegação' })
  await opener.click()
  await page
    .getByRole('dialog', { name: 'Navegação' })
    .getByRole('link', { name: 'Estado do Hub' })
    .click()
  await page.getByRole('dialog').waitFor({ state: 'detached', timeout: 2000 })
  await page.getByRole('heading', { name: 'Estado do Hub' }).waitFor()
  assert.equal(new URL(page.url()).pathname, '/operations/status')
  assert.equal(await opener.evaluate((button) => button === document.activeElement), true)
  await page.close()
})
