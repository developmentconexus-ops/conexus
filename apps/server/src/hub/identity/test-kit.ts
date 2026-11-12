import type { Config } from '../../platform/config.ts'
import type { Database } from '../../platform/database.ts'
import type { SendMail } from '../../platform/mail.ts'
import { silent } from '../../platform/test-database.ts'
import { createIdentity } from './public.ts'
import type { RoleKit } from './roles.ts'
import { rolesFor } from './roles.ts'

/** The typed reads of the Sankhya kit, written out so the kit may grow and no test moves (T6). */
export const SANKHYA_READS = [
  'consultar',
  'carregar',
  'empresas',
  'clientes',
  'vendedores',
  'tiposOperacao',
  'naturezas',
  'centrosResultado',
  'buscarParceiros',
  'buscarVendedores',
  'produtos',
  'gruposProduto',
  'buscarProdutos',
  'pedidos',
  'notasFiscais',
  'notaFiscal',
  'devolucoes',
  'notasCanceladas',
  'estoque',
  'estoqueDoProduto',
  'locaisEstoque',
  'estoqueDosProdutos',
  'contasAReceber',
  'contasAPagar',
  'tiposPagamento',
  'precosDoProduto',
  'precosDaTabela',
  'transportadoras',
  'ordensCarga',
] as const

/**
 * The kit the test Hub starts with, written out: two connectors, the door's reads and the
 * Financeiro subject among them, so a test never moves when the real kit grows (T6).
 */
export const TEST_KIT = [
  {
    id: 'sankhya',
    resource: 'connector_sankhya',
    operations: [
      ...SANKHYA_READS.map((id) => ({ id, class: 'read' })),
      { id: 'lancarPedido', class: 'write' },
    ],
  },
  {
    id: 'mercado-livre',
    resource: 'connector_mercado-livre',
    operations: [
      { id: 'anuncios', class: 'read' },
      { id: 'pedidos', class: 'read' },
      { id: 'perguntas', class: 'read' },
    ],
  },
] as const satisfies RoleKit
export const TEST_ROLES = rolesFor(TEST_KIT)

/** The identity a test Hub starts with: the test kit, and no log. */
export function testIdentity(deps: { database: Database; config: Config; sendMail: SendMail }) {
  return createIdentity({ ...deps, kit: TEST_KIT, log: silent })
}
