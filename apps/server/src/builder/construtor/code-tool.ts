import { readFileSync } from 'node:fs'
import type { CodeSaveResult, ConnectionId } from '@conexus/hub-api'
import {
  CODE_MODULE_MAX,
  CONSTRUTOR_TOOL,
  CodeToolVersion,
  ConnectionId as ConnectionIdSchema,
  JsonSchema,
  OperationId,
  ToolId,
  ToolSlug as ToolSlugSchema,
} from '@conexus/hub-api'
import type { RequestContext } from '@mastra/core/request-context'
import { createTool } from '@mastra/core/tools'
import type { Workspace, WorkspaceSandbox } from '@mastra/core/workspace'
import { z } from 'zod'
import type { Connectors } from '../../hub/connectors/public.ts'
import type { FailureLog } from '../../platform/failure.ts'
import { Failure, logFailure } from '../../platform/failure.ts'
import type { ConversationMachines } from '../machine/public.ts'
import type { InProject, Tools } from '../tools/public.ts'

/** The rule that keeps module state out of a tool's code, run by the template's Biome. */
const MODULE_RULE = readFileSync(new URL('./module-state.grit', import.meta.url), 'utf8')

const BIOME = JSON.stringify({
  root: true,
  linter: { enabled: true, rules: { recommended: false } },
  plugins: ['./module-state.grit'],
})

/**
 * What the model's code is checked against: a module of the Worker's own platform, no Node types
 * (the test is not type-checked: Node runs it as written).
 */
const TSCONFIG = JSON.stringify({
  compilerOptions: {
    target: 'ES2022',
    module: 'ESNext',
    moduleResolution: 'Bundler',
    lib: ['ES2022', 'DOM'],
    types: [],
    strict: true,
    noEmit: true,
    allowImportingTsExtensions: true,
    skipLibCheck: true,
  },
  files: ['tool.ts'],
})

/** Prints the JSON Schema of the code's `input` and `output` (`z.toJSONSchema`, on the machine). */
const SCHEMAS = `import { z } from 'zod'
import * as tool from './tool.ts'
console.log(JSON.stringify({ input: z.toJSONSchema(tool.input), output: z.toJSONSchema(tool.output) }))
`

const COMMAND_MS = 120_000
/** How much of a failed command's output the model reads: its end, where the error is. */
const OUTPUT_TAIL = 2000

const Schemas = z.object({ input: JsonSchema, output: JsonSchema })

/** A list read answers `{ linhas }` (`hub/connectors/cut.ts`); any other answer is one row. */
const Listed = z.object({ linhas: z.array(z.unknown()) })

/**
 * The call, what the model fills: a new tool (`slug`, `connectionId`) or the next version of one
 * (`toolId`, `basedOn`). The model sees one flat object; the two shapes are told apart below
 * (code C21).
 */
const CodeInput = z.object({
  slug: ToolSlugSchema.optional(),
  connectionId: ConnectionIdSchema.optional(),
  toolId: ToolId.optional(),
  basedOn: z.int().positive().optional(),
  reads: z.array(OperationId).min(1).max(16),
  description: z.string().trim().min(1).max(500),
  source: z.string().min(1).max(40_000),
  test: z.string().min(1).max(40_000),
  samples: z.record(OperationId, z.unknown()).default({}),
})

const Which = z.union([
  z.object({ toolId: ToolId, basedOn: z.int().positive() }),
  z.object({ slug: ToolSlugSchema, connectionId: ConnectionIdSchema }),
])

type Refusal = Extract<CodeSaveResult, { kind: 'REFUSED' }>

export type CodeToolDeps = {
  machines: Pick<ConversationMachines, 'workspace' | 'folder' | 'toolchain'>
  tools: Pick<Tools, 'get' | 'fitCode' | 'saveCode' | 'addCodeVersion'>
  /** One read of a connection through the Hub's door, counted in the turn's 50. */
  read(
    call: { connectionId: ConnectionId; operation: string; input: unknown },
    requestContext: RequestContext,
  ): ReturnType<Connectors['assistant']['read']>
  log: FailureLog
}

function refusal(code: Refusal['code'], rest: Omit<Refusal, 'kind' | 'code'> = {}): Refusal {
  return { kind: 'REFUSED', code, ...rest }
}

/** The refusal a service gave, as the result the model reads; a failure of ours stays an exception. */
function refusedBy(deps: CodeToolDeps, error: unknown): Refusal {
  if (!(error instanceof Failure) || error.code === 'INTERNAL_UNEXPECTED') throw error
  logFailure(deps.log, error)
  const { field, reason } = error.named
  return refusal(error.code, {
    ...(field === undefined ? {} : { field }),
    ...(reason === undefined ? {} : { reason }),
  })
}

