import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { createCompanyDatabase } from '../../platform/test-company-postgres.ts'
import type { Hub, Person } from '../identity/test-hub.ts'
import {
  ANA_OWNER,
  BRUNO,
  hubWithMail,
  memberOn,
  personOn,
  plantCompany,
  post,
} from '../identity/test-hub.ts'

export const MIGRATION = {
  id: '001_recado',
  statements: [
    'CREATE TABLE recado (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, texto text NOT NULL)',
  ],
}

function base64(value: string): string {
  return Buffer.from(value).toString('base64')
}

/** A folder as the screen sends it: a small Recados, its files in base64 (T19). */
export function folder(change: Record<string, unknown> = {}, color = '#0b6e4f') {
  const manifest = {
    contract: 1,
    entry: 'worker.js',
    operations: {
      listarRecados: { input: { type: 'object', properties: {} }, output: { type: 'string' } },
    },
    migrations: [MIGRATION],
    assets: ['index.html', 'style.css'],
    ...change,
  }
  return {
    manifest,
    files: [
      { path: 'worker.js', mediaType: 'text/javascript', base64: base64('export default {}') },
      { path: 'assets/index.html', mediaType: 'text/html', base64: base64('<h1>Recados</h1>') },
      { path: 'assets/style.css', mediaType: 'text/css', base64: base64(`:root{--cor:${color}}`) },
    ],
  }
}

/**
 * Empresa A with Ana its owner, Bruno a member, and the Projeto Pedidos, whose company database is
 * one of the test server, as Neon would give it.
 */
export async function companyForVersions(t: TestContext) {
  const hub = await hubWithMail(t)
  const ana = await personOn(hub, ANA_OWNER)
  const companyId = await plantCompany(hub.test, ana.id, 'Empresa A', 'empresa-a')
  const bruno = await memberOn(hub, companyId, BRUNO, 'member')
  const projects = `/api/companies/${companyId}/projects`
  const made = await post(hub, ana, projects, { name: 'Pedidos' })
  const projectId = String(Object(made.json()).project.id)
  const [neonProject] = hub.neon.projects()
  if (neonProject === undefined) throw new Error('no company database')
  const owner = await createCompanyDatabase(t)
  hub.neon.ownedBy(neonProject.id, owner)
  const versions = `${projects}/${projectId}/versions`
  return { hub, ana, bruno, companyId, projectId, owner, projects, versions }
}

/** Sends a version as the person, under its attempt key. */
export function send(
  hub: Hub,
  person: Person,
  url: string,
  body: unknown = folder(),
  key: string = randomUUID(),
) {
  return post(hub, person, url, body, key)
}
