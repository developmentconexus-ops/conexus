import { listNetworkDomains, readOpenAllNetwork } from '@conexus/hub-api'
import type { Replies } from './layout-harness.ts'
import { ok } from './layout-harness.ts'

export function networkPage(id: string): Replies {
  return {
    [`GET /api/companies/${id}/network/domains`]: ok(listNetworkDomains, { domains: [] }),
    [`GET /api/companies/${id}/network/open-all`]: ok(readOpenAllNetwork, { open: null }),
  }
}

const opened = { grantedBy: 'Ana Lima', grantedAt: '2026-11-12T15:00:00.000Z' }

export function networkFilled(id: string): Replies {
  return {
    [`GET /api/companies/${id}/network/domains`]: ok(listNetworkDomains, {
      domains: [
        {
          id: '00000000-0000-4000-8000-000000000001',
          domain: 'catalogo-de-produtos-da-distribuidora.loja.exemplo.com.br',
          reason: 'ler os produtos e os preços da página inicial',
          ...opened,
        },
        {
          id: '00000000-0000-4000-8000-000000000002',
          domain: '*.cdn.exemplo.com',
          reason: 'baixar as imagens',
          ...opened,
        },
      ],
    }),
    [`GET /api/companies/${id}/network/open-all`]: ok(readOpenAllNetwork, {
      open: { openedBy: 'Ana Lima', openedAt: '2026-11-20T15:00:00.000Z' },
    }),
  }
}
