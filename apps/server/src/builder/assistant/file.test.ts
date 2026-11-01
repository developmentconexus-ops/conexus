import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { get } from 'node:http'
import type { TestContext } from 'node:test'
import { test } from 'node:test'
import { BRUNO, CARLA, call, codeOf, memberOn } from '../../hub/identity/test-hub.ts'
import { TEST_ORIGIN } from '../../platform/test-database.ts'
import { endOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { INSTALLATION } from '../machine/test-machine.ts'
import { assisting, created, said, talking } from './test-assistant.ts'

const FILE_TURN = [[write('relatorio.csv', 'a;b\n1;2\n')], [said('Escrevi.')]]

function write(path: string, content: string) {
  return tool('mastra_workspace_write_file', { path, content })
}

/** The phrase a refusal says to the person: the problem's title. */
function titleOf(response: { json(): unknown }) {
  return Object(response.json()).title
}

function fileOf(url: string, path: string) {
  return `${url}/files?${new URLSearchParams({ path })}`
}

/** The provider holds the conversation's machine, as E2B does after the turn: a download finds it by its name. */
function provided(
  on: { hub: { assistantMachines: { control: { discoverable: string[] } } } },
  url: string,
) {
  on.hub.assistantMachines.control.discoverable.push(
    `conexus-${INSTALLATION}-${url.slice(url.lastIndexOf('/') + 1)}`,
  )
}

/** A conversation of Ana's in which the model wrote `relatorio.csv` on its machine. */
async function withFile(t: TestContext) {
  const on = await assisting(t, FILE_TURN)
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Escreva')), 'complete')
  provided(on, url)
  return { ...on, url }
}

test('o arquivo: o dono baixa os bytes com o tipo, Content-Disposition, nosniff e CSP sandbox (20)', async (t) => {
  const on = await withFile(t)
  const got = await call(on.hub, on.ana, 'GET', fileOf(on.url, 'relatorio.csv'))
  assert.equal(got.statusCode, 200, got.body)
  assert.equal(got.body, 'a;b\n1;2\n')
  assert.equal(got.headers['content-type'], 'text/csv')
  assert.equal(
    got.headers['content-disposition'],
    `attachment; filename="relatorio.csv"; filename*=UTF-8''relatorio.csv`,
  )
  assert.equal(got.headers['x-content-type-options'], 'nosniff')
  const policy = String(got.headers['content-security-policy'])
  assert.match(policy, /(^|; )sandbox$/, 'the file may not run')
  assert.match(policy, /frame-ancestors 'none'/, 'and the Hub’s own policy stays')
  const read = on.lines.find((line) => line.message === 'ASSISTANT_FILE_READ')
  assert.deepEqual(read?.fields, {
    companyId: on.companyId,
    conversationId: on.url.slice(on.url.lastIndexOf('/') + 1),
    bytes: 8,
  })
})

test('o arquivo: o caminho que a ferramenta de escrita aceitou, também com / inicial, é baixado (20)', async (t) => {
  const on = await assisting(t, [[write('/relatorio.md', '# Vendas')], [said('Escrevi.')]])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Escreva')), 'complete')
  provided(on, url)
  const got = await call(on.hub, on.ana, 'GET', fileOf(url, '/relatorio.md'))
  assert.equal(got.statusCode, 200, got.body)
  assert.equal(got.body, '# Vendas')
})

test('o arquivo: o que o modelo escreveu como imagem abre no lugar, e ainda sob sandbox (20)', async (t) => {
  const on = await assisting(t, [
    [write('grafico.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>')],
    [said('Pronto.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Desenhe')), 'complete')
  provided(on, url)
  const got = await call(on.hub, on.ana, 'GET', fileOf(url, 'grafico.svg'))
  assert.equal(got.headers['content-type'], 'image/svg+xml')
  assert.match(String(got.headers['content-disposition']), /^inline;/)
  assert.match(String(got.headers['content-security-policy']), /(^|; )sandbox$/)
})

test('o arquivo: de outra pessoa, do membro ou de conversa que não existe, CONVERSATION_NOT_FOUND ou NOT_FOUND; fora da pasta ou inexistente, FILE_NOT_FOUND (20)', async (t) => {
  const on = await withFile(t)
  const carla = await memberOn(on.hub, on.companyId, CARLA, 'admin')
  const bruno = await memberOn(on.hub, on.companyId, BRUNO, 'member')
  const other = await call(on.hub, carla, 'GET', fileOf(on.url, 'relatorio.csv'))
  assert.deepEqual([other.statusCode, codeOf(other)], [404, 'CONVERSATION_NOT_FOUND'])
  const member = await call(on.hub, bruno, 'GET', fileOf(on.url, 'relatorio.csv'))
  assert.equal(member.statusCode, 404)
  assert.equal(codeOf(member), 'NOT_FOUND')
  const nowhere = `${on.assistant}/${randomUUID()}`
  assert.equal(
    codeOf(await call(on.hub, on.ana, 'GET', fileOf(nowhere, 'a.csv'))),
    'CONVERSATION_NOT_FOUND',
  )
  for (const path of ['../fora.csv', '/etc/hostname', 'nao-existe.csv', '.']) {
    const refused = await call(on.hub, on.ana, 'GET', fileOf(on.url, path))
    assert.deepEqual([refused.statusCode, codeOf(refused)], [404, 'FILE_NOT_FOUND'], path)
    assert.equal(titleOf(refused), 'Este arquivo não está mais na máquina da conversa.')
  }
  assert.equal((await call(on.hub, on.ana, 'GET', `${on.url}/files`)).statusCode, 400)
})

test('o arquivo: acima do teto, FILE_TOO_LARGE; a máquina perdida, FILE_GONE; a que não liga, MACHINE_UNAVAILABLE (20)', async (t) => {
  const big = await assisting(t, [
    [
      tool('mastra_workspace_execute_command', {
        command: 'head -c 67108865 /dev/zero > grande.bin',
      }),
    ],
    [said('Escrevi.')],
  ])
  const bigUrl = await created(big.hub, big.ana, big.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, big.hub, big.ana, bigUrl)).say('Escreva')), 'complete')
  provided(big, bigUrl)
  const tooLarge = await call(big.hub, big.ana, 'GET', fileOf(bigUrl, 'grande.bin'))
  assert.deepEqual([tooLarge.statusCode, codeOf(tooLarge)], [413, 'FILE_TOO_LARGE'])
  assert.equal(titleOf(tooLarge), 'O arquivo passa do tamanho que o Hub entrega.')
  // The machine the files were written on is gone: the provider makes a new, empty one.
  big.hub.assistantMachines.control.discoverable.length = 0
  const started = big.hub.assistantMachines.control.names.length
  const gone = await call(big.hub, big.ana, 'GET', fileOf(bigUrl, 'grande.bin'))
  assert.deepEqual([gone.statusCode, codeOf(gone)], [410, 'FILE_GONE'])
  assert.equal(big.hub.assistantMachines.control.names.length, started, 'none was started (B2)')
  assert.equal(titleOf(gone), 'A máquina desta conversa não guarda mais este arquivo.')

  const down = await withFile(t)
  down.hub.assistantMachines.control.start = 'unreachable'
  const unavailable = await call(down.hub, down.ana, 'GET', fileOf(down.url, 'relatorio.csv'))
  assert.deepEqual([unavailable.statusCode, codeOf(unavailable)], [503, 'MACHINE_UNAVAILABLE'])
})