/** The rows a read answered: a list's, or one for any other answer. */
function rowsOf(whole: unknown): number {
  const listed = Listed.safeParse(whole)
  return listed.success ? listed.data.linhas.length : 1
}

type Run = { ok: boolean; output: string }

/** A command in the tool's folder on the machine: whether it passed and what it printed. */
async function run(
  sandbox: WorkspaceSandbox,
  cwd: string,
  command: string,
  args: string[],
): Promise<Run> {
  const result = await sandbox.executeCommand?.(command, args, { cwd, timeout: COMMAND_MS })
  if (result === undefined) throw new Failure('MACHINE_UNAVAILABLE', { details: { reason: 'RUN' } })
  const output = `${result.stdout}${result.stderr}`.trim()
  return { ok: result.exitCode === 0, output: output.slice(-OUTPUT_TAIL) }
}

/** The tool's files on the machine, in a folder of this attempt, and the commands that check them. */
async function checked(
  deps: CodeToolDeps,
  workspace: Workspace,
  requestContext: RequestContext,
  folder: string,
  files: Record<string, string>,
) {
  const { filesystem } = workspace
  const sandbox = await workspace.resolveSandbox({ requestContext })
  if (filesystem === undefined || sandbox === undefined) {
    throw new Failure('MACHINE_UNAVAILABLE', { details: { reason: 'NO_WORKSPACE' } })
  }
  for (const [name, content] of Object.entries(files)) {
    await filesystem.writeFile(`${folder}/${name}`, content, { recursive: true })
  }
  const bin = `${deps.machines.toolchain}/node_modules/.bin`
  await run(sandbox, folder, 'ln', ['-sfn', `${deps.machines.toolchain}/node_modules`, 'node_modules'])
  return { filesystem, sandbox, bin }
}

type Stage = 'MODULE_STATE' | 'TYPES' | 'TEST' | 'SCHEMAS' | 'BUNDLE'

/**
 * The tool's checks in order: the module-state rule, the types, the test, the schemas and the
 * bundle. The first that fails ends it, with what it printed.
 */
async function pipeline(
  tool: Awaited<ReturnType<typeof checked>>,
  folder: string,
): Promise<{ stage: Stage; output: string } | { stage: 'PASSED'; schemas: Run; module: string }> {
  const { sandbox, bin, filesystem } = tool
  const steps: [Stage, string, string[]][] = [
    ['MODULE_STATE', `${bin}/biome`, ['lint', '--config-path=.', 'tool.ts']],
    ['TYPES', `${bin}/tsc`, ['-p', 'tsconfig.json']],
    ['TEST', 'node', ['--test', 'tool.test.ts']],
  ]
  for (const [stage, command, args] of steps) {
    const ran = await run(sandbox, folder, command, args)
    if (!ran.ok) return { stage, output: ran.output }
  }
  const schemas = await run(sandbox, folder, 'node', ['schemas.ts'])
  if (!schemas.ok) return { stage: 'SCHEMAS', output: schemas.output }
  const bundle = [
    ...['tool.ts', '--bundle', '--format=esm', '--platform=neutral', '--target=es2022'],
    ...['--main-fields=module,main', '--conditions=workerd,worker,browser', '--minify'],
    ...['--legal-comments=none', '--outfile=module.js'],
  ]
  const built = await run(sandbox, folder, `${bin}/esbuild`, bundle)
  if (!built.ok) return { stage: 'BUNDLE', output: built.output }
  const module = await filesystem.readFile(`${folder}/module.js`, { encoding: 'utf-8' })
  return { stage: 'PASSED', schemas, module: String(module) }
}

/**
 * The Construtor writes, checks, tests and saves a tool in code (step 24.4, U2): the Hub runs the
 * commands on the conversation's machine, never the model, and the version is saved only when the
 * test passed. The fixtures are one real read of each declared operation, which stays on the
 * machine for the test and leaves it with the folder. A tool of the company reads one connection.
 */
