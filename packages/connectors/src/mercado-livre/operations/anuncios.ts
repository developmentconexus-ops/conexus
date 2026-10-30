import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { chain, ids, Limit, Offset, PathId, readOf, sellerOf } from './shared.ts'

export const anuncios = readOf({
  id: 'anuncios',
  subject: 'anuncios',
  docs: 'itens-e-buscas',
  summary:
    'Lista os ids dos anúncios do vendedor, filtrando por status ou SKU, uma página por chamada (até 100). Além de 1000 anúncios, use search_type=scan e o scroll_id devolvido.',
  label: 'Anúncios',
  input: z.object({
    status: z
      .enum(['active', 'paused', 'closed', 'under_review', 'inactive', 'pending'])
      .optional(),
    sku: z.string().min(1).max(100).optional(),
    offset: Offset,
    limit: Limit(100),
    searchType: z.literal('scan').optional(),
    scrollId: z.string().min(1).max(200).optional(),
  }),
  list: 'results',
  probe: () => ({ offset: 0, limit: 5 }),
  request: (input, account) =>
    get(`/users/${sellerOf(account)}/items/search`, {
      status: input.status,
      seller_sku: input.sku,
      offset: input.searchType === 'scan' ? undefined : input.offset,
      limit: input.limit,
      search_type: input.searchType,
      scroll_id: input.scrollId,
    }),
})

export const anunciosDetalhe = readOf({
  id: 'anunciosDetalhe',
  subject: 'anuncios',
  docs: 'itens-e-buscas',
  summary:
    'Mostra o detalhe de até 20 anúncios de uma vez: título, preço, estoque, vendidos, status, categoria e tipo. Cada item vem com o seu código; um 404 num item é daquele id.',
  label: 'Detalhe dos anúncios',
  input: z.object({ ids: z.array(PathId).min(1).max(20) }),
  list: null,
  from: [anuncios.id],
  probe: (earlier) => {
    const found = ids(earlier, anuncios.id, 'id', 20)
    return found.length === 0 ? null : { ids: found }
  },
  request: (input) => get('/items/bulk', { ids: input.ids.join(',') }),
})

/** What a read of one listing shares: its id, taken from the listing search. */
const ofItem = {
  input: z.object({ itemId: PathId }),
  list: null,
  from: [anuncios.id],
  probe: chain(anuncios.id, 'id', (itemId) => ({ itemId })),
}

export const descricao = readOf({
  id: 'descricao',
  subject: 'anuncios',
  docs: 'descricao-de-produtos',
  summary: 'Mostra a descrição, em texto, de um anúncio.',
  label: 'Descrição',
  ...ofItem,
  request: (input) => get(`/items/${input.itemId}/description`),
})

export const estoque = readOf({
  id: 'estoque',
  subject: 'anuncios',
  docs: 'convivencia-full-e-flex',
  summary:
    'Mostra o estoque de um produto do usuário por depósito (próprio, Full, ...). O limite é de 100 chamadas por minuto.',
  label: 'Estoque',
  input: z.object({ userProductId: PathId }),
  list: null,
  from: [anunciosDetalhe.id],
  probe: chain(anunciosDetalhe.id, 'body.user_product_id', (userProductId) => ({ userProductId })),
  request: (input) => get(`/user-products/${input.userProductId}/stock`),
})

export const qualidade = readOf({
  id: 'qualidade',
  subject: 'anuncios',
  docs: 'qualidade-das-publicacoes',
  summary: 'Mostra a nota de qualidade de um anúncio (0 a 100), o nível e quando foi calculada.',
  label: 'Qualidade',
  ...ofItem,
  request: (input) => get(`/item/${input.itemId}/performance`),
})