test('o download quando a lista do provedor falha: nenhuma máquina é ligada nem morta, a resposta é MACHINE_UNAVAILABLE, e o mesmo arquivo baixa depois (B2)', async (t) => {
  const on = await withFile(t)
  const { control, killed } = on.hub.assistantMachines
  const started = control.names.length
  control.findFails = 1
  const down = await call(on.hub, on.ana, 'GET', fileOf(on.url, 'relatorio.csv'))
  assert.deepEqual([down.statusCode, codeOf(down)], [503, 'MACHINE_UNAVAILABLE'])
  assert.equal(control.names.length, started, 'the download started no machine')
  assert.equal(control.killed, false)
  assert.deepEqual(killed, [], 'and killed none by the mark')
  const line = on.lines.find((each) => each.message === 'MACHINE_UNAVAILABLE')
  assert.equal(line?.fields.reason, 'FIND')
  const got = await call(on.hub, on.ana, 'GET', fileOf(on.url, 'relatorio.csv'))
  assert.equal(got.statusCode, 200, got.body)
  assert.equal(got.body, 'a;b\n1;2\n', 'the machine the turn wrote on, with its file')
})

test('o download cuja pausa falha: o arquivo lido é entregue, e a pausa que falhou fica no log (F27)', async (t) => {
  const on = await withFile(t)
  const { control } = on.hub.assistantMachines
  // The provider loses the machine while the Hub reads it: the pause after the read fails.
  control.beforeRead = () => {
    control.killed = true
  }
  const got = await call(on.hub, on.ana, 'GET', fileOf(on.url, 'relatorio.csv'))
  assert.equal(got.statusCode, 200, got.body)
  assert.equal(got.body, 'a;b\n1;2\n')
  const line = on.lines.find((each) => each.message === 'MACHINE_UNAVAILABLE')
  assert.equal(line?.fields.reason, 'STOP')
  assert.equal(line?.fields.conversationId, on.url.slice(on.url.lastIndexOf('/') + 1))
})

