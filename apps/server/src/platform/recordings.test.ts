import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { ReadCut } from '@conexus/hub-api'
import { z } from 'zod'
import {
  LEAK,
  NATIVE_RECORDINGS,
  nativeRecording,
  RECORDINGS,
  Recording,
  toolResultsOf,
} from './test-recordings.ts'

// Claude's four cases and Gemini's interruption, reasoning and automation proposal, as `record-provider.ts` names them,
// and the ChatGPT subscription's calls of a refused write and a refused read, with the closing of the write turn only,
// as `openai-failure.eval.test.ts` records them.
const EXPECTED = [
  'anthropic-abort',
  'anthropic-cited',
  'anthropic-thinking',
  'anthropic-tool-error',
  'google-abort',
  'google-propose-automation-weekly-no-days',
  'google-propose-automation',
  'google-thinking',
  'openai-refused-read-call',
  'openai-refused-write-call',
  'openai-refused-write-closing',
]

test('cada gravação tem fornecedor, API, versão do SDK e data, e nenhum cabeçalho, token ou e-mail (T24, S40)', () => {
  const files = readdirSync(RECORDINGS)
    .filter(
      (file) =>
        !file.endsWith('.list.json') &&
        !file.endsWith('-models.json') &&
        !['mastra', 'aws'].includes(file),
    )
    .sort()
  const bodies = files.filter((file) => file.endsWith('.sse')).map((file) => file.slice(0, -4))
  assert.deepEqual(bodies, EXPECTED)
  assert.deepEqual(
    files,
    bodies.flatMap((name) => [`${name}.json`, `${name}.sse`]),
  )
  for (const name of bodies) {
    const recording = Recording.parse(
      JSON.parse(readFileSync(join(RECORDINGS, `${name}.json`), 'utf8')),
    )
    assert.equal(recording.provider, name.split('-')[0])
    for (const file of [`${name}.sse`, `${name}.json`]) {
      const text = readFileSync(join(RECORDINGS, file), 'utf8')
      assert.equal(LEAK.test(text), false, `${file} carries an address or a credential`)
      assert.doesNotMatch(text, /^(authorization|x-api-key|cookie|set-cookie):/im, file)
    }
  }
})

// Only a 204 has no body (S3 Tables answers DeleteNamespace and DeleteTableBucket so), and the 200s of SQS's DeleteMessage and S3's PutObject, which are empty.
const AwsRecording = z
  .object({
    service: z.enum(['sts', 'cloudformation', 's3tables', 's3', 'athena', 'ssm', 'sqs', 'ecs']),
    api: z.string().min(1),
    sdk: z.string().min(1),
    recordedAt: z.iso.date(),
    status: z.number().int(),
    body: z.string(),
  })
  .refine(
    (r) => r.body.length > 0 || r.status === 204 || ['DeleteMessage', 'PutObject'].includes(r.api),
    'only a 204, a DeleteMessage or a PutObject has no body',
  )
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi

test('cada gravação da AWS tem serviço, API, SDK e data; só a conta inventada e nenhuma chave de verdade (T29, S40)', () => {
  const folder = join(RECORDINGS, 'aws')
  const files = readdirSync(folder)
  assert.ok(files.length > 0)
  for (const file of files) {
    const text = readFileSync(join(folder, file), 'utf8')
    const parsed = AwsRecording.safeParse(JSON.parse(text))
    assert.ok(parsed.success, `${file}: ${parsed.error?.message}`)
    assert.equal(LEAK.test(text), false, `${file} carries an address or a credential`)
    // An account is any run of exactly 12 digits: in an ARN, in S3 Tables' ownerAccountId and
    // createdBy, anywhere. The invented UUIDs end in 12 digits too, so they go first.
    const accounts = new Set(text.replace(UUID, '').match(/(?<!\d)\d{12}(?!\d)/g) ?? [])
    assert.deepEqual(
      [...accounts].filter((account) => account !== '111122223333'),
      [],
      file,
    )
    assert.doesNotMatch(text, /\b(AKIA|ASIA)(?!INVENTED)[A-Z0-9]{12,}/, file)
  }
})

