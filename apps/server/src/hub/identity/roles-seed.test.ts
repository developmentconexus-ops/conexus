import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { personOn, post } from './test-hub.ts'
import { everyRead, OPERATOR, world } from './test-roles.ts'

/** What the migration wrote, written out: the kit may grow and the migration may not change (D7). */
const MIGRATED_READS = {
  sankhya: [
    'consultar',
    'carregar',
    'empresas',
    'clientes',
    'vendedores',
    'tiposOperacao',
    'naturezas',
    'centrosResultado',
    'produtos',
    'gruposProduto',
    'pedidos',
    'notasFiscais',
    'notaFiscal',
    'devolucoes',
    'notasCanceladas',
    'estoque',
    'locaisEstoque',
    'contasAReceber',
    'contasAPagar',
    'tiposPagamento',
    'precosDoProduto',
    'precosDaTabela',
    'transportadoras',
    'ordensCarga',
  ],
  'mercado-livre': [
    'conta',
    'anuncios',
    'anunciosDetalhe',
    'descricao',
    'estoque',
    'qualidade',
    'pedidos',
    'pedido',
    'pacote',
    'envio',
    'prazoDoEnvio',
    'estoqueFull',
    'perguntas',
    'tempoDeResposta',
    'mensagensNaoLidas',
    'mensagensDoPacote',
    'reclamacoes',
    'reclamacao',
    'devolucao',
    'promocoes',
    'visitas',
    'periodosDeFaturamento',
    'cobrancasDoPeriodo',
    'notaFiscalDoPedido',
    'tendencias',
    'maisVendidos',
    'tarifaDeVenda',
  ],
}

test('a semente: a migração semeia Membro e Desenvolvedor em cada empresa, rodar de novo não duplica, e a empresa nova já nasce com elas', async (t) => {
  const w = await world(t)
  const seed = readdirSync(join(import.meta.dirname, '../../../migrations'))
    .filter((name) => name.endsWith('_company_roles_seed'))
    .map((name) => join(import.meta.dirname, '../../../migrations', name, 'migration.sql'))[0]
  assert.ok(seed)
  const sql = readFileSync(seed, 'utf8')
  await w.hub.test.asOwner('delete from auth.organization_role')
  function rows() {
    return w.hub.test.asOwner(
      'select company_id, role, label, permission from auth.organization_role order by role',
    )
  }
  await w.hub.test.asOwner(sql)
  const first = await rows()
  assert.deepEqual(
    first.map((row) => [row.company_id, row.role, row.label]),
    [
      [w.companyId, 'developer', 'Desenvolvedor'],
      [w.companyId, 'member', 'Membro'],
    ],
  )
  for (const row of first)
    assert.deepEqual(JSON.parse(String(row.permission)), seeded(MIGRATED_READS))
  await w.hub.test.asOwner(sql)
  assert.deepEqual(await rows(), first)

  const central = await personOn(w.hub, OPERATOR)
  const registered = await post(w.hub, central, '/api/clients', {
    cnpj: '12.ABC.345/01DE-35',
    legalName: 'Empresa Nova Ltda',
    name: 'Empresa Nova',
    ownerEmail: 'novo@example.test',
  })
  assert.equal(registered.statusCode, 201)
  const born = await w.hub.test.asOwner(
    'select role, permission from auth.organization_role where company_id = $1 order by role',
    [Object(registered.json()).client.companyId],
  )
  assert.deepEqual(
    born.map((row) => row.role),
    ['developer', 'member'],
  )
  for (const row of born) assert.deepEqual(JSON.parse(String(row.permission)), seeded(everyRead))
})

function seeded(reads: Record<string, string[]>) {
  return Object.fromEntries(
    Object.entries(reads).map(([connector, ids]) => [`connector_${connector}`, ids]),
  )
}
