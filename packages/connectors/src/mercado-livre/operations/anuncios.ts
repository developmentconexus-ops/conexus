import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import {
  fromEarlier,
  Id,
  Limit,
  maybe,
  Offset,
  Paging,
  PathId,
  readOf,
  sellerOf,
} from './shared.ts'

const IdList = z.array(Id)

const Anuncios = z.object({
  results: IdList,
  paging: Paging,
  scroll_id: maybe(z.string()),
})

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
  output: Anuncios,
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

const Anuncio = z.object({
  id: maybe(Id),
  title: maybe(z.string()),
  price: maybe(z.number()),
  currency_id: maybe(z.string()),
  available_quantity: maybe(z.number()),
  sold_quantity: maybe(z.number()),
  status: maybe(z.string()),
  permalink: maybe(z.string()),
  category_id: maybe(z.string()),
  listing_type_id: maybe(z.string()),
  condition: maybe(z.string()),
  user_product_id: maybe(z.string()),
  inventory_id: maybe(z.string()),
  message: maybe(z.string()),
})

const AnunciosDetalhe = z.array(z.object({ code: z.number().int(), body: maybe(Anuncio) }))

export const anunciosDetalhe = readOf({
  id: 'anunciosDetalhe',
  subject: 'anuncios',
  docs: 'itens-e-buscas',
  summary:
    'Mostra o detalhe de até 20 anúncios de uma vez: título, preço, estoque, vendidos, status, categoria e tipo. Cada item vem com o seu código; um 404 num item é daquele id.',
  label: 'Detalhe dos anúncios',
  input: z.object({ ids: z.array(PathId).min(1).max(20) }),
  output: AnunciosDetalhe,
  from: [anuncios.id],
  probe: (earlier) =>
    fromEarlier(earlier, anuncios, ({ results }) =>
      results.length === 0 ? null : { ids: results.slice(0, 20) },
    ),
  request: (input) => get('/items/bulk', { ids: input.ids.join(',') }),
})

const Descricao = z.object({
  plain_text: maybe(z.string()),
  last_updated: maybe(z.string()),
})

export const descricao = readOf({
  id: 'descricao',
  subject: 'anuncios',
  docs: 'descricao-de-produtos',
  summary: 'Mostra a descrição, em texto, de um anúncio.',
  label: 'Descrição',
  input: z.object({ itemId: PathId }),
  output: Descricao,
  from: [anuncios.id],
  probe: (earlier) =>
    fromEarlier(earlier, anuncios, ({ results }) => (results[0] ? { itemId: results[0] } : null)),
  request: (input) => get(`/items/${input.itemId}/description`),
})

const Estoque = z.object({
  user_product_id: maybe(z.string()),
  locations: z.array(z.object({ type: z.string(), quantity: z.number() })),
})

export const estoque = readOf({
  id: 'estoque',
  subject: 'anuncios',
  docs: 'convivencia-full-e-flex',
  summary:
    'Mostra o estoque de um produto do usuário por depósito (próprio, Full, ...). O limite é de 100 chamadas por minuto.',
  label: 'Estoque',
  input: z.object({ userProductId: PathId }),
  output: Estoque,
  from: [anunciosDetalhe.id],
  probe: (earlier) =>
    fromEarlier(earlier, anunciosDetalhe, (items) => {
      const found = items.find((item) => item.body?.user_product_id)?.body?.user_product_id
      return found ? { userProductId: found } : null
    }),
  request: (input) => get(`/user-products/${input.userProductId}/stock`),
})

const Qualidade = z.object({
  item_id: maybe(Id),
  score: maybe(z.number()),
  level: maybe(z.string()),
  level_wording: maybe(z.string()),
  calculated_at: maybe(z.string()),
})

export const qualidade = readOf({
  id: 'qualidade',
  subject: 'anuncios',
  docs: 'qualidade-das-publicacoes',
  summary: 'Mostra a nota de qualidade de um anúncio (0 a 100), o nível e quando foi calculada.',
  label: 'Qualidade',
  input: z.object({ itemId: PathId }),
  output: Qualidade,
  from: [anuncios.id],
  probe: (earlier) =>
    fromEarlier(earlier, anuncios, ({ results }) => (results[0] ? { itemId: results[0] } : null)),
  request: (input) => get(`/item/${input.itemId}/performance`),
})
