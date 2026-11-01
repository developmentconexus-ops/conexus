import assert from 'node:assert/strict'
import { join } from 'node:path'
import { test } from 'node:test'
import { endOf, messagesOf } from '../conversation/test-conversation.ts'
import { tool } from '../conversation/test-questions.ts'
import { showFileTool } from './show-file.ts'
import { assisting, created, said, talking } from './test-assistant.ts'

const SHOW = 'show_file'

function write(path: string, content: string) {
  return tool('mastra_workspace_write_file', { path, content })
}

function show(path: string) {
  return tool(SHOW, { path })
}

/** The output the model's `show_file` calls stored, in order, read again from the messages of the conversation. */
async function shown(on: Awaited<ReturnType<typeof assisting>>, url: string) {
  const messages = await messagesOf(on.hub, on.ana, url)
  return messages.flatMap((message) =>
    message.parts.flatMap((part) => {
      const found = Object(part)
      const call = found.toolInvocation
      return found.type === 'tool-invocation' && call?.toolName === SHOW ? [call.result] : []
    }),
  )
}

test('show_file: um Markdown, texto ou CSV de até 64 KB sai com o conteúdo, e a mensagem relida depois do turno ainda o tem inteiro; o modelo recebe só o caminho (19)', async (t) => {
  const on = await assisting(t, [
    [write('relatorio.md', '# Vendas\n\nTotal: 10')],
    [show('relatorio.md')],
    [said('Aqui está.')],
    [said('De nada.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Documente')), 'complete')

  const [output] = await shown(on, url)
  assert.deepEqual(output, {
    kind: 'TEXT',
    path: join(on.hub.assistantMachines.folder, 'work', 'relatorio.md'),
    name: 'relatorio.md',
    media: 'text/markdown',
    content: '# Vendas\n\nTotal: 10',
  })
  const next = on.calls.at(2)?.texts.join('\n') ?? ''
  assert.match(next, /"shown":"[^"]*relatorio\.md"/)
  assert.equal(next.includes('Total: 10'), false, 'the content is not carried to the model')
  assert.equal(endOf(await say('Obrigado')), 'complete')
  const later = on.calls.at(-1)?.texts.join('\n') ?? ''
  assert.match(later, /"shown":"[^"]*relatorio\.md"/, 'the next turn still has the summary')
  assert.equal(later.includes('Total: 10'), false, 'and not the content')
})

test('show_file: um arquivo que não é texto, ou um texto acima de 64 KB, sai com o nome, o tamanho e o tipo, sem conteúdo (19)', async (t) => {
  const on = await assisting(t, [
    [
      tool('mastra_workspace_execute_command', {
        command: "yes 'a;b' | head -n 20000 > grande.csv",
      }),
    ],
    [show('grande.csv')],
    [write('grafico.svg', '<svg xmlns="http://www.w3.org/2000/svg"/>')],
    [show('grafico.svg')],
    [said('Pronto.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Faça')), 'complete')
  const [csv, svg] = await shown(on, url)
  assert.deepEqual(
    [csv?.kind, csv?.name, csv?.media, csv?.bytes, 'content' in csv],
    ['FILE', 'grande.csv', 'text/csv', 80_000, false],
  )
  assert.deepEqual([svg?.kind, svg?.name, svg?.media], ['FILE', 'grafico.svg', 'image/svg+xml'])
})

test('show_file: um caminho fora da pasta da conversa (também por um link) ou que não existe é recusado e nada aparece (19)', async (t) => {
  const on = await assisting(t, [
    [tool('mastra_workspace_execute_command', { command: 'ln -s /etc/hostname dentro.md' })],
    [show('dentro.md')],
    [show('../fora.md')],
    [show('/etc/passwd')],
    [show('nao-existe.md')],
    [show('.')],
    [said('Não consegui.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Mostre')), 'complete')
  assert.deepEqual(await shown(on, url), [
    { kind: 'SHOW_REFUSED', reason: 'OUTSIDE' },
    { kind: 'SHOW_REFUSED', reason: 'OUTSIDE' },
    { kind: 'SHOW_REFUSED', reason: 'NOT_FOUND' },
    { kind: 'SHOW_REFUSED', reason: 'NOT_FOUND' },
    { kind: 'SHOW_REFUSED', reason: 'NOT_FOUND' },
  ])
})

test('show_file: o caminho que a ferramenta de escrita aceitou, também com / inicial, é o que ele mostra (19)', async (t) => {
  const on = await assisting(t, [
    [write('/relatorio.md', '# Vendas')],
    [show('/relatorio.md')],
    [said('Aqui está.')],
  ])
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Documente')), 'complete')
  const [output] = await shown(on, url)
  assert.deepEqual(
    [output?.kind, output?.name, output?.content],
    ['TEXT', 'relatorio.md', '# Vendas'],
  )
})

test('show_file: na máquina com API de arquivos própria, o link para fora feito depois de um arquivo mostrado não é mostrado (19)', async (t) => {
  const on = await assisting(t, [
    [write('a.md', 'dentro')],
    [show('a.md')],
    [tool('mastra_workspace_execute_command', { command: 'rm a.md && ln -s /etc/hostname a.md' })],
    [show('a.md')],
    [said('Pronto.')],
  ])
  on.hub.assistantMachines.control.native = true
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Mostre')), 'complete')
  const [first, second] = await shown(on, url)
  assert.equal(first?.kind, 'TEXT')
  assert.deepEqual(second, { kind: 'SHOW_REFUSED', reason: 'OUTSIDE' })
})

test('show_file: a máquina que não liga é recusada com MACHINE_UNAVAILABLE (19)', async (t) => {
  const on = await assisting(t, [[show('a.md')], [said('Não consegui.')]])
  on.hub.assistantMachines.control.start = 'unreachable'
  const url = await created(on.hub, on.ana, on.assistant, { connections: [] })
  const { say } = await talking(t, on.hub, on.ana, url)
  assert.equal(endOf(await say('Mostre')), 'complete')
  assert.deepEqual(await shown(on, url), [{ kind: 'SHOW_REFUSED', reason: 'MACHINE_UNAVAILABLE' }])
})

test('show_file: o modelo lê só o caminho ou a recusa, mesmo de uma saída cujo conteúdo passa do teto; outra forma de saída é um erro, nunca a saída crua (F20)', () => {
  const shown = showFileTool({ folder: '/home/user/work', serving: () => undefined })
  const toModel = shown.toModelOutput
  assert.ok(toModel !== undefined)
  const big = { kind: 'TEXT', path: 'a.md', name: 'a.md', media: 'text/markdown' }
  assert.deepEqual(toModel({ ...big, content: 'x'.repeat(70_000) }), {
    type: 'json',
    value: { shown: 'a.md' },
  })
  const refused = { kind: 'SHOW_REFUSED', reason: 'NOT_FOUND' } as const
  assert.deepEqual(toModel(refused), { type: 'json', value: refused })
  assert.throws(() => toModel({ content: 'segredo' }))
})
