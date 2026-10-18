import { randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import type { TestContext } from 'node:test'
import { NeonApiKey, NeonApiUrl, NeonOrgId } from './config.ts'
import type { DatabaseUrl } from './database.ts'
import type { NeonProjects } from './neon.ts'
import { NeonProjectId, NeonProjectName } from './neon.ts'

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

type Call = 'find' | 'create' | 'delete' | 'ownerConnection'
type Scripted = { answer: 'REFUSED' | 'NO_ANSWER'; takesEffect: boolean }

function noScripts(): Record<Call, Scripted[]> {
  return { find: [], create: [], delete: [], ownerConnection: [] }
}

/**
 * A Neon of memory (T14, T15) that answers like the adapter does: the projects it holds by id and
 * name, each call recorded, and the next answers scripted. A scripted silence may still have taken
 * effect, as a cut reply has. `hold` keeps the next `create` before its effect until released.
 */
export function fakeNeon() {
  const live = new Map<NeonProjectId, NeonProjectName>()
  const calls: Call[] = []
  const scripts = noScripts()
  const owners = new Map<NeonProjectId, DatabaseUrl>()
  const holds: { arrived: PromiseWithResolvers<void>; released: PromiseWithResolvers<void> }[] = []
  const afterCreate: ((id: NeonProjectId) => Promise<void>)[] = []
  let serial = 0

  function scripted(call: Call) {
    calls.push(call)
    return scripts[call].shift()
  }

  function plant(name: string): NeonProjectId {
    serial += 1
    const id = NeonProjectId.parse(`neon-${serial}`)
    live.set(id, NeonProjectName.parse(name))
    return id
  }

  const neon: NeonProjects = {
    async find(name) {
      const next = scripted('find')
      if (next !== undefined) return { kind: next.answer }
      const ids = [...live].filter(([, existing]) => existing === name).map(([id]) => id)
      return { kind: 'DONE', value: ids }
    },
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
    projects: () => [...live].map(([id, name]) => ({ id, name })),
    plant,
    /** The owner's address the project answers with: a database of the test server (T19). */
    ownedBy(id: NeonProjectId, owner: DatabaseUrl) {
      owners.set(id, owner)
    },
    /** The next call of this kind answers so; `takesEffect` says the call happened before the answer was lost. */
    script(call: Call, answer: Scripted['answer'], takesEffect = false) {
      scripts[call].push({ answer, takesEffect })
    },
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
 * Neon's API of memory behind a port, for a Hub that runs as a program (T14): list by name, create
 * and delete a project, the three calls the adapter makes.
 */
export async function neonServer(t: TestContext) {
  const live = new Map<string, string>()
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
      if (request.method === 'GET') {
        const search = url.searchParams.get('search') ?? ''
        const projects = [...live].filter(([, name]) => name.includes(search))
        return send(200, {
          projects: projects.map(([projectId, name]) => ({ id: projectId, name })),
        })
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
  }
}
