import { randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { NeonApiKey, NeonApiUrl, NeonOrgId } from './config.ts'
import type { DatabaseUrl } from './database.ts'
import type { NeonProjects } from './neon.ts'
import { NeonProjectId } from './neon.ts'

// Nothing listens on the discard port, so a Hub that reaches Neon without a fake server fails loudly.
export const NO_NEON_SERVER = 'http://127.0.0.1:9/api/v2'
export const TEST_NEON_ORG = 'org-test-0000'

/** The Neon part of a test configuration; the key is fresh for each call. */
export function testNeon(apiUrl = NO_NEON_SERVER) {
  return {
    neonApiUrl: NeonApiUrl.parse(apiUrl),
    neonOrgId: NeonOrgId.parse(TEST_NEON_ORG),
    neonApiKey: NeonApiKey.parse(randomBytes(16).toString('hex')),
  }
}

type Call = 'find' | 'list' | 'create' | 'rename' | 'delete' | 'ownerConnection'
type Scripted = { answer: 'REFUSED' | 'NO_ANSWER'; takesEffect: boolean }

/** The projects of a Neon of memory, by id and name. */
function projectsIn(live: Map<NeonProjectId, string>) {
  return [...live].map(([id, name]) => ({ id, name }))
}

/** Each call recorded, and the next answers of each kind as a test scripts them. */
function scriptBook() {
  const calls: Call[] = []
  const scripts: Record<Call, Scripted[]> = {
    find: [],
    list: [],
    create: [],
    rename: [],
    delete: [],
    ownerConnection: [],
  }
  return {
    calls,
    scripted(call: Call) {
      calls.push(call)
      return scripts[call].shift()
    },
    /** The next call of this kind answers so; `takesEffect` says the call happened before the answer was lost. */
    script(call: Call, answer: Scripted['answer'], takesEffect = false) {
      scripts[call].push({ answer, takesEffect })
    },
  }
}

/**
 * A Neon of memory (T14, T15) that answers like the adapter does: the projects it holds by id and
 * name, found by the exact `-<companyId>` ending as decision 0048's proof showed, each call
 * recorded, and the next answers scripted. A scripted silence may still have taken
 * effect, as a cut reply has. `hold` keeps the next `create` before its effect until released.
 */
export function fakeNeon() {
  const live = new Map<NeonProjectId, string>()
  const { calls, scripted, script } = scriptBook()
  const owners = new Map<NeonProjectId, DatabaseUrl>()
  const holds: { arrived: PromiseWithResolvers<void>; released: PromiseWithResolvers<void> }[] = []
  const afterCreate: ((id: NeonProjectId) => Promise<void>)[] = []
  let serial = 0

  function plant(name: string): NeonProjectId {
    serial += 1
    const id = NeonProjectId.parse(`neon-${serial}`)
    live.set(id, name)
    return id
  }

  /** A read answers its script, or what Neon holds now. */
  function read<T>(call: Call, value: () => T) {
    const next = scripted(call)
    return next === undefined ? { kind: 'DONE' as const, value: value() } : { kind: next.answer }
  }

  const neon: NeonProjects = {
    find: async (companyId) =>
      read('find', () => projectsIn(live).filter(({ name }) => name.endsWith(`-${companyId}`))),
    list: async () => read('list', () => projectsIn(live)),
    async create(name) {
      const next = scripted('create')
      const held = holds.shift()
      if (held !== undefined) {
        held.arrived.resolve()
        await held.released.promise
      }
      if (next !== undefined && !next.takesEffect) return { kind: next.answer }
      const id = plant(name)
      await afterCreate.shift()?.(id)
      return next === undefined ? { kind: 'DONE', value: id } : { kind: next.answer }
    },
    async rename(id, name) {
      const next = scripted('rename')
      if (next !== undefined && !next.takesEffect) return { kind: next.answer }
      if (!live.has(id)) return { kind: 'DONE', value: 'gone' }
      live.set(id, name)
      return next === undefined ? { kind: 'DONE', value: 'renamed' } : { kind: next.answer }
    },
    async delete(id) {
      const next = scripted('delete')
      if (next !== undefined && !next.takesEffect) return { kind: next.answer }
      live.delete(id)
      return next === undefined ? { kind: 'DONE', value: 'deleted' } : { kind: next.answer }
    },
    async ownerConnection(id) {
      const next = scripted('ownerConnection')
      const owner = owners.get(id)
      if (next !== undefined || owner === undefined) return { kind: next?.answer ?? 'REFUSED' }
      return { kind: 'DONE', value: owner }
    },
  }

  return {
    neon,
    calls,
    /** The projects Neon holds now, by id and name. */
    projects: () => projectsIn(live),
    plant,
    /** The owner's address the project answers with: a database of the test server (T19). */
    ownedBy(id: NeonProjectId, owner: DatabaseUrl) {
      owners.set(id, owner)
    },
    script,
    /** Runs after the next `create` has made its project and before it answers. */
    whenCreated(work: (id: NeonProjectId) => Promise<void>) {
      afterCreate.push(work)
    },
    /** Keeps the next `create` before its effect; `arrived` resolves when it is waiting. */
    hold() {
      const held = {
        arrived: Promise.withResolvers<void>(),
        released: Promise.withResolvers<void>(),
      }
      holds.push(held)
      return { arrived: held.arrived.promise, release: () => held.released.resolve() }
    },
  }
}

const FINISHED = [{ id: 'op-1', project_id: 'p', status: 'finished', action: 'create_timeline' }]

/**
 * Neon's API of memory behind a port, for a Hub that runs as a program (T14): list, whose `search`
 * matches a piece of a name or an id and whose pages end with an empty one, create, rename and
 * delete a project, and the owner's address of one, the calls the adapter makes.
 */
export async function neonServer(t: TestContext) {
  const live = new Map<string, string>()
  const owners = new Map<string, DatabaseUrl>()
  const server = createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', (chunk: Buffer) => chunks.push(chunk))
    request.on('end', () => {
      const url = new URL(request.url ?? '', 'http://neon.example.test')
      const id = url.pathname.split('/').at(-1) ?? ''
      function send(status: number, body: unknown) {
        response.writeHead(status, { 'content-type': 'application/json' })
        response.end(JSON.stringify(body))
      }
      if (request.method === 'GET' && id === 'connection_uri') {
        const owner = owners.get(url.pathname.split('/').at(-2) ?? '')
        if (owner === undefined) return send(404, { code: '', message: 'project not found' })
        return send(200, { uri: owner.reveal() })
      }
      if (request.method === 'GET') {
        const search = url.searchParams.get('search') ?? ''
        const cursor = url.searchParams.get('cursor')
        const found = [...live].filter(([key, name]) => `${key} ${name}`.includes(search))
        return send(200, {
          projects: cursor === null ? found.map(([key, name]) => ({ id: key, name })) : [],
          pagination: { cursor: cursor ?? 'cursor-1' },
        })
      }
      if (request.method === 'PATCH') {
        if (!live.has(id)) return send(404, { code: '', message: 'project not found' })
        const { project } = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        live.set(id, project.name)
        return send(200, { project: { id, name: project.name }, operations: [] })
      }
      if (request.method === 'POST') {
        const { project } = JSON.parse(Buffer.concat(chunks).toString('utf8'))
        const created = `neon-${live.size + 1}-${randomBytes(3).toString('hex')}`
        live.set(created, project.name)
        return send(201, { project: { id: created, name: project.name }, operations: FINISHED })
      }
      if (!live.delete(id)) return send(404, { code: '', message: 'project not found' })
      return send(200, { project: { id, name: '' }, operations: FINISHED })
    })
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })
  const address = server.address()
  if (address === null || typeof address !== 'object') throw new Error('Neon server has no port')
  return {
    url: `http://127.0.0.1:${address.port}/api/v2`,
    projects: () => [...live].map(([id, name]) => ({ id, name })),
    /** The project's owner address is this database's. */
    ownedBy(id: string, owner: DatabaseUrl) {
      owners.set(id, owner)
    },
  }
}
