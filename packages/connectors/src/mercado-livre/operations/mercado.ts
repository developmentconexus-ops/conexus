import { z } from 'zod'
import { get } from '../../kernel/operation.ts'
import { anunciosDetalhe } from './anuncios.ts'
import { fromEarlier, maybe, PathId, readOf } from './shared.ts'

const Tendencias = z.array(z.object({ keyword: z.string(), url: maybe(z.string()) }))

export const tendencias = readOf({
  id: 'tendencias',
  subject: 'mercado',
  docs: 'tendencias',
  summary: 'Lista as buscas em alta no Mercado Livre Brasil, com a palavra e o endereço da busca.',
  label: 'Tendências',
  input: z.object({}),
  output: Tendencias,
  probe: () => ({}),
  request: () => get('/trends/MLB'),
})

const MaisVendidos = z.object({
  content: z.array(
    z.object({ id: z.string(), position: maybe(z.number().int()), type: maybe(z.string()) }),
  ),
})

export const maisVendidos = readOf({
  id: 'maisVendidos',
  subject: 'mercado',
  docs: 'mais-vendidos',
  summary:
    'Lista os mais vendidos de uma categoria do Mercado Livre Brasil, na ordem, com o id e o tipo de cada um.',
  label: 'Mais vendidos',
  input: z.object({ categoryId: PathId }),
  output: MaisVendidos,
  from: [anunciosDetalhe.id],
  probe: (earlier) =>
    fromEarlier(earlier, anunciosDetalhe, (items) => {
      const found = items.find((item) => item.body?.category_id)?.body?.category_id
      return found ? { categoryId: found } : null
    }),
  request: (input) => get(`/highlights/MLB/category/${input.categoryId}`),
})

const Tarifa = z.object({
  listing_type_id: maybe(z.string()),
  listing_type_name: maybe(z.string()),
  currency_id: maybe(z.string()),
  sale_fee_amount: z.number(),
  sale_fee_details: maybe(
    z.object({
      percentage_fee: maybe(z.number()),
      fixed_fee: maybe(z.number()),
      gross_amount: maybe(z.number()),
    }),
  ),
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
  output: Tarifa,
  from: [anunciosDetalhe.id],
  probe: (earlier) =>
    fromEarlier(earlier, anunciosDetalhe, (items) => {
      const found = items.find(
        (item) => item.body?.price && item.body.category_id && item.body.listing_type_id,
      )?.body
      return found?.price && found.category_id && found.listing_type_id
        ? {
            price: found.price,
            categoryId: found.category_id,
            listingTypeId: found.listing_type_id,
          }
        : null
    }),
  request: (input) =>
    get('/sites/MLB/listing_prices', {
      price: input.price,
      category_id: input.categoryId,
      listing_type_id: input.listingTypeId,
    }),
})
