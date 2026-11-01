import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { test } from 'node:test'
import { CompanyId, ConversationId, PersonId, ProjectId } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import { testConfig, unreachableDatabaseUrl } from '../../platform/test-database.ts'
import { ASSISTANT_HOSTS, createAssistantMachines } from '../assistant/public.ts'
import {
  ALLOWED_HOSTS,
  APP_FOLDER,
  createE2bApi,
  createE2bKit,
  MARK,
  machineInstructions,
} from './public.ts'
import { INSTALLATION, realE2b } from './test-machine.ts'

const COMPANY = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const PROJECT = ProjectId.parse('projectAAAAAAAAAAAAAAAAAAAAAAAAA')
const CONVERSATION = ConversationId.parse('00000000-0000-4000-8000-00000000000a')
const PERSON = PersonId.parse('person-ana')
const HOME = { kind: 'COMPANY' } as const
const IN_APP = {
  allowOut: ALLOWED_HOSTS,
  workingDirectory: APP_FOLDER,
  instructions: machineInstructions(APP_FOLDER),
}

test('máquina: o kit de uma máquina achada pelo id só a religa, e nunca faz outra no lugar (B2)', async () => {
  const kit = createE2bKit(testConfig(await unreachableDatabaseUrl()))({
    id: `conexus-hub-${CONVERSATION}`,
    foundAs: 'sbx-achada',
    metadata: { conexus_origin: 'hub.example.test', conexus_conversation: CONVERSATION },
    onStart: () => undefined,
    ...IN_APP,
  })
  const options = Reflect.get(kit.sandbox, '_constructorOptions')
  assert.equal(options.sandboxId, 'sbx-achada')
  assert.equal(options.reattach, 'required')
})

test('máquina: o kit do E2B nasce sem env e sem id gravado, achado pelo nome, atrás da lista de domínios, pausando ao vencer, com a marca da conversa, na pasta do app e dizendo ao modelo o que a máquina tem', async () => {
  const kit = createE2bKit(testConfig(await unreachableDatabaseUrl()))({
    id: `conexus-hub-${CONVERSATION}`,
    metadata: { conexus_origin: 'hub.example.test', conexus_conversation: CONVERSATION },
    onStart: () => undefined,
    ...IN_APP,
  })
  const options = Reflect.get(kit.sandbox, '_constructorOptions')
  assert.equal('env' in options, false)
  assert.equal(options.id, `conexus-hub-${CONVERSATION}`)
  assert.equal('sandboxId' in options, false)
  assert.equal('reattach' in options, false)
  assert.deepEqual(options.network, { allowOut: ['registry.npmjs.org'], denyOut: ['0.0.0.0/0'] })
  assert.deepEqual(options.lifecycle, { onTimeout: 'pause' })
  assert.equal(options.metadata.conexus_origin, 'hub.example.test')
  assert.equal(options.metadata.conexus_conversation, CONVERSATION)
  assert.equal(options.workingDirectory, APP_FOLDER)
  const told = kit.sandbox.getInstructions?.() ?? ''
  assert.ok(told.includes(`Commands start in ${APP_FOLDER}`), told)
  assert.equal(told.includes('Cloud sandbox'), false)
})

test('máquina: a lista de endereços que quem monta passa é a que o E2B recebe, a do Builder só o npm e a do Assistente também o PyPI (17)', async () => {
  const config = testConfig(await unreachableDatabaseUrl())
  function networkOf(allowOut: readonly string[]) {
    const kit = createE2bKit(config)({
      id: `conexus-hub-${CONVERSATION}`,
      metadata: {},
      onStart: () => undefined,
      allowOut,
      workingDirectory: APP_FOLDER,
      instructions: 'The test machine.',
    })
    return Reflect.get(kit.sandbox, '_constructorOptions').network
  }
  assert.deepEqual(networkOf(ALLOWED_HOSTS).allowOut, ['registry.npmjs.org'])
  assert.deepEqual(networkOf(ASSISTANT_HOSTS), {
    allowOut: ['registry.npmjs.org', 'pypi.org', 'files.pythonhosted.org'],
    denyOut: ['0.0.0.0/0'],
  })
})

test('máquina: o E2B a mantém uma hora, a mais longa do plano, e então a pausa; o turno não tem prazo próprio', async () => {
  const kit = createE2bKit(testConfig(await unreachableDatabaseUrl()))({
    id: `conexus-hub-${CONVERSATION}`,
    metadata: {},
    onStart: () => undefined,
    ...IN_APP,
  })
  const options = Reflect.get(kit.sandbox, '_constructorOptions')
  assert.equal(options.timeout, 60 * 60 * 1000)
  assert.deepEqual(options.lifecycle, { onTimeout: 'pause' })
})

test('máquina: o template trabalha na pasta do app em que as ferramentas trabalham', () => {
  const template = readFileSync(
    join(import.meta.dirname, '../../../../..', 'infra', 'e2b', 'template.ts'),
    'utf8',
  )
  assert.ok(
    template.includes(`.setWorkdir('${APP_FOLDER}')`),
    'the template works in the app folder',
  )
})

