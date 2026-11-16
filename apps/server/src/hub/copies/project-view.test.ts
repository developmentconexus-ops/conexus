import assert from 'node:assert/strict'
import { test } from 'node:test'
import { PersonId } from '@conexus/hub-api'
import { memberOn } from '../identity/test-hub.ts'
import { copyOf, rolesWorld, VENDAS } from './test-readers.ts'

const DAVI = { name: 'Davi Dev', email: 'davi@example.test' }
const ELIS = { name: 'Elis Admin', email: 'elis@example.test' }
const ALL = [...VENDAS, 'sankhya_clientes'].sort()

test('o Construtor nomeia as cópias não liberadas só do papel de quem conversa', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  const { on } = w
  const developer = await memberOn(on.hub, on.companyId, DAVI, 'developer')
  const admin = await memberOn(on.hub, on.companyId, ELIS, 'admin')
  async function unreleasedFor(personId: string) {
    const view = await on.hub.copies.projectView({
      ...{ companyId: on.companyId, projectId: on.projectId },
      personId: PersonId.parse(personId),
    })
    assert.equal(view.kind, 'COPIES')
    return view.kind === 'COPIES' ? [...view.unreleased].sort() : []
  }
  assert.deepEqual(await unreleasedFor(on.anaId), ALL, 'o dono')
  assert.deepEqual(await unreleasedFor(admin.id), ALL, 'o administrador')
  assert.deepEqual(await unreleasedFor(developer.id), [], 'o desenvolvedor, sem cópia do papel')
  assert.deepEqual(await unreleasedFor(w.brunoId), VENDAS, 'o membro de Vendas')
  assert.deepEqual(await unreleasedFor(w.carlaId), ['sankhya_clientes'], 'a membro de Financeiro')
})

test('a cópia já liberada ao Projeto aparece com as colunas, mesmo fora do papel de quem conversa', async (t) => {
  const w = await rolesWorld(t, 'PLANTED')
  const { on } = w
  await on.hub.copies.grant({
    ...{ companyId: on.companyId, personId: on.anaId, projectId: on.projectId },
    copyId: copyOf(w.copies, 'sankhya_clientes'),
  })
  const view = await on.hub.copies.projectView({
    ...{ companyId: on.companyId, projectId: on.projectId },
    personId: w.brunoId,
  })
  assert.equal(view.kind, 'COPIES')
  if (view.kind !== 'COPIES') return
  assert.deepEqual(
    view.released.map(({ name }) => name),
    ['sankhya_clientes'],
  )
  assert.deepEqual([...view.unreleased].sort(), VENDAS)
  const owner = await on.hub.copies.projectView({
    ...{ companyId: on.companyId, projectId: on.projectId },
    personId: on.anaId,
  })
  assert.equal(owner.kind, 'COPIES')
  if (owner.kind === 'COPIES') assert.deepEqual([...owner.unreleased].sort(), VENDAS)
})
