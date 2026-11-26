import { randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { z } from 'zod'
import type { Creation, ServedStack, WireAnswer } from './test-aws.ts'
import {
  awsRecording,
  sessionReply,
  settled,
  stackReply,
  TEST_AWS_ACCOUNT,
  TEST_AWS_REGION,
  testAwsCredentials,
} from './test-aws.ts'
import { objectAnswer } from './test-aws-objects.ts'
import type { ServedTask, TaskStop } from './test-aws-scripts.ts'
import {
  aboutTask,
  CopyStart,
  EXITED,
  RECORDED_TASK,
  receiveFrom,
  reply,
  STOPPED_BY_HUB,
  scripted,
  stoppedTask,
  TASK_PATH,
} from './test-aws-scripts.ts'

const DIARIES: Record<Creation, string> = {
  SUCCEEDS: 'describe-stack-events-pronta',
  FAILS: 'describe-stack-events-falha',
  NAME_HELD: 'describe-stack-events-nome-preso',
}
const RunRequest = z.looseObject({ clientToken: z.string(), startedBy: z.string() })
const Asked = z.looseObject({
  Name: z.string().optional(),
  Value: z.string().optional(),
  task: z.string().optional(),
  tasks: z.array(z.string()).optional(),
  startedBy: z.string().optional(),
  desiredStatus: z.string().optional(),
  taskDefinition: z.string().optional(),
  ReceiptHandle: z.string().optional(),
})
const Tables = z.looseObject({ tables: z.array(z.looseObject({})) })

class AwsState {
  readonly stacks = new Map<string, ServedStack>()
  readonly stackTokens = new Map<string, string>()
  readonly parameters = new Map<string, string>()
  readonly tasks = new Map<string, ServedTask>()
  readonly tables = new Set<string>()
  readonly objects = new Map<string, string>()
  readonly queue: { handle: string; body: string }[] = []
  readonly start = new CopyStart()
  creation: Creation = 'SUCCEEDS'
  stopLag = 0
  readonly calls: string[] = []

  query(form: URLSearchParams): WireAnswer {
    const action = form.get('Action')
    if (action === 'AssumeRole') return { status: 200, body: sessionReply() }
    if (action === 'CreateStack') return this.createStack(form)
    const asked = form.get('StackName') ?? ''
    // CloudFormation takes the stack's id or, while it exists, its name.
    const id =
      [...this.stacks].find(([key, held]) => key === asked || held.name === asked)?.[0] ?? asked
    const stack = this.stacks.get(id)
    if (stack === undefined) return awsRecording('describe-stacks-inexistente')
    if (action === 'DescribeStackEvents') {
      return { status: 200, body: stackReply(DIARIES[stack.creation], id, stack) }
    }
    if (action === 'DescribeStacks') {
      const body = stackReply('describe-stacks-pronta', id, stack)
      stack.status = settled(stack)
      return { status: 200, body }
    }
    if (action === 'DeleteStack') {
      if (stack.status === 'CREATE_COMPLETE') stack.status = 'DELETE_IN_PROGRESS'
      return awsRecording('delete-stack')
    }
    return { status: 501, body: '' }
  }

  private createStack(form: URLSearchParams): WireAnswer {
    const token = form.get('ClientRequestToken') ?? ''
    const name = form.get('StackName') ?? ''
    const id =
      this.stackTokens.get(token) ??
      `arn:aws:cloudformation:${TEST_AWS_REGION}:${TEST_AWS_ACCOUNT}:stack/${name}/${randomUUID()}`
    if (!this.stacks.has(id)) {
      this.stacks.set(id, { name, status: 'CREATE_IN_PROGRESS', creation: this.creation })
    }
    this.stackTokens.set(token, id)
    const asked: ServedStack = { name: '', status: 'CREATE_IN_PROGRESS', creation: this.creation }
    return { status: 200, body: stackReply('create-stack-mesma-chave', id, asked) }
  }

  end(task: ServedTask, how: TaskStop = 'STOPPED_BY_HUB', stoppedAt: Date | null = null): void {
    task.stopped = true
    task.stopping = null
    task.stoppedAt = stoppedAt?.getTime() ?? null
    const recorded = how === 'EXITED' ? EXITED : STOPPED_BY_HUB
    if (recorded === undefined) throw new Error(`no recorded stop ${how}`)
    const body = recorded.body
      .replaceAll(recorded.taskArn, task.arn)
      .replaceAll(recorded.startedBy, task.startedBy)
    this.queue.push({ handle: randomUUID(), body })
  }

  json(target: string, text: string): WireAnswer {
    const asked = Asked.parse(JSON.parse(text))
    this.calls.push(target)
    switch (target) {
      case 'PutParameter':
      case 'DeleteParameter':
        return this.parameter(target, asked)
      case 'RunTask':
        return this.runTask(asked, text)
      case 'DescribeTasks':
      case 'ListTasks':
      case 'StopTask':
        return this.taskRead(target, asked)
      case 'DeleteMessage':
        return this.acknowledge(asked)
      default:
        return { status: 501, body: '' }
    }
  }

  private parameter(target: string, asked: z.infer<typeof Asked>): WireAnswer {
    const name = asked.Name ?? ''
    if (target === 'PutParameter') {
      this.start.wrote()
      const known = this.parameters.has(name)
      this.parameters.set(name, asked.Value ?? '')
      return awsRecording(known ? 'put-parameter-sobrescreve' : 'put-parameter')
    }
    const known = this.parameters.delete(name)
    return awsRecording(known ? 'delete-parameter' : 'delete-parameter-inexistente')
  }

  private runTask(asked: z.infer<typeof Asked>, text: string): WireAnswer {
    const request = RunRequest.parse(JSON.parse(text))
    if (asked.taskDefinition !== 'conexus-copia')
      return awsRecording('run-task-familia-inexistente')
    const known = this.tasks.get(request.clientToken)
    if (known !== undefined) {
      return known.request === text
        ? aboutTask('run-task-mesma-chave', known)
        : awsRecording('run-task-outro-pedido')
    }
    const arn = RECORDED_TASK.replace(
      /[0-9a-f]{32}$/,
      (this.tasks.size + 16).toString(16).padStart(32, '0'),
    )
    const task = {
      arn,
      startedBy: request.startedBy,
      token: request.clientToken,
      request: text,
      stopped: false,
      stoppedAt: null,
      stopping: null,
    }
    this.tasks.set(request.clientToken, task)
    return aboutTask('run-task', task)
  }

  private byArn(arn: string | undefined): ServedTask | undefined {
    return [...this.tasks.values()].find((task) => task.arn === arn)
  }

  private taskRead(target: string, asked: z.infer<typeof Asked>): WireAnswer {
    if (target === 'ListTasks') {
      const wanted = asked.desiredStatus === 'STOPPED'
      const arns = [...this.tasks.values()]
        .filter((task) => task.startedBy === asked.startedBy && task.stopped === wanted)
        .map((task) => task.arn)
      return reply('list-tasks-vazio', () => JSON.stringify({ taskArns: arns }))
    }
    const asking = target === 'StopTask' ? asked.task : asked.tasks?.[0]
    const task = this.byArn(asking)
    if (target === 'DescribeTasks') {
      if (task === undefined)
        return reply('describe-tasks-inexistente', (body) =>
          body.replace(TASK_PATH, TASK_PATH.exec(asking ?? '')?.[0] ?? ''),
        )
      if (task.stopping !== null && task.stopping > 0) task.stopping -= 1
      else if (task.stopping !== null) this.end(task)
      return task.stopped ? stoppedTask(task) : aboutTask('describe-tasks-rodando', task)
    }
    if (task === undefined) return awsRecording('stop-task-inexistente')
    if (task.stopped) return aboutTask('stop-task-parada', task)
    if (this.stopLag === 0) this.end(task)
    else task.stopping ??= this.stopLag
    return aboutTask('stop-task', task)
  }

  private acknowledge(asked: z.infer<typeof Asked>): WireAnswer {
    const at = this.queue.findIndex(({ handle }) => handle === asked.ReceiptHandle)
    if (at < 0) return awsRecording('delete-message-invalido')
    this.queue.splice(at, 1)
    return awsRecording('delete-message')
  }

  rest(method: string, path: string, text = ''): WireAnswer {
    if (method === 'GET' && path.startsWith('/tables/')) return this.listTables()
    if (method === 'DELETE' && path.startsWith('/tables/')) {
      const [namespace, name] = path.split('/').slice(-2)
      this.calls.push('DeleteTable')
      const known = this.tables.delete(`${namespace}/${name}`)
      return awsRecording(known ? 'delete-table' : 'delete-table-inexistente')
    }
    if (method === 'GET' && path.startsWith('/buckets/')) {
      return awsRecording(
        this.creation === 'NAME_HELD'
          ? 'get-table-bucket-nome-preso'
          : 'get-table-bucket-nunca-existiu',
      )
    }
    return objectAnswer(this.objects, method, decodeURIComponent(path.slice(1)), text, this.calls)
  }

  private listTables(): WireAnswer {
    const [template] = Tables.parse(JSON.parse(awsRecording('list-tables').body)).tables
    const tables = [...this.tables].map((key) => {
      const [namespace, name] = key.split('/')
      return { ...template, namespace: [namespace], name }
    })
    return reply('list-tables', () => JSON.stringify({ tables }))
  }
}

/**
 * STS, CloudFormation, ECS, SSM, SQS and S3 Tables behind a port, with state, from the recorded
 * answers, for a Hub that runs as a program and the QA (T14, card L.17): a stack finishes at the
 * second read, as does a deletion, or fails as a recorded diary did (`creation`); a parameter,
 * a task and a table are kept by name; a stopped task puts its recorded STOPPED event in the queue,
 * and `enqueue` puts a message the task sent.
 */
export async function awsServer(t: TestContext, options: { creation?: Creation } = {}) {
  const state = new AwsState()
  state.creation = options.creation ?? 'SUCCEEDS'
  const server = createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', async () => {
      const text = Buffer.concat(chunks).toString('utf8')
      const target = request.headers['x-amz-target']
      const answer = await answerOf(
        state,
        request.method ?? 'GET',
        request.url ?? '/',
        target,
        text,
      )
      response.writeHead(answer.status, {
        'content-type': answer.contentType ?? 'text/xml',
        ...(answer.errorType === undefined ? {} : { 'x-amzn-errortype': answer.errorType }),
      })
      response.end(answer.body)
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  if (address === null || typeof address !== 'object') throw new Error('AWS server has no port')
  return {
    endpoint: new URL(`http://127.0.0.1:${address.port}`),
    credentialsFile: testAwsCredentials(t),
    /** The stacks it holds, by id and status. */
    stacks: () => [...state.stacks].map(([id, stack]) => ({ id, ...stack })),
    /** The run parameters it holds, by name; `parameter` gives one's value as the task reads it. */
    parameters: () => [...state.parameters.keys()],
    parameter: (name: string) => state.parameters.get(name),
    /** The tasks it started, by ARN and round; `requests` gives each one's `RunTask` as it came on the wire. */
    tasks: () =>
      [...state.tasks.values()].map(({ arn, startedBy, stopped }) => ({ arn, startedBy, stopped })),
    requests: () => [...state.tasks.values()].map(({ request }) => request),
    /** Tables the lake holds, as `raw/name`. */
    seedTables: (...tables: string[]) => {
      for (const table of tables) state.tables.add(table)
    },
    tables: () => [...state.tables],
    objects: () => new Map(state.objects),
    putObject: (key: string, text: string) => state.objects.set(key, text),
    /** A message the task sent to the queue. */
    enqueue: (body: string) => state.queue.push({ handle: randomUUID(), body }),
    /** The task ends: its STOPPED event reaches the queue, as the Hub's stop or as the container's exit. */
    endTask: (arn: string, how?: TaskStop, stoppedAt?: Date) => {
      const task = [...state.tasks.values()].find((each) => each.arn === arn)
      if (task === undefined) throw new Error(`no task ${arn}`)
      state.end(task, how, stoppedAt)
    },
    /** How many reads of a task's state stay RUNNING after its `StopTask` (0: it stops at once). */
    lagStops: (reads: number) => {
      state.stopLag = reads
    },
    /** The calls of the rounds' actions it answered, in order (DeleteParameter, StopTask, DescribeTasks, DeleteTable...). */
    calls: () => [...state.calls],
    /** How many messages wait in the queue, and their bodies, as a consumer reads them. */
    queued: () => state.queue.length,
    messages: () => state.queue.map(({ body }) => body),
    /** The copy's start: the parameters' arrivals and the scripted answers. */
    start: state.start,
  }
}

async function answerOf(
  state: AwsState,
  method: string,
  url: string,
  target: string | string[] | undefined,
  text: string,
): Promise<WireAnswer> {
  if (typeof target === 'string') {
    const operation = target.split('.').pop() ?? ''
    if (operation === 'ReceiveMessage') return receiveFrom(state.queue)
    return scripted(state.start.scripts, operation, () => state.json(operation, text))
  }
  if (method === 'POST' && new URLSearchParams(text).has('Action')) {
    return state.query(new URLSearchParams(text))
  }
  return state.rest(method, new URL(url, 'http://double').pathname, text)
}