test('máquina: o template grava o pip.conf antes do pip da imagem, porque o ENV do template não chega aos comandos da máquina (17)', () => {
  const template = readFileSync(
    join(import.meta.dirname, '../../../../..', 'infra', 'e2b', 'template.ts'),
    'utf8',
  )
  assert.ok(
    template.includes('break-system-packages = true'),
    'pip is told to break the PEP 668 mark',
  )
  const written = template.indexOf('> /etc/pip.conf')
  assert.ok(written > 0, 'the setting lives in the file pip reads')
  assert.ok(written < template.indexOf('.pipInstall('), 'the file exists before the image pip runs')
  assert.equal(template.includes('PIP_BREAK_SYSTEM_PACKAGES'), false, 'no env that never arrives')
})

test('opt-in: no E2B de verdade, a máquina do Assistente instala com pip e npm, importa o pacote e as bibliotecas da imagem, e outro endereço não responde (17)', {
  timeout: 300_000,
}, async (t) => {
  const config = realE2b()
  if (config === undefined) {
    return t.skip(
      'opt-in: set CONEXUS_E2B_KEY_FILE and CONEXUS_E2B_TEMPLATE (the published template with Python); firstmate runs it at closing, on the founder’s E2B account',
    )
  }
  const mark = { [MARK.origin]: 'e241-u3-real-test' }
  const api = createE2bApi(config, mark)
  const conversation = ConversationId.parse(randomUUID())
  t.after(() => api.kill(conversation))
  const kit = createE2bKit(config)({
    id: `conexus-e241-u3-real-${conversation}`,
    allowOut: ASSISTANT_HOSTS,
    metadata: { ...mark, [MARK.conversation]: conversation },
    onStart: () => undefined,
    workingDirectory: '/home/user',
    instructions: 'The test machine.',
  })
  await kit.sandbox.start?.()
  async function run(script: string) {
    const result = await kit.sandbox.executeCommand?.('sh', ['-c', script], { timeout: 240_000 })
    assert.ok(result !== undefined)
    return result
  }
  const libraries = await run(
    'python3 -c "import pandas, numpy, matplotlib, openpyxl, xlsxwriter, docx, pptx, pypdf, reportlab; print(1)"',
  )
  assert.equal(libraries.exitCode, 0, libraries.stderr)
  const pip = await run(
    'pip install --quiet tabulate==0.9.0 && python3 -c "import tabulate; print(2)"',
  )
  assert.equal(pip.exitCode, 0, pip.stderr)
  const npm = await run(
    "cd /tmp && npm install --silent --no-audit --no-fund left-pad@1.3.0 && node -e \"console.log(require('left-pad')('x', 3))\"",
  )
  assert.equal(npm.exitCode, 0, npm.stderr)
  const curl = await run('command -v curl')
  assert.equal(
    curl.exitCode,
    0,
    'the image has no curl: the blocked host below would prove nothing',
  )
  // The application's answer, not the socket: E2B may show the socket open to a blocked connection.
  const blocked = await run('curl -sS -f -m 20 https://example.com/ -o /dev/null')
  assert.notEqual(blocked.exitCode, 0, 'a host outside the list answered')
})

test('opt-in: no E2B de verdade, a máquina do Assistente liga pelo início do Hub, faz a pasta da conversa e guarda o arquivo para o download (17, 20)', {
  timeout: 300_000,
}, async (t) => {
  const config = realE2b()
  if (config === undefined) {
    return t.skip(
      'opt-in: set CONEXUS_E2B_KEY_FILE and CONEXUS_E2B_TEMPLATE (the published template); firstmate runs it at closing, on the founder’s E2B account',
    )
  }
  const mark = { [MARK.origin]: 'e241-fix-real-test' }
  const api = createE2bApi(config, mark)
  const conversation = ConversationId.parse(randomUUID())
  t.after(() => api.kill(conversation))
  const machines = createAssistantMachines({
    kit: createE2bKit(config),
    api,
    template: config.machineTemplate,
    installation: INSTALLATION,
    mark,
    log: { info: () => undefined, error: () => undefined },
    scopeOf: async () => ({ companyId: COMPANY, personId: PERSON, place: HOME, chosen: [] }),
  })
  const context = new RequestContext<unknown>([['controller', { sessionId: conversation }]])
  const files = (await machines.workspace(context))?.filesystem
  assert.ok(files !== undefined)
  // The Hub's own start: its onStart makes the conversation's folder, which the template does not.
  await files.writeFile('probe.txt', 'L1')
  await machines.stop(conversation)
  const read = await machines.read(conversation, 'probe.txt', new AbortController().signal)
  assert.equal(read.kind, 'OK')
  assert.equal(read.kind === 'OK' ? read.bytes.toString() : '', 'L1')
})
