import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { AppVersion, CompanyId, PersonId, PreviewData, ProjectId, RunId } from '@conexus/hub-api'
import { z } from 'zod'
import { createCompanyDatabase } from '../../platform/test-company-postgres.ts'
import type { Hub, Person } from '../identity/test-hub.ts'
import {
  ANA_OWNER,
  BRUNO,
  call,
  hubWithLog,
  memberOn,
  personOn,
  plantCompany,
  post,
} from '../identity/test-hub.ts'

import type { Folder } from './test-version-folder.ts'
import type { VersionFolder } from './versions.ts'
import { folder, MIGRATION } from './test-version-folder.ts'

export type { Folder }
export { folder, MIGRATION }

/**
 * Empresa A with Ana its owner, Bruno a member, and the Projeto Pedidos, whose
 * company database is one of the test server, as Neon would give it: a send there saves a version and reaches the app.
 */
export async function companyForVersions(t: TestContext) {
  const hub = await hubWithLog(t)
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
  return { t, hub, ana, bruno, companyId, projectId, owner, projects, versions }
}

/** Where a send goes: a Projeto of a company. */
type Subject = { t: TestContext; hub: Hub; projects: string; projectId: string }

/** What a send said: the version it saved and whether, and how, it reached the app. */
export type Turned = {
  number: number | undefined
  preview: PreviewData | undefined
  /** The preview as the Hub tells it, to search for what must never be in it. */
  raw: string
}

/** The companies' id in the Projetos' URL the subject names (`/api/companies/<id>/projects`). */
function companyOf(projects: string): CompanyId {
  return CompanyId.parse(projects.split('/')[3])
}

/**
 * Sends a version as the person, through the apps' door a Builder turn's end calls
 * (`sendFromBuilder`), as the next number of the Projeto.
 */
export async function send(
  subject: Subject,
  person: Person,
  version: Folder = folder(),
  options: { projectId?: string } = {},
): Promise<Turned> {
  const { hub } = subject
  const projectId = ProjectId.parse(options.projectId ?? subject.projectId)
  const [last] = await hub.test.asOwner(
    'select coalesce(max(number), 0) as number from apps.app_version where project_id = $1',
    [projectId],
  )
  const number = z.coerce.number().parse(last?.number) + 1
  const sent = await hub.apps.sendFromBuilder({
    ...{ companyId: companyOf(subject.projects), projectId, personId: PersonId.parse(person.id) },
    ...{ runId: RunId.parse(randomUUID()), number, folder: version as VersionFolder },
  })
  // As the stream said it: JSON drops the keys that are `undefined`.
  const raw = JSON.stringify(sent)
  const preview = sent === undefined ? undefined : PreviewData.parse(JSON.parse(raw))
  return { number: preview === undefined ? undefined : number, preview, raw }
}

/** The Projeto's versions as its owner lists them on the Versões tab, newest first. */
export async function listed(
  subject: Pick<Subject, 'hub' | 'projects' | 'projectId'> & { ana: Person },
  projectId = subject.projectId,
): Promise<AppVersion[]> {
  const read = await call(
    subject.hub,
    subject.ana,
    'GET',
    `${subject.projects}/${projectId}/versions`,
  )
  assert.equal(read.statusCode, 200, read.body)
  return z.array(AppVersion).parse(Object(read.json()).versions)
}

/** The listed version the Builder saved as `number`. */
export async function versionNumbered(
  subject: Parameters<typeof listed>[0],
  number: number | undefined,
  projectId = subject.projectId,
): Promise<AppVersion> {
  const found = (await listed(subject, projectId)).find((version) => version.number === number)
  assert.ok(found !== undefined, `version ${number} is listed`)
  return found
}

/**
 * A version of the Projeto planted in the database as another Hub, or the Hub before a lost disk,
 * left it: `sending` holds the Projeto's claim for `claim` (an interval, past when negative).
 */
export async function plantVersion(
  subject: Pick<Subject, 'hub' | 'projectId'> & { companyId: string; ana: Person },
  version: { id: string; number: number } & (
    | { state: 'ready' }
    | { state: 'sending'; claim: string }
  ),
) {
  const { hub, projectId, companyId } = subject
  await hub.test.asOwner(
    'insert into apps.app (project_id, company_id) values ($1, $2) on conflict do nothing',
    [projectId, companyId],
  )
  await hub.test.asOwner(
    `insert into apps.app_version (id, company_id, project_id, number, state, manifest, digest,
       sent_by, attempt_key, created_at)
     values ($1, $2, $3, $4, $5, '{}', repeat('0', 64), $6, $1, now())`,
    [version.id, companyId, projectId, version.number, version.state, subject.ana.id],
  )
  if (version.state !== 'sending') return
  await hub.test.asOwner(
    `update apps.app set sending_version_id = $1, claimed_until = now() + $2::interval
      where project_id = $3`,
    [version.id, version.claim, projectId],
  )
}
