import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { anunciosDetalhe } from './anuncios.ts'
import { firstId, firstRowWith, PathId, readOf, valueAt } from './shared.ts'

export const tendencias = readOf({
  id: 'tendencias',
  subject: 'mercado',
  docs: 'tendencias',
  summary: 'Lista as buscas em alta no Mercado Livre Brasil, com a palavra e o endereço da busca.',
  label: 'Tendências',
  input: z.object({}),
  list: null,
  probe: () => ({}),
  request: () => get('/trends/MLB'),
})

export const maisVendidos = readOf({
  id: 'maisVendidos',
  subject: 'mercado',
  docs: 'mais-vendidos',
  summary:
    'Lista os mais vendidos de uma categoria do Mercado Livre Brasil, na ordem, com o id e o tipo de cada um.',
  label: 'Mais vendidos',
  input: z.object({ categoryId: PathId }),
  list: 'content',
  from: [anunciosDetalhe.id],
  probe: (earlier) => {
    const categoryId = firstId(earlier, anunciosDetalhe.id, 'body.category_id')
    return categoryId === undefined ? null : { categoryId }
  },
  request: (input) => get(`/highlights/MLB/category/${input.categoryId}`),
})

export const tarifaDeVenda = readOf({
  id: 'tarifaDeVenda',
  subject: 'mercado',
  docs: 'custos-por-vender',
  summary:
    'Calcula a tarifa de venda de um preço numa categoria e tipo de anúncio: o valor e a parte percentual e fixa.',
  label: 'Tarifa de venda',
  input: z.object({
    price: z.number().positive().max(1_000_000_000),
    categoryId: PathId,
    listingTypeId: PathId,
  }),
  list: null,
  from: [anunciosDetalhe.id],
  probe: (earlier) => {
    const row = firstRowWith(earlier, anunciosDetalhe.id, [
      'body.price',
      'body.category_id',
      'body.listing_type_id',
    ])
    const price = row && valueAt(row, 'body.price')
    const categoryId = row && valueAt(row, 'body.category_id')
    const listingTypeId = row && valueAt(row, 'body.listing_type_id')
    return typeof price === 'number' &&
      typeof categoryId === 'string' &&
      typeof listingTypeId === 'string'
      ? { price, categoryId, listingTypeId }
      : null
  },
  request: (input) =>
    get('/sites/MLB/listing_prices', {
      price: input.price,
      category_id: input.categoryId,
      listing_type_id: input.listingTypeId,
    }),
})
