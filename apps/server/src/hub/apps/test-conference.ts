import assert from 'node:assert/strict'
import { Manifest } from '@conexus/app-contract'
import { appCheckLogin, appLoginPassword, CompanyId, PersonId, ProjectId } from '@conexus/hub-api'
import pg from 'pg'
import type { DatabaseUrl } from '../../platform/database.ts'
import type { Hub } from '../identity/test-hub.ts'
import type { Conference } from './conference.ts'
import type { Folder } from './test-versions.ts'
import { folder } from './test-versions.ts'

type Subject = { hub: Hub; companyId: string; projectId: string }

export function confer(subject: Subject, person: { id: string }, version: Folder = folder()) {
  return subject.hub.apps.confer.open({
    companyId: CompanyId.parse(subject.companyId),
    projectId: ProjectId.parse(subject.projectId),
    personId: PersonId.parse(person.id),
    folder: { manifest: Manifest.parse(version.manifest), files: version.files },
  })
}

export async function opened(
  subject: Subject,
  person: { id: string },
  version?: Folder,
): Promise<Extract<Conference, { kind: 'OPENED' }>> {
  const answer = await confer(subject, person, version)
  assert.ok(answer.ok && answer.value.kind === 'OPENED', JSON.stringify(answer))
  return answer.value
}

export async function asAppLogin(
  hub: Hub,
  owner: DatabaseUrl,
  login: string,
  text: string,
): Promise<unknown[]> {
  const url = new URL(owner.reveal())
  url.username = login
  url.password = await appLoginPassword({
    key: hub.config.appLoginKey.reveal(),
    login: url.username,
  })
  const client = new pg.Client({ connectionString: url.toString() })
  await client.connect()
  try {
    return (await client.query(text)).rows
  } finally {
    await client.end()
  }
}

export async function checkDatabaseOf(owner: DatabaseUrl, projectId: string) {
  const { schema, runLogin, migrateLogin } = appCheckLogin(ProjectId.parse(projectId))
  const client = new pg.Client({ connectionString: owner.reveal() })
  await client.connect()
  try {
    const found = await client.query('select 1 from pg_namespace where nspname = $1', [schema])
    const roles = await client.query(
      'select rolname from pg_roles where rolname = any($1) order by 1',
      [[runLogin, migrateLogin]],
    )
    return { schema: found.rowCount === 1, logins: roles.rows.map((row) => String(row.rolname)) }
  } finally {
    await client.end()
  }
}
