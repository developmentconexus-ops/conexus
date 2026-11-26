import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { CompanyId, ConversationId, NetworkDomain } from '@conexus/hub-api'
import { RequestContext } from '@mastra/core/request-context'
import { testConfig, unreachableDatabaseUrl } from '../../platform/test-database.ts'
import {
  ALLOWED_HOSTS,
  APP_FOLDER,
  createConversationMachines,
  createE2bApi,
  createE2bCodeMode,
  createE2bKit,
  MARK,
  PACKAGE_HOSTS,
} from './public.ts'
import { INSTALLATION, realE2b } from './test-machine.ts'

const COMPANY = CompanyId.parse('companyAAAAAAAAAAAAAAAAAAAAAAAAA')
const CONVERSATION = ConversationId.parse('00000000-0000-4000-8000-00000000000a')
const IN_APP = {
  allowOut: ALLOWED_HOSTS,
  workingDirectory: APP_FOLDER,
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

test('máquina: o kit do E2B nasce sem env e sem id gravado, achado pelo nome, atrás da lista de domínios, pausando ao vencer, com a marca da conversa, na pasta do app', async () => {
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
  assert.deepEqual(options.network, {
    allowOut: ['registry.npmjs.org'],
    denyOut: ['0.0.0.0/0'],
    allowPublicTraffic: false,
  })
  assert.deepEqual(options.lifecycle, { onTimeout: 'pause' })
  assert.equal(options.metadata.conexus_origin, 'hub.example.test')
  assert.equal(options.metadata.conexus_conversation, CONVERSATION)
  assert.equal(options.workingDirectory, APP_FOLDER)
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
    })
    return Reflect.get(kit.sandbox, '_constructorOptions').network
  }
  assert.deepEqual(networkOf(ALLOWED_HOSTS).allowOut, ['registry.npmjs.org'])
  assert.deepEqual(networkOf(PACKAGE_HOSTS), {
    allowOut: ['registry.npmjs.org', 'pypi.org', 'files.pythonhosted.org'],
    denyOut: ['0.0.0.0/0'],
    allowPublicTraffic: false,
  })
})

test('máquina: o E2B a mantém ligada 5 minutos desde que liga, o padrão da Factory do Mastra, e então a pausa, para todo agente; o turno não tem prazo próprio', async () => {
  const kit = createE2bKit(testConfig(await unreachableDatabaseUrl()))({
    id: `conexus-hub-${CONVERSATION}`,
    metadata: {},
    onStart: () => undefined,
    ...IN_APP,
  })
  const options = Reflect.get(kit.sandbox, '_constructorOptions')
  assert.equal(options.timeout, 5 * 60 * 1000)
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

test('máquina: o template grava o pip.conf antes do pip da imagem, porque o ENV sozinho não bastou na máquina viva (17)', () => {
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
  assert.equal(
    template.includes('PIP_BREAK_SYSTEM_PACKAGES:'),
    false,
    'the file makes the env redundant',
  )
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
    allowOut: PACKAGE_HOSTS,
    metadata: { ...mark, [MARK.conversation]: conversation },
    onStart: () => undefined,
    workingDirectory: '/home/user',
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
  const machines = createConversationMachines(
    {
      network: { kind: 'FIXED', hosts: PACKAGE_HOSTS },
      otherTemplate: 'replace',
      marks: async () => ({ [MARK.company]: COMPANY }),
    },
    {
      kit: createE2bKit(config),
      api,
      template: config.machineTemplate,
      installation: INSTALLATION,
      mark,
      codeMode: createE2bCodeMode(),
      log: { info: () => undefined, error: () => undefined },
    },
  )
  const context = new RequestContext<unknown>([['controller', { sessionId: conversation }]])
  const files = (await machines.workspace(context))?.filesystem
  assert.ok(files !== undefined)
  // The Hub's own start: its onStart makes the conversation's folder, which the template does not.
  await files.writeFile('probe.txt', 'L1')
  await machines.stopAll()
  const read = await machines.read(conversation, 'probe.txt', new AbortController().signal)
  assert.equal(read.kind, 'OK')
  assert.equal(read.kind === 'OK' ? read.bytes.toString() : '', 'L1')
})

test('opt-in: no E2B de verdade, a rede abre e fecha um domínio com a máquina ligada', {
  timeout: 300_000,
}, async (t) => {
  const config = realE2b()
  if (config === undefined) {
    return t.skip(
      'opt-in: set CONEXUS_E2B_KEY_FILE and CONEXUS_E2B_TEMPLATE (the published template); firstmate runs it at closing, on the founder’s E2B account',
    )
  }
  const mark = { [MARK.origin]: 'rede-u2-real-test' }
  const api = createE2bApi(config, mark)
  const conversation = ConversationId.parse(randomUUID())
  t.after(() => api.kill(conversation))
  const kit = createE2bKit(config)({
    id: `conexus-rede-u2-real-${conversation}`,
    allowOut: PACKAGE_HOSTS,
    metadata: { ...mark, [MARK.conversation]: conversation },
    onStart: () => undefined,
    workingDirectory: '/home/user',
  })
  await kit.sandbox.start?.()
  async function run(script: string) {
    const result = await kit.sandbox.executeCommand?.('sh', ['-c', script], { timeout: 60_000 })
    assert.ok(result !== undefined)
    return result
  }
  async function answers() {
    return (await run('curl -sS -f -m 20 https://example.com/ -o /dev/null')).exitCode === 0
  }
  assert.equal(await answers(), false, 'a host outside the list answered')
  await kit.openNetwork([NetworkDomain.parse('example.com')])
  assert.equal(await answers(), true, 'the opened host did not answer on the running machine')
  // E2B's proxy dials the allowed name itself, not the address the machine resolved
  // (`e2b-dev/infra@86cb5033` `packages/orchestrator/pkg/tcpfirewall/handlers.go:79-87`).
  const pointed = await run(
    "echo '192.0.2.1 example.com' | sudo tee -a /etc/hosts && getent hosts example.com",
  )
  assert.match(pointed.stdout, /^192\.0\.2\.1 /m, `the machine kept its address: ${pointed.stderr}`)
  assert.equal(await answers(), true, 'the proxy dialed the address the machine chose')
  await kit.closeNetwork()
  assert.equal(await answers(), false, 'the removed host still answered')
})