export function codeToolSave(deps: CodeToolDeps, scope: InProject) {
  return createTool({
    id: CONSTRUTOR_TOOL.toolCodeSave,
    description:
      'Writes, tests and saves a tool in code in the company library. `source` is tool.ts: it exports `input` and `output` (Zod objects) and `default` { fetch(request, env, ctx) }, which reads the declared operations with ctx.props.data.read(operation, input). `test` is tool.test.ts (node:test): it reads fixtures.json, the real answer of each operation in `reads`, by operation, and calls the default export. `samples` is the input of each read for the fixtures. Without toolId it makes a new tool (slug, connectionId); with toolId and basedOn it saves that tool’s next version. Nothing is saved if the test does not pass.',
    inputSchema: CodeInput,
    execute: async (input, context) => {
      const key = context.agent?.toolCallId
      const { requestContext } = context
      if (key === undefined || requestContext === undefined) {
        throw new Failure('INTERNAL_UNEXPECTED', {
          details: { reason: 'CONSTRUTOR_TOOL_WITHOUT_CALL' },
        })
      }
      const which = Which.safeParse(input)
      if (!which.success) return refusal('REQUEST_MALFORMED', { field: 'toolId' })
      try {
        return await saveCode(deps, scope, { ...input, which: which.data }, key, requestContext)
      } catch (error) {
        return refusedBy(deps, error)
      }
    },
  })
}

type Saving = z.infer<typeof CodeInput> & { which: z.infer<typeof Which> }

async function saveCode(
  deps: CodeToolDeps,
  scope: InProject,
  input: Saving,
  key: string,
  requestContext: RequestContext,
): Promise<CodeSaveResult> {
  const { which, reads, samples } = input
  // Before the machine: the tool is the Projeto's to use, on a connection it received, at this version.
  const connectionId =
    'toolId' in which
      ? await (async () => {
          const held = await deps.tools.get(scope, which.toolId)
          if (held.latest.number !== which.basedOn) {
            throw new Failure('TOOL_REFUSED', {
              named: { field: 'toolId', reason: 'STALE_VERSION' },
            })
          }
          return held.connectionId
        })()
      : which.connectionId
  await deps.tools.fitCode(scope, connectionId, reads)

  const workspace = await deps.machines.workspace(requestContext)
  if (workspace === undefined) throw new Failure('MACHINE_UNAVAILABLE', { details: { reason: 'NONE' } })

  const fixtures: Record<string, unknown> = {}
  for (const operation of reads) {
    const answered = await deps.read(
      { connectionId, operation, input: samples[operation] ?? {} },
      requestContext,
    )
    if (answered.kind !== 'OK' || !('whole' in answered)) {
      return refusal('TOOL_TEST_FAILED', { output: `the read ${operation} answered ${answered.kind}` })
    }
    fixtures[operation] = answered.whole
  }
  const rows = Object.values(fixtures).reduce<number>((sum, whole) => sum + rowsOf(whole), 0)

  const folder = `${deps.machines.folder}/tool-${key.replaceAll(/[^A-Za-z0-9_-]/g, '')}`
  const files = {
    'tool.ts': input.source,
    'tool.test.ts': input.test,
    'fixtures.json': JSON.stringify(fixtures),
    'tsconfig.json': TSCONFIG,
    'biome.json': BIOME,
    'module-state.grit': MODULE_RULE,
    'schemas.ts': SCHEMAS,
  }
  const tool = await checked(deps, workspace, requestContext, folder, files)
  try {
    const result = await pipeline(tool, folder)
    if (result.stage === 'PASSED') {
      return await save(deps, scope, { ...input, connectionId, key }, result, rows)
    }
    if (result.stage === 'MODULE_STATE' && result.output.includes('MODULE_STATE')) {
      return refusal('TOOL_REFUSED', {
        ...{ field: 'source', reason: 'MODULE_STATE', output: result.output },
      })
    }
    logFailure(deps.log, new Failure('TOOL_TEST_FAILED', { details: { stage: result.stage } }))
    return refusal('TOOL_TEST_FAILED', { output: result.output })
  } finally {
    // The fixtures are the company's rows: they leave the machine with the folder, whatever happened.
    await tool.filesystem.rmdir(folder, { recursive: true, force: true })
  }
}

async function save(
  deps: CodeToolDeps,
  scope: InProject,
  input: Saving & { connectionId: ConnectionId; key: string },
  passed: { schemas: Run; module: string },
  rows: number,
): Promise<CodeSaveResult> {
  const schemas = Schemas.parse(JSON.parse(passed.schemas.output))
  if (passed.module.length > CODE_MODULE_MAX) {
    return refusal('TOOL_REFUSED', { field: 'source', reason: 'VALUE_REFUSED' })
  }
  const version = CodeToolVersion.parse({
    ...{ description: input.description, source: input.source, module: passed.module },
    ...{ reads: input.reads, inputSchema: schemas.input, outputSchema: schemas.output },
    test: { passed: true, rows, at: new Date().toISOString() },
  })
  const { which, key } = input
  const tool =
    'toolId' in which
      ? await deps.tools.addCodeVersion(scope, { ...which, version }, key)
      : await deps.tools.saveCode(scope, { ...which, version }, key)
  return { kind: 'SAVED', tool }
}