// The native flow's scenarios, as `scripts/record.ts` names them: one per provider recording it replays,
// and `plan`, `files`, `tasks`, `reads`, `research`, `research-failed`, `title` and `title-observer`, whose model calls are streamed by the test double's Messages API stream;
// `data-query` is a frozen capture that no script makes.
const NATIVE = [
  'abort',
  'approval',
  'approval-declined',
  'approval-interrupted',
  'approval-refused',
  'approval-stopped',
  'cited',
  'data-query',
  'files',
  'handoff',
  'plan',
  'reads',
  'research',
  'research-failed',
  'tasks',
  'thinking',
  'title',
  'title-observer',
]
const STREAMED = new Set([
  'plan',
  'files',
  'tasks',
  'reads',
  'data-query',
  'research',
  'research-failed',
  'handoff',
  'approval',
  'approval-declined',
  'approval-interrupted',
  'approval-refused',
  'approval-stopped',
  'title',
  'title-observer',
])

test('cada gravação do fluxo nativo diz a biblioteca, a versão e a gravação do fornecedor que tocou, e não guarda endereço nem credencial (T24, S40)', () => {
  assert.deepEqual(
    readdirSync(NATIVE_RECORDINGS)
      .map((file) => file.replace(/\.jsonl$/, ''))
      .sort(),
    NATIVE,
  )
  for (const scenario of NATIVE) {
    const { header, events } = nativeRecording(scenario)
    assert.equal(header.library, '@mastra/core')
    assert.equal(
      header.source,
      STREAMED.has(scenario) ? 'test-anthropic-stream.ts' : `anthropic-${scenario}.sse`,
    )
    assert.equal(events[0]?.type, 'agent_start')
    assert.ok(events.some((event) => event.type === 'agent_end'))
    const text = readFileSync(join(NATIVE_RECORDINGS, `${scenario}.jsonl`), 'utf8')
    assert.equal(LEAK.test(text), false, `${scenario}.jsonl carries an address or a credential`)
  }
})

const Versions = z.object({ version: z.string() })
test('as gravações desta etapa são da Mastra instalada e guardam o resultado das ferramentas de dado', () => {
  const installed = Versions.parse(
    JSON.parse(
      readFileSync(
        join(import.meta.dirname, '../../../../node_modules/@mastra/core/package.json'),
        'utf8',
      ),
    ),
  ).version
  assert.equal(nativeRecording('reads').header.version, installed, 'reads')

  // The frozen capture keeps the shape the stream carried when the data tools read copies, not the contract's.
  const [catalog, table, rows] = toolResultsOf('data-query').map(({ result }) => Object(result))
  assert.deepEqual([catalog?.kind, table?.kind, rows?.kind], ['CATALOG', 'TABLE', 'ROWS'])
  assert.equal(table?.origin.table, 'vendas')
  assert.equal(rows?.origin.length > 0, true)

  const [read] = toolResultsOf('reads')
  assert.equal(read?.tool, 'connector_read')
  assert.ok(ReadCut.parse(read.result).at, 'the recorded live read carries the time it came back')
})

const READERS = [
  join(import.meta.dirname, '..'),
  join(import.meta.dirname, '../../../extraction/tests'),
]

function readersText(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && /\.(ts|py)$/.test(entry.name))
    .map((entry) => join(entry.parentPath, entry.name))
    .filter((path) => !path.includes('/recordings/') && !path.includes('/node_modules/'))
    .map((path) => readFileSync(path, 'utf8'))
}

test('toda gravação da AWS tem um leitor, e nenhuma é lida sem existir (53)', () => {
  const folder = join(RECORDINGS, 'aws')
  const names = readdirSync(folder).map((file) => file.replace(/\.json$/, ''))
  const text = READERS.flatMap(readersText).join('\n')
  assert.deepEqual(
    names.filter((name) => !new RegExp(`['"]${name}['"]`).test(text)),
    [],
  )
})

test('a gravação da AWS não leva id do laboratório: o UUID, a área, o código do lago e a tarefa são inventados (S40, 1266)', () => {
  const folder = join(RECORDINGS, 'aws')
  for (const file of readdirSync(folder)) {
    const text = readFileSync(join(folder, file), 'utf8')
    const real = (text.match(UUID) ?? []).filter((id) => !id.startsWith('00000000-0000-4000-8000-'))
    assert.deepEqual(real, [], file)
    const tasks = text.match(/task\/conexus-copia\/[0-9a-f]{32}/g) ?? []
    assert.deepEqual(
      tasks.filter((task) => !/\/0{20,}[0-9a-f]{1,12}$/.test(task)),
      [],
      file,
    )
  }
})