test('o download que o navegador abandona, num soquete de verdade: sair no meio corta a leitura da máquina, e nenhum arquivo é entregue (K20)', async (t) => {
  const on = await assisting(t, [
    [
      tool('mastra_workspace_execute_command', {
        command: 'head -c 3000000 /dev/zero > grande.bin',
      }),
    ],
    [said('Escrevi.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Escreva')), 'complete')
  provided(on, url)
  const { control } = on.hub.assistantMachines
  control.chunkMs = 50
  const reading = Promise.withResolvers<void>()
  control.beforeRead = () => reading.resolve()
  const address = await on.hub.app.listen({ port: 0, host: '127.0.0.1' })
  const request = get(`${address}${fileOf(url, 'grande.bin')}`, {
    headers: { origin: TEST_ORIGIN, cookie: on.ana.cookie },
  })
  const failed = Promise.withResolvers<Error>()
  request.on('error', failed.resolve)
  await reading.promise
  request.destroy()
  assert.equal((await failed.promise).message, 'socket hang up', 'the browser left before any byte')
  const deadline = Date.now() + 2_000
  while (control.readsCut === 0 && Date.now() < deadline) {
    await new Promise((later) => setTimeout(later, 20))
  }
  assert.equal(control.readsCut, 1, 'the machine stopped sending once the browser left')
  assert.equal(
    on.lines.some((line) => line.message === 'ASSISTANT_FILE_READ'),
    false,
  )
})

test("o arquivo com ' e parênteses no nome: filename* os codifica, como o cabeçalho pede (RFC 8187)", async (t) => {
  const on = await assisting(t, [[write("d'água (1).csv", 'a;b\n')], [said('Escrevi.')]])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  assert.equal(endOf(await (await talking(t, on.hub, on.ana, url)).say('Escreva')), 'complete')
  provided(on, url)
  const got = await call(on.hub, on.ana, 'GET', fileOf(url, "d'água (1).csv"))
  assert.equal(got.statusCode, 200, got.body)
  assert.equal(
    got.headers['content-disposition'],
    `attachment; filename="d'_gua (1).csv"; filename*=UTF-8''d%27%C3%A1gua%20%281%29.csv`,
  )
})
