import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { WORK_FOLDER } from '@conexus/app/check'
import { APP_SESSION_COOKIE } from '@conexus/hub-api'
import { z } from 'zod'
import {
  app,
  appServer,
  confer,
  conferring,
  FAILED,
  MARK,
  realBrowser,
  TOKEN,
} from './test-confer.ts'

test('Machines.confer: a tela que chama uma operação que dá 500 é DIRTY, com a captura e o token só no cookie', async (t) => {
  const { at, seen } = await appServer(
    t,
    app(
      `fetch('/api/listarEncomendas',{method:'POST'});console.error('${MARK}');setTimeout(()=>{throw new Error('${MARK}')},50)`,
    ),
  )
  const program = realBrowser(t)
  const machine = await conferring(t, program)
  const result = await confer(machine, at)
  assert.ok(result.ok, machine.lines.join('\n'))
  const { value } = result
  assert.equal(value.kind, 'DIRTY')
  assert.ok(value.kind === 'DIRTY')
  assert.deepEqual(
    value.problems.filter(({ kind }) => kind === 'REQUEST_FAILED'),
    [{ kind: 'REQUEST_FAILED', method: 'POST', path: '/api/listarEncomendas', status: 500 }],
  )
  assert.ok(value.problems.some((p) => p.kind === 'PAGE_ERROR' && p.message.includes(MARK)))
  assert.ok(value.console.some((line) => line.includes(MARK)))
  assert.equal(value.shot, `${WORK_FOLDER}/tela.png`)
  const shot = readFileSync(join(machine.folder, 'app', value.shot))
  assert.equal(shot.subarray(1, 4).toString(), 'PNG')
  assert.equal(seen[0]?.cookie, `${APP_SESSION_COOKIE}=${TOKEN}`)
  assert.ok(!machine.lines.join('\n').includes(MARK))
  assert.ok(!machine.lines.join('\n').includes(TOKEN))
  assert.equal(machine.control.networkOpenTo, undefined)
})

test('Machines.confer: a tela que só desenha é CLEAN, mesmo com um pedido a outro host e um erro no console', async (t) => {
  const { at } = await appServer(
    t,
    app(`fetch('https://127.0.0.1:1/x').catch(()=>{});console.error('${MARK}')`),
  )
  const program = realBrowser(t)
  const machine = await conferring(t, program)
  const result = await confer(machine, at)
  assert.ok(result.ok, machine.lines.join('\n'))
  assert.equal(result.value.kind, 'CLEAN')
  assert.ok(result.value.console.some((line) => line.includes(MARK)))
})

test('Machines.confer: reprova o pedido ao host do app com 400 ou mais, ou sem resposta; o 200 não', async (t) => {
  const { at } = await appServer(
    t,
    app(`['/api/200','/api/400','/api/corta'].forEach((p)=>fetch(p).catch(()=>{}))`),
  )
  const program = realBrowser(t)
  const machine = await conferring(t, program)
  const result = await confer(machine, at)
  assert.ok(result.ok, machine.lines.join('\n'))
  assert.ok(result.value.kind === 'DIRTY')
  assert.deepEqual(
    result.value.problems.toSorted((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    [
      { kind: 'REQUEST_FAILED', method: 'GET', path: '/api/400', status: 400 },
      { kind: 'REQUEST_FAILED', method: 'GET', path: '/api/corta', status: null },
    ],
  )
})

test('Machines.confer: a página que sai do host do app é CONFER_PLATFORM_FAILED, e a rede fecha', async (t) => {
  const { at } = await appServer(t, (request, response) => {
    if (request.headers.host?.startsWith('localhost') === true)
      response.writeHead(302, { location: `https://127.0.0.1:${at.url.port}/` }).end()
    else response.writeHead(200, { 'content-type': 'text/html' }).end('<h1>outra casa</h1>')
  })
  const machine = await conferring(t, realBrowser(t))
  assert.deepEqual(await confer(machine, at), FAILED)
  assert.equal(machine.control.networkClosed, 1)
})

test('Machines.confer: no fim o navegador está fechado, e o seguinte abre sem a sessão', async (t) => {
  const { at } = await appServer(t, app('document.title="oi"'))
  const program = realBrowser(t)
  const machine = await conferring(t, program)
  const result = await confer(machine, at)
  assert.ok(result.ok, machine.lines.join('\n'))
  const left = execFileSync(program, ['--json', 'cookies'], { encoding: 'utf8' })
  assert.deepEqual(
    z.object({ data: z.object({ cookies: z.array(z.unknown()) }) }).parse(JSON.parse(left)).data
      .cookies,
    [],
  )
  execFileSync(program, ['--json', 'close'])
})
