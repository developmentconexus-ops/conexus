import assert from 'node:assert/strict'
import type { TestContext } from 'node:test'
import { ProposedTreatment, TreatedTables, TreatmentModel, VersionView } from '@conexus/hub-api'
import { DAILY, lakeCopyOn, NOTAS, PARCEIROS } from '../copies/test-lake-copy.ts'
import type { Person } from '../identity/test-hub.ts'
import { call, post } from '../identity/test-hub.ts'

const VENDEDORES = { source: 'TGFVEN', name: 'sankhya_vendedores' }
export const OF_NOTAS = 'select nunota, codparc from tratado.sankhya_notas'

type Options = Parameters<typeof lakeCopyOn>[1]

export async function treatmentOn(t: TestContext, options: Options = {}) {
  const on = await lakeCopyOn(t, options)
  const connection = await on.linked()
  const marked = await on.put(connection, { tables: [NOTAS, PARCEIROS, VENDEDORES], ...DAILY })
  assert.equal(marked.statusCode, 200, marked.body)
  await on.hub.lakeRuns.idle()
  const base = `/api/companies/${on.companyId}/data/treated`
  const models = `${base}/models`
  function propose(sql: string, name = 'venda', who: Person = on.ana, description = 'Vendas') {
    return post(on.hub, who, models, { name, description, sql })
  }
  async function proposed(sql: string, name = 'venda') {
    const response = await propose(sql, name)
    assert.equal(response.statusCode, 201, response.body)
    return ProposedTreatment.parse(response.json())
  }
  function change(id: string, sql: string, who: Person = on.ana, description = 'Vendas') {
    return post(on.hub, who, `${models}/${id}/versions`, { sql, description })
  }
  async function changed(id: string, sql: string, description?: string) {
    const response = await change(id, sql, on.ana, description)
    assert.equal(response.statusCode, 201, response.body)
    return VersionView.parse(response.json())
  }
  function approve(id: string, number: number, hash: string, who: Person = on.ana) {
    return post(on.hub, who, `${models}/${id}/versions/${number}/approve`, { hash })
  }
  async function approved(id: string, version: { number: number; hash: string }, who?: Person) {
    const response = await approve(id, version.number, version.hash, who)
    assert.equal(response.statusCode, 200, response.body)
    return VersionView.parse(response.json())
  }
  async function listed(who: Person = on.ana) {
    const response = await call(on.hub, who, 'GET', base)
    assert.equal(response.statusCode, 200, response.body)
    return TreatedTables.parse(response.json())
  }
  async function read(id: string) {
    const response = await call(on.hub, on.ana, 'GET', `${models}/${id}`)
    assert.equal(response.statusCode, 200, response.body)
    return TreatmentModel.parse(response.json())
  }
  function saved() {
    return on.rows(
      `select (select count(*)::int from treatment.model) as models,
              (select count(*)::int from treatment.version) as versions,
              (select count(*)::int from treatment.run) as runs`,
    )
  }
  return {
    ...on,
    ...{ base, models, propose, proposed, change, changed, approve, approved, listed, read, saved },
  }
}

export type TreatmentOn = Awaited<ReturnType<typeof treatmentOn>>

export function tableOf(view: TreatedTables, layer: 'tratado' | 'negocio', name: string) {
  const table = view.tables.find((each) => each.layer === layer && each.name === name)
  assert.ok(table !== undefined, `${layer}.${name}`)
  return table
}

export function refusalOf(response: { statusCode: number; json(): unknown }) {
  const { code, table, position } = Object(response.json())
  return { status: response.statusCode, code, table, position }
}
